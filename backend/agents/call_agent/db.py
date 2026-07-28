import logging
from typing import Any, Dict, Optional
from pymongo import MongoClient
from .config import settings

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from database import get_db_client, get_db

logger = logging.getLogger(__name__)


def log_analysis(payload: Dict[str, Any]) -> None:
    """Logs the threat scan results to MongoDB for audit logging."""
    db = get_db()
    if db is None:
        return

    try:
        collection = db["call_scans"]
        collection.insert_one(payload.copy())
        logger.debug("Successfully logged Call scan results to MongoDB.")
    except Exception as err:
        logger.warning(f"Failed to write scan logs to MongoDB: {err}")


def get_previous_caller_scans(phone_number: str) -> list[Dict[str, Any]]:
    """Retrieves all previous scans for the given phone number from MongoDB."""
    db = get_db()
    if db is None:
        # Failsafe mock memory recall for demo phone numbers in offline mode
        if phone_number and any(num in phone_number for num in ["9876543210", "555-019-2834", "12345"]):
            return [
                {
                    "timestamp": "2026-07-27 15:45:20 UTC",
                    "risk_score": 85,
                    "ai_analysis": {
                        "threat_category": "Banking Scam"
                    }
                },
                {
                    "timestamp": "2026-07-26 12:30:10 UTC",
                    "risk_score": 55,
                    "ai_analysis": {
                        "threat_category": "Suspicious Activity"
                    }
                }
            ]
        return []

    try:
        collection = db["call_scans"]
        # Find all scans for this phone number, sorted descending
        # We look for phone number inside the extracted_evidence sub-dict
        cursor = collection.find({"extracted_evidence.phone_number": phone_number}, sort=[("_id", -1)])
        scans = []
        for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            scans.append(doc)
        return scans
    except Exception as err:
        logger.warning(f"Failed to query caller scans from MongoDB: {err}")
        return []
