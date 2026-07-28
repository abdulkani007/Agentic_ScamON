import logging
import os
import json
import subprocess
from datetime import datetime
from typing import Any, Dict, List, Optional
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from database import get_db_client, get_db

logger = logging.getLogger(__name__)

from .utils import extract_domain

def normalize_domain_name(val: str) -> str:
    """Normalizes domains (e.g. www.youtube.com, https://youtube.com -> youtube.com)."""
    if not val:
        return ""
    cleaned = val.strip().lower()
    if cleaned.startswith(("http://", "https://", "www.")):
        return extract_domain(cleaned)
    return extract_domain("https://" + cleaned)

HOSTS_PATH = r"C:\Windows\System32\drivers\etc\hosts"
LOCAL_DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../static/protection_db.json")
)


def init_local_db() -> None:
    """Ensures local fallback database file exists."""
    os.makedirs(os.path.dirname(LOCAL_DB_PATH), exist_ok=True)
    if not os.path.exists(LOCAL_DB_PATH):
        with open(LOCAL_DB_PATH, "w") as f:
            json.dump({"blocklist": [], "history": []}, f, indent=2)


def read_local_db() -> Dict[str, Any]:
    """Reads the local JSON fallback database."""
    init_local_db()
    try:
        with open(LOCAL_DB_PATH, "r") as f:
            return json.load(f)
    except Exception as err:
        logger.error(f"Failed to read local protection DB: {err}")
        return {"blocklist": [], "history": []}


