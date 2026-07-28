import os
import logging
from dotenv import load_dotenv
from pymongo import MongoClient

logger = logging.getLogger(__name__)

# Load environment variables from .env (forcing override of process environment)
load_dotenv(override=True)

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "scamon_ai")

_client = None

def get_db_client():
    """Retrieves or initializes the MongoDB Atlas client."""
    global _client
    if _client is not None:
        return _client

    if not MONGO_URI:
        logger.warning(
            "MONGODB_URI/MONGO_URI is not set. Database persistence will be disabled (operating in mock-offline mode)."
        )
        return None

    try:
        logger.info("Initializing MongoDB Atlas connection...")
        # 5-second timeout to prevent stalling startup if connection fails
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Test connection by pinging server
        _client.admin.command("ping")
        print("Connected to MongoDB Atlas")
        logger.info("Connected to MongoDB Atlas")

        # Automatically create required collections if they do not exist
        db = _client[DATABASE_NAME]
        existing_collections = db.list_collection_names()
        required_collections = [
            "website_scans",
            "blocked_websites",
            "call_scans",
            "sms_scans",
            "email_scans",
            "investigation_reports",
            "users",
            "agent_logs"
        ]
        for col in required_collections:
            if col not in existing_collections:
                db.create_collection(col)
                logger.info(f"Created collection: {col}")
            # Insert a seed document if the collection is empty to materialize it in Atlas UI
            try:
                if db[col].count_documents({}) == 0:
                    db[col].insert_one({
                        "initialized": True,
                        "description": f"ScamON AI - {col.replace('_', ' ').title()} storage node",
                        "system_status": "ONLINE"
                    })
                    logger.info(f"Initialized collection seed: {col}")
            except Exception as seed_err:
                logger.warning(f"Failed to seed collection {col}: {seed_err}")
        try:
            seed_mock_data(db)
        except Exception as seed_err:
            logger.warning(f"Failed mock data seeding: {seed_err}")

        return _client
    except Exception as err:
        logger.error(
            f"Failed to connect to MongoDB Atlas: {err}. Continuing in offline mode."
        )
        _client = None
        return None


def seed_mock_data(db) -> None:
    """Seeds the database with realistic sample scan entries if empty."""
    # Seed website scans
    try:
        # Check if actual user scans exist (excluding initial seed documents)
        if db["website_scans"].count_documents({"url": {"$exists": True}, "initialized": {"$exists": False}}) == 0:
            db["website_scans"].insert_many([
                {
                    "url": "https://secure-login-bank.com",
                    "domain": {
                        "name": "secure-login-bank.com"
                    },
                    "risk_score": 96,
                    "verdict": "PHISHING",
                    "threat_type": "Phishing Link",
                    "recommendation": "This website is highly likely to be phishing. Blocking is strongly recommended.",
                    "timestamp": "2026-07-28 12:45:00 UTC",
                    "screenshot_url": "",
                    "ai_reasoning": {
                        "recommended_action": "BLOCK WEBSITE"
                    }
                },
                {
                    "url": "https://google.com",
                    "domain": {
                        "name": "google.com"
                    },
                    "risk_score": 12,
                    "verdict": "SAFE",
                    "threat_type": "Safe Link",
                    "recommendation": "This website appears safe. Blocking is NOT recommended.",
                    "timestamp": "2026-07-28 13:20:00 UTC",
                    "screenshot_url": "",
                    "ai_reasoning": {
                        "recommended_action": "OPEN WEBSITE"
                    }
                }
            ])
            logger.info("Seeded website scans collection with sample records.")
    except Exception as e:
        logger.warning(f"Failed to seed website scans mock records: {e}")

    # Seed call scans
    try:
        if db["call_scans"].count_documents({"caller": {"$exists": True}, "initialized": {"$exists": False}}) == 0:
            db["call_scans"].insert_many([
                {
                    "caller": "+1-800-123-4567",
                    "risk_score": 88,
                    "threat_category": "Financial Scam",
                    "transcript": "Hello, I am calling from your bank. We detected a suspicious transfer of $5,000 from your account. Please verify your OTP to cancel the transfer...",
                    "timestamp": "2026-07-28 14:10:00 UTC",
                    "ai_analysis": {
                        "threat_category": "Financial Scam"
                    }
                }
            ])
            logger.info("Seeded call scans collection with sample records.")
    except Exception as e:
        logger.warning(f"Failed to seed call scans mock records: {e}")


def get_db():
    """Retrieves the active database instance."""
    client = get_db_client()
    if client is None:
        return None
    return client[DATABASE_NAME]
