import logging
from datetime import datetime
from typing import Any, Dict, Optional
import sys
import os

# Ensure project root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database import get_db

logger = logging.getLogger(__name__)

def save_investigation(
    agent_type: str,
    investigation_id: str,
    risk_score: int,
    threat_level: str,
    input_data: str,
    summary: str,
    full_report: Dict[str, Any],
    recommendation: str,
    status: str = "completed",
    user_id: str = "default_user",
    case_id: Optional[str] = None,
    source: Optional[str] = None
) -> bool:
    """
    Saves or updates an investigation record in the unified MongoDB investigations collection.
    Automatically formats timestamps and handles DB availability failsafes.
    """
    db = get_db()
    if db is None:
        logger.warning("MongoDB is offline or not configured. Cannot save investigation history.")
        return False

    try:
        collection = db["investigations"]
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        
        # Check if record already exists by investigation_id to avoid duplicates
        existing = collection.find_one({"investigation_id": investigation_id})

        # Inject investigation_id into full_report for frontend reference
        if isinstance(full_report, dict):
            full_report["investigation_id"] = investigation_id

        record = {
            "user_id": user_id,
            "agent_type": agent_type,
            "investigation_id": investigation_id,
            "risk_score": risk_score,
            "threat_level": threat_level.upper(),
            "input": input_data,
            "summary": summary,
            "full_report": full_report,
            "recommendation": recommendation,
            "status": status,
            "timestamp": timestamp
        }
        if case_id:
            record["case_id"] = case_id
        if source:
            record["source"] = source
        
        if existing:
            collection.update_one({"investigation_id": investigation_id}, {"$set": record})
            logger.info(f"Updated unified investigation log: {investigation_id} [{agent_type}]")
        else:
            collection.insert_one(record)
            logger.info(f"Inserted new unified investigation log: {investigation_id} [{agent_type}]")
            
        # Auto-Save to Evidence Vault
        try:
            from agents.evidence_vault.agent import add_evidence_to_vault, active_case_id_context
            header_case_id = active_case_id_context.get()
            resolved_case_id = case_id or header_case_id
            if not resolved_case_id or resolved_case_id == "null":
                # Find most recently updated active non-Closed case
                active_case = db["cases"].find_one({"status": {"$ne": "Closed"}}, sort=[("updated_at", -1)])
                if active_case:
                    resolved_case_id = active_case["case_id"]
            
            agent_source_map = {
                "website": "website",
                "email": "email",
                "call": "call",
                "live_call": "live_call",
                "threat_correlation": "threat_correlation"
            }
            agent_source = agent_source_map.get(agent_type, agent_type)
            
            add_evidence_to_vault(
                db=db,
                case_id=resolved_case_id,
                agent_source=agent_source,
                evidence_data=full_report,
                user_id=user_id
            )
        except Exception as vault_err:
            logger.warning(f"Failed to auto-save evidence to Vault: {vault_err}")

        return True
    except Exception as err:
        logger.error(f"Failed to write unified investigation log to MongoDB: {err}")
        return False
