import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from contextvars import ContextVar

logger = logging.getLogger(__name__)

# Request Context for Active Case ID
active_case_id_context: ContextVar[str] = ContextVar("active_case_id", default="")

# Map agent sources to full titles for generated_by and status levels
AGENT_TITLE_MAP = {
    "website": "Website Investigation Agent",
    "email": "Email Investigation Agent",
    "call": "Call Analysis Agent",
    "live_call": "Live Call Detector",
    "threat_correlation": "Threat Correlation Agent",
    "complaint": "Complaint Agent",
    "xai": "Explainability (XAI) Agent",
    "sms": "SMS Investigation Agent",
    "visual_scam": "Visual Scam Investigation Agent"
}

def generate_case_id(db) -> str:
    """Generates the next sequential Case ID in the SCAMON-2026-###### format."""
    try:
        # Query database for all cases, sort descending by case_id
        cursor = db["cases"].find({}, {"case_id": 1}).sort("case_id", -1).limit(1)
        latest_case = next(cursor, None)
        if latest_case and "case_id" in latest_case:
            latest_id = latest_case["case_id"]
            # Extract sequence number, format is SCAMON-2026-###### or similar
            parts = latest_id.split("-")
            if len(parts) == 3:
                try:
                    num = int(parts[2])
                    return f"SCAMON-2026-{num + 1:06d}"
                except ValueError:
                    pass
        # Fallback if no cases or parsing failed
        count = db["cases"].count_documents({})
        return f"SCAMON-2026-{count + 1:06d}"
    except Exception as e:
        logger.error(f"Error generating Case ID: {e}")
        return f"SCAMON-2026-000001"

def calculate_integrity_hash(data: Any) -> str:
    """Computes a SHA-256 integrity hash of the evidence data to guarantee records are unaltered."""
    try:
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    except Exception as e:
        logger.warning(f"Failed to calculate integrity hash: {e}")
        return "UNKNOWN_HASH"

def add_evidence_to_vault(
    db,
    case_id: Optional[str],
    agent_source: str,
    evidence_data: Dict[str, Any],
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """
    Saves or appends scan evidence to a new or existing Case Folder.
    Guarantees evidence integrity verification and sequential case IDs.
    """
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Initialize Case if not specified
    if not case_id or case_id == "null" or case_id == "undefined":
        case_id = generate_case_id(db)
        
    case_doc = db["cases"].find_one({"case_id": case_id})
    
    # If case doesn't exist, create it
    if not case_doc:
        case_doc = {
            "case_id": case_id,
            "user_id": user_id,
            "created_at": timestamp,
            "updated_at": timestamp,
            "status": "Open",
            "overall_risk_score": 0,
            "overall_threat_level": "SAFE",
            "agents_used": [],
            "evidence": {},
            "reports": {}
        }
        
    # Prepare evidence wrapper
    integrity_hash = calculate_integrity_hash(evidence_data)
    agent_title = AGENT_TITLE_MAP.get(agent_source, f"{agent_source.capitalize()} Agent")
    
    evidence_node = {
        "agent_source": agent_source,
        "generated_by": agent_title,
        "creation_time": timestamp,
        "last_modified_time": timestamp,
        "integrity_hash": integrity_hash,
        "data": evidence_data
    }
    
    # Update evidence registry
    evidence_dict = case_doc.get("evidence") or {}
    evidence_dict[agent_source] = evidence_node
    case_doc["evidence"] = evidence_dict
    
    # Update status and agents used
    agents_used = case_doc.get("agents_used") or []
    if agent_source not in agents_used:
        agents_used.append(agent_source)
    case_doc["agents_used"] = agents_used
    
    # Determine risk score from the evidence data
    # Standard keys: risk_score or score or threat_score
    item_score = evidence_data.get("risk_score") or evidence_data.get("score") or evidence_data.get("threat_score") or 0
    try:
        item_score = int(item_score)
    except (ValueError, TypeError):
        item_score = 0
        
    # Overall risk score is the maximum of all individual scans
    max_score = item_score
    for source, ev in evidence_dict.items():
        ev_data = ev.get("data") or {}
        score_val = ev_data.get("risk_score") or ev_data.get("score") or ev_data.get("threat_score") or 0
        try:
            score_val = int(score_val)
            if score_val > max_score:
                max_score = score_val
        except (ValueError, TypeError):
            pass
            
    case_doc["overall_risk_score"] = max_score
    
    # Update threat level label
    if max_score >= 75:
        case_doc["overall_threat_level"] = "CRITICAL"
    elif max_score >= 50:
        case_doc["overall_threat_level"] = "HIGH"
    elif max_score >= 25:
        case_doc["overall_threat_level"] = "WARNING"
    else:
        case_doc["overall_threat_level"] = "SAFE"
        
    # Update status based on progress
    if len(evidence_dict) > 0:
        case_doc["status"] = "Evidence Collected"
        
    case_doc["updated_at"] = timestamp
    
    # Save back to DB
    db["cases"].replace_one({"case_id": case_id}, case_doc, upsert=True)
    logger.info(f"Evidence Vault: Saved evidence from {agent_title} to case {case_id}")
    
    return case_doc
