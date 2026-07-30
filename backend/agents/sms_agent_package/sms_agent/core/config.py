from dotenv import load_dotenv
from pydantic import BaseModel


import os

load_dotenv()


class Settings(BaseModel):
    app_name: str = "SMS Analysis Agent"
    app_version: str = "0.1.0"
    environment: str = "development"
    groq_model: str = os.getenv("GROQ_MODEL") or "llama-3.1-8b-instant"


settings = Settings()