def write_local_db(data: Dict[str, Any]) -> None:
    """Writes to the local JSON fallback database."""
    init_local_db()
    try:
        with open(LOCAL_DB_PATH, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as err:
        logger.error(f"Failed to write local protection DB: {err}")


def flush_dns() -> None:
    """DNS flush mock (Chrome Extension handles blocking now)."""
    pass


def add_to_hosts_file(domain: str) -> None:
    """Hosts file add mock."""
    pass


def remove_from_hosts_file(domain: str) -> None:
    """Hosts file remove mock."""
    pass


def verify_hosts_blocked(domain: str) -> bool:
    """Hosts check mock."""
    return True


def verify_hosts_unblocked(domain: str) -> bool:
    """Hosts check mock."""
    return True


def is_domain_blocked(domain: str) -> bool:
    """Checks if a domain is currently in the blocked_websites database."""
    db = get_db()
    target = normalize_domain_name(domain)

    if db is not None:
        try:
            collection = db["blocked_websites"]
            exists = collection.find_one({"domain": target})
            if exists:
                return exists.get("blocked", True) is True
            return False
        except Exception as err:
            logger.warning(f"Failed to query blocked_websites from MongoDB: {err}")

    # Fallback to local JSON DB
    local_data = read_local_db()
    for item in local_data.get("blocklist", []):
        if item.get("domain") == target:
            return item.get("blocked", True) is True
    return False


def get_all_blocked_domains() -> List[str]:
    """Retrieves list of all blocked domains."""
    db = get_db()
    domains = []

    if db is not None:
        try:
            collection = db["blocked_websites"]
            cursor = collection.find({"blocked": True})
            for doc in cursor:
                domains.append(doc["domain"])
            return list(set(domains))
        except Exception as err:
            logger.warning(f"Failed to fetch blocked domains from MongoDB: {err}")

    # Fallback to local JSON DB
    local_data = read_local_db()
    for item in local_data.get("blocklist", []):
        if item.get("blocked", True) is True:
            domains.append(item["domain"])
    return list(set(domains))


def log_block_history(domain: str, action: str, success: bool, details: str) -> None:
    """Logs action into history collection and syncs with local DB."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    payload = {
        "domain": domain,
        "action": action,
        "timestamp": timestamp,
        "success": success,
        "details": details,
    }

    db = get_db()
    if db is not None:
        try:
            collection = db["agent_logs"]
            collection.insert_one(payload.copy())
        except Exception as err:
            logger.warning(f"Failed to write history to MongoDB: {err}")

    # Always write to local JSON for dual persistence and easy preview
    local_data = read_local_db()
    history = local_data.get("history", [])
    history.insert(0, payload)  # Insert at beginning
    local_data["history"] = history
    write_local_db(local_data)


def get_block_history() -> List[Dict[str, Any]]:
    """Retrieves full history logs of block/unblock actions."""
    db = get_db()

    if db is not None:
        try:
            collection = db["agent_logs"]
            cursor = collection.find({"domain": {"$exists": True}}).sort("_id", -1)
            history = []
            for doc in cursor:
                doc_dict = dict(doc)
                if "domain" in doc_dict:
                    if "_id" in doc_dict:
                        doc_dict["_id"] = str(doc_dict["_id"])
                    history.append(doc_dict)
            return history
        except Exception as err:
            logger.warning(f"Failed to fetch history from MongoDB: {err}")

    # Fallback to local JSON DB
    local_data = read_local_db()
    return local_data.get("history", [])


def block_domain(
    domain: str,
    reason: str = "HIGH RISK website scan classification",
    url: str = "",
    risk_score: int = 0,
    threat_type: str = "",
    blocked_by: str = "Website Investigation Agent"
) -> Dict[str, Any]:
    """Blocks a domain by adding it to the DB."""
    target = normalize_domain_name(domain)
    target_url = url or f"https://{target}"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    if is_domain_blocked(target):
        return {
            "success": False,
            "message": "Website is already blocked.",
            "error": "Conflict",
            "admin_error": False,
        }

    # 1. Add/Update Database blocked_websites
    db = get_db()
    db_success = False
    if db is not None:
        try:
            collection = db["blocked_websites"]
            existing = collection.find_one({"domain": target})
            created_at = existing.get("created_at") if existing else timestamp
            
            collection.update_one(
                {"domain": target},
                {"$set": {
                    "domain": target, 
                    "url": target_url,
                    "risk_score": risk_score,
                    "threat_type": threat_type,
                    "reason": reason,
                    "blocked": True,
                    "blocked_at": timestamp,
                    "unblocked": False,
                    "unblocked_at": None,
                    "blocked_by": blocked_by,
                    "created_at": created_at,
                    "updated_at": timestamp
                }},
                upsert=True
            )
            db_success = True
        except Exception as err:
            logger.warning(f"Failed to add block to MongoDB: {err}")

    # Sync to local database blocklist
    local_data = read_local_db()
    blocklist = local_data.get("blocklist", [])
    found = False
    for item in blocklist:
        if item.get("domain") == target:
            item["blocked"] = True
            item["unblocked"] = False
            item["blocked_time"] = timestamp
            item["unblocked_time"] = None
            item["reason"] = reason
            found = True
            break
    if not found:
        blocklist.append({
            "domain": target,
            "blocked": True,
            "unblocked": False,
            "blocked_time": timestamp,
            "unblocked_time": None,
            "blocked_by": blocked_by,
            "reason": reason
        })
    local_data["blocklist"] = blocklist
    write_local_db(local_data)
    db_success = True

    # 4. Log to history
    log_block_history(target, "block", True, reason)

    return {
        "success": True,
        "message": "Website Successfully Blocked.",
        "error": None,
        "admin_error": False,
        "blocked_time": timestamp,
        "blocked_by": blocked_by
    }


def unblock_domain(domain: str) -> Dict[str, Any]:
    """Unblocks a domain by removing block status from DB."""
    target = normalize_domain_name(domain)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    # 1. Update Database blocked_websites
    db = get_db()
    db_success = False
    if db is not None:
        try:
            collection = db["blocked_websites"]
            collection.update_one(
                {"domain": target},
                {"$set": {
                    "blocked": False,
                    "unblocked": True,
                    "unblocked_at": timestamp,
                    "updated_at": timestamp
                }},
                upsert=True
            )
            db_success = True
        except Exception as err:
            logger.warning(f"Failed to remove block from MongoDB: {err}")

    # Sync to local database blocklist
    local_data = read_local_db()
    blocklist = local_data.get("blocklist", [])
    for item in blocklist:
        if item.get("domain") == target:
            item["blocked"] = False
            item["unblocked"] = True
            item["unblocked_time"] = timestamp
            item["reason"] = "User manual unblock"
    local_data["blocklist"] = blocklist
    write_local_db(local_data)
    db_success = True

    # Log to history
    log_block_history(target, "unblock", True, "Successfully unblocked.")

    return {
        "success": True,
        "message": "Website Successfully Unblocked.",
        "error": None,
        "admin_error": False,
    }
