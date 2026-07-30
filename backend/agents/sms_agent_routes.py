from fastapi import APIRouter, HTTPException, Body, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import logging
from datetime import datetime

from database import get_db
from agents.history_helper import save_investigation
from agents.sms_agent_package.sms_agent import SMSAgent

logger = logging.getLogger(__name__)

router = APIRouter(tags=["SMS Investigation Agent"])

class SMSAnalyzeRequest(BaseModel):
    sender: str
    message: str
    timestamp: Optional[str] = None
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None
    source: Optional[str] = None
    skip_analysis: Optional[bool] = False

@router.post("/api/sms/analyze")
async def analyze_sms(
    payload: SMSAnalyzeRequest,
    x_case_id: Optional[str] = Header(None, alias="X-Case-ID")
):
    try:
        # Generate investigation ID or use provided message ID
        investigation_id = payload.message_id if payload.message_id else f"sms_{uuid.uuid4().hex[:8]}"
        
        if payload.skip_analysis:
            # Save raw message without executing LLM scan
            raw_report = {
                "sms": {
                    "sender": payload.sender,
                    "message": payload.message,
                    "timestamp": payload.timestamp
                },
                "analysis": None
            }
            save_investigation(
                agent_type="sms",
                investigation_id=investigation_id,
                risk_score=0,
                threat_level="PENDING",
                input_data=f"SMS from {payload.sender}: {payload.message}",
                summary="Raw SMS captured. Awaiting manual trigger.",
                full_report=raw_report,
                recommendation="Awaiting analysis audit.",
                case_id=x_case_id,
                source=payload.source,
                status="collected"
            )
            return {"status": "collected", "investigation_id": investigation_id, "full_report": raw_report}

        # Otherwise, run normal analysis...
        agent = SMSAgent()
        result = agent.analyze(
            sender=payload.sender,
            message=payload.message,
            timestamp=payload.timestamp
        )
        
        # Convert result to dictionary
        result_dict = result.dict() if hasattr(result, "dict") else dict(result)
        
        # Extract risk parameters
        analysis_data = result_dict.get("analysis") or {}
        risk_score = analysis_data.get("risk_score") or 0
        severity = (analysis_data.get("severity") or "SAFE").upper()
        summary = analysis_data.get("summary") or "SMS Scam Analysis complete."
        rec = analysis_data.get("recommended_action") or "No immediate threats detected."
        
        # Add risk_score directly under results for generic endpoints/UI compatibility
        result_dict["risk_score"] = risk_score
        
        # Save to unified investigations history
        save_investigation(
            agent_type="sms",
            investigation_id=investigation_id,
            risk_score=risk_score,
            threat_level=severity,
            input_data=f"SMS from {payload.sender}: {payload.message}",
            summary=summary,
            full_report=result_dict,
            recommendation=rec,
            case_id=x_case_id,
            source=payload.source
        )
        
        return result_dict
    except Exception as e:
        logger.error(f"SMS Agent Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"SMS Agent Analysis failed: {str(e)}")

@router.post("/api/sms/investigations/{investigation_id}/run")
async def run_sms_investigation_audit(investigation_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline.")
    
    investigation = db["investigations"].find_one({"investigation_id": investigation_id})
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found.")
        
    try:
        # Extract raw sender and message text
        full_report = investigation.get("full_report") or {}
        sms_data = full_report.get("sms") or {}
        sender = sms_data.get("sender") or investigation.get("input", "").split(":")[0].replace("SMS from ", "").strip()
        message = sms_data.get("message") or investigation.get("input", "").split(":")[-1].strip()
        timestamp = sms_data.get("timestamp") or investigation.get("timestamp")
        
        # Run SMS Agent Analysis
        agent = SMSAgent()
        result = agent.analyze(
            sender=sender,
            message=message,
            timestamp=timestamp
        )
        
        result_dict = result.dict() if hasattr(result, "dict") else dict(result)
        analysis_data = result_dict.get("analysis") or {}
        risk_score = analysis_data.get("risk_score") or 0
        severity = (analysis_data.get("severity") or "SAFE").upper()
        summary = analysis_data.get("summary") or "SMS Scam Analysis complete."
        rec = analysis_data.get("recommended_action") or "No immediate threats detected."
        
        result_dict["risk_score"] = risk_score
        
        # Merge updated fields into the record
        update_fields = {
            "status": "completed",
            "risk_score": risk_score,
            "threat_level": severity,
            "summary": summary,
            "recommendation": rec,
            "full_report": {
                "sms": {
                    "sender": sender,
                    "message": message,
                    "timestamp": timestamp
                },
                "analysis": analysis_data,
                **{k: v for k, v in result_dict.items() if k not in ["sms", "analysis"]}
            }
        }
        
        db["investigations"].update_one({"investigation_id": investigation_id}, {"$set": update_fields})
        
        # Retrieve the updated document to return it
        updated_doc = db["investigations"].find_one({"investigation_id": investigation_id})
        # Clean Mongo ObjectIds
        from website_agent.routes import clean_mongodb_doc
        return clean_mongodb_doc(updated_doc)
        
    except Exception as e:
        logger.error(f"Failed to execute manual SMS audit: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to execute manual SMS audit: {str(e)}")


# --- SMS COLLECTOR SUBPROCESS CONTROLLER ---
import os
import sys
import subprocess

collector_process = None

@router.post("/api/sms/collector/start")
async def start_collector():
    global collector_process
    if collector_process is not None and collector_process.poll() is None:
        return {"status": "running", "message": "Collector is already running."}
    
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Execute in background: python -m services.sms_collector
        cmd = [sys.executable, "-m", "services.sms_collector"]
        collector_process = subprocess.Popen(
            cmd,
            cwd=backend_dir,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        logger.info(f"Spawned SMS Collector background process: PID {collector_process.pid}")
        return {"status": "started", "pid": collector_process.pid, "message": "Collector spawned successfully."}
    except Exception as err:
        logger.error(f"Failed to start SMS Collector: {err}")
        raise HTTPException(status_code=500, detail=f"Failed to start SMS Collector: {str(err)}")

@router.post("/api/sms/collector/stop")
async def stop_collector():
    global collector_process
    if collector_process is None or collector_process.poll() is not None:
        collector_process = None
        return {"status": "stopped", "message": "Collector is not running."}
    
    try:
        collector_process.terminate()
        try:
            collector_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            collector_process.kill()
            logger.warning("Force killed SMS Collector process after timeout.")
        logger.info("Terminated SMS Collector background process successfully.")
    except Exception as err:
        logger.error(f"Error stopping SMS Collector: {err}")
        
    collector_process = None
    return {"status": "stopped", "message": "Collector stopped successfully."}

@router.get("/api/sms/collector/status")
async def get_collector_status():
    global collector_process
    running = collector_process is not None and collector_process.poll() is None
    paired = True
    error_message = ""
    
    status_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "sms_collector", "status.json")
    if running and os.path.exists(status_path):
        try:
            import json
            with open(status_path, "r", encoding="utf-8") as f:
                status_data = json.load(f)
                paired = status_data.get("paired", True)
                error_message = status_data.get("error_message", "")
        except Exception:
            pass
            
    return {
        "running": running,
        "paired": paired,
        "error_message": error_message,
        "pid": collector_process.pid if running else None
    }

