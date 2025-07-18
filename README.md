# AI Code Review & Documentation Assistant

This is a full-stack web application that leverages the power of Large Language Models (LLMs) to provide instant code analysis, improvement suggestions, and documentation. Users can paste a code snippet, select the programming language, and receive an AI-generated review. All analyses are saved in a history log for future reference.

## ✨ Features

* **AI-Powered Analysis:** Get an in-depth explanation of your code, a list of actionable improvement suggestions, and a summary of potential bugs.

* **Multi-Language Support:** Supports popular languages like Python, JavaScript, TypeScript, Java, and C++.

* **Persistent History:** Every analysis is automatically saved to a PostgreSQL database.

* **Modern Tech Stack:** Built with a professional-grade stack including Next.js, FastAPI, and Docker.

* **Responsive UI:** Clean, user-friendly interface built with Tailwind CSS that works on all devices.

## 🛠️ Tech Stack

* **Frontend:** Next.js, React, TypeScript, Tailwind CSS

* **Backend:** Python, FastAPI

* **Database:** PostgreSQL

* **AI Integration:** Google Gemini API

* **Containerization:** Docker & Docker Compose

## 🚀 Local Setup and Installation

Follow these steps to get the entire application running on your local machine.

### Prerequisites

Make sure you have the following installed:

* [Node.js](https://nodejs.org/) (v18 or later)

* [Python](https://www.python.org/downloads/) (v3.8 or later)

* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Clone the Repository

```bash
git clone [https://github.com/your-github-username/ai-code-reviewer.git](https://www.google.com/search?q=https://github.com/your-github-username/ai-code-reviewer.git)
cd ai-code-reviewer
```


### 2. Set Up the Database

The PostgreSQL database runs in a Docker container.

* Make sure Docker Desktop is running on your machine.

* In the root directory of the project, run the following command to start the database in the background:

```bash
docker-compose up -d
```

This will start a PostgreSQL server on `localhost:5432`.

### 3. Configure the Backend

* Navigate to the `backend` directory:

```bash
cd backend
```

* Create and activate a Python virtual environment:


# For macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

# For Windows
```bash
python -m venv venv
.\\venv\\Scripts\\activate
```

* Install the required Python libraries:

```bash
pip install -r requirements.txt
```

* Create a `.env` file for your environment variables by copying the example file:

```bash
cp .env.example .env
````

* **Edit the `.env` file:**

* Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

* Open the `.env` file and add your key. It should look like this:

  ```bash
  # .env
  GEMINI_API_KEY=YOUR_API_KEY_HERE
  DATABASE_URL="postgresql://myuser:mypassword@localhost/ai_reviewer"
  ```

### 4. Configure the Frontend

* In a **new terminal window**, navigate to the `frontend` directory:

```bash
cd frontend
```
* Install the required Node.js packages:
```
npm install
```

### 5. Run the Application

You need to have **two terminals** running simultaneously: one for the backend and one for the frontend.

* **Terminal 1: Start the Backend**

* Make sure you are in the `backend` directory with the `(venv)` activated.

* Run the FastAPI server:

  ```bash
  uvicorn main:app --reload
  ```

* The backend will be running at `http://127.0.0.1:8000`.

* **Terminal 2: Start the Frontend**

* Make sure you are in the `frontend` directory.

* Run the Next.js development server:

  ```bash
  npm run dev
  ```

* The frontend will be running at `http://localhost:3000`.

You can now open your browser and navigate to `http://localhost:3000` to use the application!

## 📂 Project Structure

```

ai-code-reviewer/
├── backend/
│   ├── .env                \# Environment variables (API key, DB URL)
│   ├── database.py         \# Database connection setup
│   ├── main.py             \# FastAPI application and API endpoints
│   ├── models.py           \# SQLAlchemy database models
│   └── requirements.txt    \# Python dependencies
│
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx        \# Main React component for the UI
│   │   └── globals.css     \# Global styles
│   └── package.json        \# Node.js dependencies
│
├── .gitignore
├── docker-compose.yml      \# Docker configuration for the database
└── README.md               \# This file

```

## 📄 API Endpoints

* `POST /api/analyze`: Receives code and language, returns AI analysis, and saves to history.

* `GET /api/history`: Returns a list of all past analyses from the database.
