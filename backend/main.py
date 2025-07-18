# main.py
# This is the updated backend server with database integration.

# --- Imports ---
import os
import json
import aiohttp
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Database-related imports
from sqlalchemy.orm import Session

# Changed from relative to absolute imports to fix the startup error.
import models
import database

# --- Load Environment Variables ---
load_dotenv()

# --- Database Initialization ---
# This creates the database tables based on our models if they don't exist.
# We will use Alembic for migrations in a real app, but this is good for setup.
models.Base.metadata.create_all(bind=database.engine)

# --- Application Initialization ---
app = FastAPI(
    title="AI Code Review and Documentation Assistant API",
    description="An API that uses a Large Language Model to analyze and document code, with history.",
    version="2.0.0",
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Models ---
class CodeInput(BaseModel):
    code: str
    language: str


class AnalysisResult(BaseModel):
    explanation: str
    suggestions: list[str]
    bugs: list[str]


# --- Dependency for Database Session ---
# This function provides a database session to our API endpoints.
# Using Depends() allows FastAPI to manage the session's lifecycle (opening and closing).
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- API Endpoints ---


@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_code(payload: CodeInput, db: Session = Depends(get_db)):
    """
    Receives code, sends it to the Gemini API, saves the result to the database,
    and returns the structured response.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="GEMINI_API_KEY not found in environment variables."
        )

    prompt = f"""
    As an expert code reviewer for {payload.language}, please analyze the following code snippet.
    Provide your analysis in a structured JSON format. Your response must be a single JSON object with three keys: "explanation", "suggestions", and "bugs".
    - "explanation": A clear, concise explanation of what the code does.
    - "suggestions": A list of actionable suggestions to improve the code's quality, performance, or readability. If no suggestions, provide an empty list.
    - "bugs": A list of potential bugs or logical errors. If no bugs are found, provide an empty list.

    Code to analyze:
    ```{payload.language}
    {payload.code}
    ```
    """
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    gemini_payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "explanation": {"type": "STRING"},
                    "suggestions": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "bugs": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
            },
        },
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                api_url, headers=headers, json=gemini_payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    if (
                        result.get("candidates")
                        and result["candidates"][0].get("content")
                        and result["candidates"][0]["content"].get("parts")
                    ):
                        analysis_text = result["candidates"][0]["content"]["parts"][0][
                            "text"
                        ]
                        analysis_json = json.loads(analysis_text)

                        # --- Save to Database ---
                        db_record = models.AnalysisHistory(
                            language=payload.language,
                            code=payload.code,
                            explanation=analysis_json.get("explanation", ""),
                            # We store lists as JSON strings in the database
                            suggestions=json.dumps(
                                analysis_json.get("suggestions", [])
                            ),
                            bugs=json.dumps(analysis_json.get("bugs", [])),
                        )
                        db.add(db_record)
                        db.commit()
                        db.refresh(db_record)
                        # --- End Save to Database ---

                        return analysis_json
                    else:
                        raise HTTPException(
                            status_code=500,
                            detail={
                                "error": "Invalid response structure from Gemini API.",
                                "details": result,
                            },
                        )
                else:
                    error_details = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail={
                            "error": "Gemini API request failed",
                            "details": error_details,
                        },
                    )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "An unexpected error occurred.", "details": str(e)},
        )


@app.get("/api/history")
def get_analysis_history(db: Session = Depends(get_db)):
    """
    Retrieves all analysis records from the database, ordered by the most recent first.
    """
    history = (
        db.query(models.AnalysisHistory)
        .order_by(models.AnalysisHistory.created_at.desc())
        .all()
    )
    # We need to parse the JSON strings back into lists for the frontend
    for record in history:
        record.suggestions = json.loads(record.suggestions)
        record.bugs = json.loads(record.bugs)
    return history
