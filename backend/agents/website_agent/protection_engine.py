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
    """Runs ipconfig /flushdns to clear local resolver cache."""
    try:
        logger.info("Executing DNS resolver cache flush...")
        result = subprocess.run(
            ["ipconfig", "/flushdns"],
            capture_output=True,
            text=True,
            check=True
        )
        logger.info(f"DNS Cache Flushed successfully: {result.stdout.strip()}")
    except Exception as err:
        logger.warning(f"Failed to execute ipconfig DNS cache flush: {err}")


def add_to_hosts_file(domain: str) -> None:
    """Adds the domain and its www subdomain to the Windows hosts file."""
    if not os.path.exists(HOSTS_PATH):
        raise FileNotFoundError(f"Windows hosts file not found at path: {HOSTS_PATH}")

    entry_1 = f"127.0.0.1 {domain}"
    entry_2 = f"127.0.0.1 www.{domain}"

    with open(HOSTS_PATH, "r") as f:
        content = f.read()

    # Check if entries already exist
    has_e1 = entry_1 in content
    has_e2 = entry_2 in content

    if not has_e1 or not has_e2:
        with open(HOSTS_PATH, "a") as f:
            if not content.endswith("\n") and len(content) > 0:
                f.write("\n")
            if not has_e1:
                f.write(f"{entry_1}\n")
                logger.info(f"Added {entry_1} to hosts file.")
            if not has_e2:
                f.write(f"{entry_2}\n")
                logger.info(f"Added {entry_2} to hosts file.")


def remove_from_hosts_file(domain: str) -> None:
    """Removes any block list entries for the domain from the hosts file."""
    if not os.path.exists(HOSTS_PATH):
        return

    with open(HOSTS_PATH, "r") as f:
        lines = f.readlines()

    target_domain = domain.lower().strip()
    new_lines = []
    removed_any = False

    for line in lines:
        stripped = line.strip().lower()
        # Skip comment lines
        if stripped.startswith("#"):
            new_lines.append(line)
            continue

        parts = stripped.split()
        if len(parts) >= 2 and parts[0] == "127.0.0.1":
            mapped_host = parts[1].strip()
            if mapped_host == target_domain or mapped_host == f"www.{target_domain}":
                removed_any = True
                logger.info(f"Removed entry for {mapped_host} from hosts file.")
                continue

        new_lines.append(line)

    if removed_any:
        with open(HOSTS_PATH, "w") as f:
            f.writelines(new_lines)


def verify_hosts_blocked(domain: str) -> bool:
    """Verifies that domain is mapped in hosts file."""
    try:
        if not os.path.exists(HOSTS_PATH):
            return False
        with open(HOSTS_PATH, "r") as f:
            hosts_content = f.read()
        return f"127.0.0.1 {domain}" in hosts_content or f"0.0.0.0 {domain}" in hosts_content
    except Exception as err:
        logger.warning(f"Verification read error: {err}")
        return False


def verify_hosts_unblocked(domain: str) -> bool:
    """Verifies that domain is NOT mapped in hosts file."""
    try:
        if not os.path.exists(HOSTS_PATH):
            return True
        with open(HOSTS_PATH, "r") as f:
            hosts_content = f.read()
        return f"127.0.0.1 {domain}" not in hosts_content and f"0.0.0.0 {domain}" not in hosts_content
    except Exception as err:
        logger.warning(f"Verification read error: {err}")
        return False


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
    """Blocks a domain by adding it to DB, hosts file, flushing DNS cache, and verifying it."""
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
            "blocked_by": "Website Investigation Agent",
            "reason": reason
        })
    local_data["blocklist"] = blocklist
    write_local_db(local_data)
    db_success = True

    # 2. Modify Windows Hosts File
    hosts_success = False
    error_reason = None
    admin_error = False

    try:
        add_to_hosts_file(target)
        # Verify hosts file block modification using helper
        hosts_success = verify_hosts_blocked(target)
        if not hosts_success:
            error_reason = "Verification Failed: Block entries not registered in hosts file."
    except PermissionError as perm_err:
        admin_error = True
        error_reason = f"Permission Denied: Administrator privileges required to edit hosts file ({perm_err})"
        logger.warning(f"Permission error editing hosts file for {target}: {perm_err}")
    except Exception as err:
        error_reason = str(err)
        logger.warning(f"System error editing hosts file for {target}: {err}")

    # 3. Flush DNS Resolver Cache
    flush_dns()

    # 4. Log to history
    log_block_history(target, "block", hosts_success, reason)

    if db_success:
        return {
            "success": True,
            "message": "Website Successfully Blocked." if hosts_success else "Website Blocked in ScamShield database, but Administrator privileges are required to update Windows hosts file.",
            "error": error_reason,
            "admin_error": admin_error,
            "blocked_time": timestamp,
            "blocked_by": "Website Investigation Agent"
        }
    else:
        return {
            "success": False,
            "message": "Failed to update block status in database.",
            "error": "Database error",
            "admin_error": False,
            "blocked_time": None,
            "blocked_by": None
        }


def unblock_domain(domain: str) -> Dict[str, Any]:
    """Unblocks a domain by removing from DB, hosts file, flushing DNS cache, and verifying it."""
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
                    "unblocked_time": timestamp,
                    "reason": "User manual unblock"
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

    # 2. Modify Windows Hosts File
    hosts_success = False
    error_reason = None
    admin_error = False

    try:
        remove_from_hosts_file(target)
        # Verify hosts file unblock modification using helper
        hosts_success = verify_hosts_unblocked(target)
        if not hosts_success:
            error_reason = "Verification Failed: Block entries still remain in hosts file."
    except PermissionError as perm_err:
        admin_error = True
        error_reason = f"Permission Denied: Administrator privileges required to edit hosts file ({perm_err})"
        logger.warning(f"Permission error editing hosts file for {target}: {perm_err}")
    except Exception as err:
        error_reason = str(err)
        logger.warning(f"System error editing hosts file for {target}: {err}")

    # 3. Flush DNS Resolver Cache
    flush_dns()

    # 4. Log to history
    status_details = (
        "Successfully removed from hosts file and DB."
        if hosts_success
        else f"DB updated. Hosts failed: {error_reason}"
    )
    log_block_history(target, "unblock", hosts_success, status_details)

    if db_success:
        return {
            "success": True,
            "message": "Website Successfully Unblocked." if hosts_success else "Website Unblocked in ScamShield database, but Administrator privileges are required to update Windows hosts file.",
            "error": error_reason,
            "admin_error": admin_error,
        }
    else:
        return {
            "success": False,
            "message": "Failed to update unblock status in database.",
            "error": "Database error",
            "admin_error": False,
        }
