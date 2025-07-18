# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables from .env file at the very beginning
# This ensures they are available as soon as this module is imported.
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Add a check to give a clearer error if the .env file is missing the variable
if DATABASE_URL is None:
    raise Exception("DATABASE_URL not found. Make sure it is set in your .env file.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
