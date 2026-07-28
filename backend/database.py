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
        print("✅ Connected to MongoDB Atlas")
        logger.info("✅ Connected to MongoDB Atlas")

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

        return _client
    except Exception as err:
        logger.error(
            f"Failed to connect to MongoDB Atlas: {err}. Continuing in offline mode."
        )
        _client = None
        return None

def get_db():
    """Retrieves the active database instance."""
    client = get_db_client()
    if client is None:
        return None
    return client[DATABASE_NAME]
