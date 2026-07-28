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
        # Extract fields to match user requirement #5:
        ai_obj = payload.get("ai_reasoning", {})
        domain_obj = payload.get("domain", {})
        
        scan_record = {
            "url": payload.get("url", ""),
            "domain": domain_obj.get("name", "") if isinstance(domain_obj, dict) else str(domain_obj),
            "risk_score": payload.get("risk_score", 0),
            "verdict": ai_obj.get("final_decision", "") if isinstance(ai_obj, dict) else payload.get("verdict", ""),
            "threat_type": payload.get("threat_type", ""),
            "analysis": ai_obj.get("summary", "") if isinstance(ai_obj, dict) else payload.get("analysis", ""),
            "recommendation": payload.get("recommendation", ""),
            "evidence": {
                "ssl": payload.get("ssl", {}),
                "typosquat": payload.get("typosquat", {}),
                "phishtank": payload.get("phishtank", {}),
                "security_headers": payload.get("security_headers", {}),
                "html_metadata": payload.get("html_metadata", {})
            },
            "timestamp": payload.get("timestamp", ""),
            "agent": "Website Investigation Agent"
        }
        collection = db["website_scans"]
        collection.insert_one(scan_record)
        logger.debug("Successfully logged URL scan results to MongoDB.")
    except Exception as err:
        logger.warning(f"Failed to write scan logs to MongoDB: {err}")


def get_previous_scan(url: str) -> Optional[Dict[str, Any]]:
    """Retrieves the most recent previous scan for the given URL from MongoDB."""
    db = get_db()
    if db is None:
        # Failsafe mock memory recall for demo domains in offline mode
        if "amazon-offers-login.click" in url:
            return {
                "timestamp": "2026-07-27 18:30:15 UTC",
                "risk_score": 75,
                "recommendation": "BLOCK THIS WEBSITE",
                "threat_type": "Suspicious Website",
            }
        return None

    try:
        collection = db["website_scans"]
        # Retrieve latest scan sorted by insertion order descending
        prev = collection.find_one({"url": url}, sort=[("_id", -1)])
        if prev and "_id" in prev:
            prev["_id"] = str(prev["_id"])
        return prev
    except Exception as err:
        logger.warning(f"Failed to query previous scan from MongoDB: {err}")
        return None
