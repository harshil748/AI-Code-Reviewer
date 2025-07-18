# main.py
# This file sets up the backend server for our AI Code Reviewer application.
# We use FastAPI, a modern, fast web framework for building APIs with Python.

# --- Imports ---
# - FastAPI: The main framework for building the API.
# - BaseModel from Pydantic: For data validation and defining the structure of our request body.
# - CORSMiddleware: To allow our future frontend application (on a different domain) to communicate with this backend.
# - aiohttp: An asynchronous HTTP client/server library we'll use to make the API call to Gemini.
# - os: To access environment variables.
# - load_dotenv from dotenv: To load environment variables from a .env file for local development.
import os
import json
import aiohttp
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# --- Load Environment Variables ---
# This line loads the variables from a .env file into your environment.
# It's great for keeping sensitive data like API keys out of your code.
load_dotenv()

# --- Application Initialization ---
# Create an instance of the FastAPI class. This 'app' will be our main point of interaction.
app = FastAPI(
    title="AI Code Review and Documentation Assistant API",
    description="An API that uses a Large Language Model to analyze and document code.",
    version="1.0.0",
)

# --- CORS (Cross-Origin Resource Sharing) ---
# This is a security feature that browsers implement. Since our frontend and backend will run on different
# origins (e.g., localhost:3000 and localhost:8000), we need to explicitly allow the browser
# to make requests from the frontend to the backend.
# We allow all origins ("*"), methods, and headers for simplicity during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Model for Request Body ---
# This class defines the expected structure and data type of the JSON object
# that our API endpoint will receive. FastAPI will automatically validate incoming requests against this model.
# If the request doesn't match, it will return a helpful error message.
class CodeInput(BaseModel):
    code: str
    language: str  # e.g., "python", "javascript"


# --- API Endpoint: /api/analyze ---
# This is the core endpoint of our application.
# It's a POST endpoint because the client is sending data (the code to be analyzed) to the server.
# The 'async' keyword means the function can perform long-running I/O operations (like an API call)
# without blocking the entire server.
@app.post("/api/analyze")
async def analyze_code(payload: CodeInput):
    """
    Receives code from the user, sends it to the Gemini API for analysis,
    and returns the structured response.
    """
    # 1. Get the API Key from environment variables
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # If the API key is not found, raise an HTTPException.
        # This is a secure way to stop the process and inform the developer.
        raise HTTPException(
            status_code=500, detail="GEMINI_API_KEY not found in environment variables."
        )

    # 2. Construct the prompt for the Gemini model.
    # A detailed prompt is crucial for getting a high-quality, structured response.
    # We are asking for three specific things: an explanation, improvement suggestions, and potential bugs.
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

    # 3. Prepare the request for the Gemini API.
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    headers = {"Content-Type": "application/json"}

    # We are asking the model to return a JSON object, so we set the responseMimeType.
    # We also provide a schema to ensure the output is in the format we expect.
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

    # 4. Make the asynchronous API call using aiohttp.
    # Using 'async with' ensures the session is properly closed even if errors occur.
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                api_url, headers=headers, json=gemini_payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    # The response text is inside a nested structure. We need to parse it.
                    if (
                        result.get("candidates")
                        and result["candidates"][0].get("content")
                        and result["candidates"][0]["content"].get("parts")
                    ):

                        # The actual JSON response is a string within the 'text' field, so we parse it again.
                        analysis_text = result["candidates"][0]["content"]["parts"][0][
                            "text"
                        ]
                        analysis_json = json.loads(analysis_text)
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
                    # If the API call fails, return an error message with the status code.
                    error_details = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail={
                            "error": f"Gemini API request failed",
                            "details": error_details,
                        },
                    )
    except Exception as e:
        # Catch any other exceptions during the process.
        raise HTTPException(
            status_code=500,
            detail={"error": "An unexpected error occurred.", "details": str(e)},
        )


# --- How to Run This Server ---
# 1. Make sure you have Python installed.
# 2. Open your terminal and navigate to the `backend` folder.
# 3. Create a virtual environment: python3 -m venv venv
# 4. Activate it: source venv/bin/activate
# 5. Install the required libraries: pip install fastapi "uvicorn[standard]" aiohttp python-dotenv
# 6. Get your API key from Google AI Studio.
# 7. Create a file named .env in the `backend` folder.
# 8. In the .env file, add your API key like this (replace YOUR_API_KEY_HERE with your actual key):
#    GEMINI_API_KEY=YOUR_API_KEY_HERE
# 9. Save the .env file.
# 10. Run the server: uvicorn main:app --reload
#
# Your API will be running at http://127.0.0.1:8000
# You can access the interactive API documentation at http://127.0.0.1:8000/docs
