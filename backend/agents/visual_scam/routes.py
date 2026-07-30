import os
import uuid
import hashlib
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from database import get_db
from agents.history_helper import save_investigation
from agents.visual_scam.visual_agent import VisualScamAgent
from agents.visual_scam.schemas import VisualScamAnalysisResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Visual Scam Investigation Agent"])

# Maximum upload size configurable via environment variable (default 5MB)
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 5 * 1024 * 1024))

@router.post("/api/visual_scam/analyze", response_model=VisualScamAnalysisResponse)
async def analyze_visual_scam(
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None)
):
    """Uploads a screenshot, runs OCR + vision checks, routes indicators, and logs to vault."""
    # 1. Validate file extension
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Must be PNG, JPG, JPEG, WEBP, BMP, or TIFF."
        )

    # 2. Read file bytes and validate size
    try:
        image_bytes = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error reading uploaded image file."
        )

    if len(image_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload limit of {MAX_UPLOAD_SIZE / (1024 * 1024):.1f} MB."
        )

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # 3. Save file to static visuals directory
    try:
        # Determine paths
        static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../static"))
        visuals_dir = os.path.join(static_dir, "visuals")
        os.makedirs(visuals_dir, exist_ok=True)

        # Generate unique filename based on image bytes hash to avoid duplicate storage
        img_hash = hashlib.md5(image_bytes).hexdigest()
        saved_filename = f"{img_hash}{ext}"
        saved_filepath = os.path.join(visuals_dir, saved_filename)
        
        with open(saved_filepath, "wb") as f:
            f.write(image_bytes)
        
        image_url = f"/static/visuals/{saved_filename}"
        logger.info(f"Saved uploaded image to static/visuals/{saved_filename}")
    except Exception as save_err:
        logger.error(f"Failed to save visual scan image file: {save_err}", exc_info=True)
        # Use a mock local data URL fallback if save fails to ensure the application never crashes
        image_url = f"data:image/png;base64,{base64.b64encode(image_bytes).decode('utf-8')[:100]}..."

    # 4. Resolve case ID
    db = get_db()
    resolved_case_id = case_id
    if not resolved_case_id or resolved_case_id == "null":
        # Resolve case ID from active cases
        if db is not None:
            active_case = db["cases"].find_one({"status": {"$ne": "Closed"}}, sort=[("updated_at", -1)])
            if active_case:
                resolved_case_id = active_case["case_id"]
    if not resolved_case_id:
        resolved_case_id = f"CASE-{uuid.uuid4().hex[:6].upper()}"

    # 5. Run Visual Scam Analysis
    try:
        agent = VisualScamAgent()
        result = await agent.analyze(
            image_bytes=image_bytes,
            image_filename=filename,
            case_id=resolved_case_id
        )
        
        # Inject the serveable URL
        result["image_url"] = image_url
        
        # Generate dynamic investigation ID
        investigation_id = f"visual_{uuid.uuid4().hex[:8]}"
        
        # Save to history & Evidence Vault Case Folder
        save_investigation(
            agent_type="visual_scam",
            investigation_id=investigation_id,
            risk_score=result["risk_score"],
            threat_level=result["threat_level"],
            input_data=f"Visual Scan: {filename}",
            summary=result["reasoning"],
            full_report=result,
            recommendation=", ".join(result["recommendations"]),
            case_id=resolved_case_id
        )
        
        return result
    except Exception as run_err:
        logger.error(f"Visual Scan analysis crash caught: {run_err}", exc_info=True)
        # Safe error recovery to avoid server crashes
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Visual analysis process error: {str(run_err)}"
        )
