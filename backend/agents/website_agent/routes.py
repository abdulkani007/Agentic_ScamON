import logging
import os
import hashlib
import uuid
from datetime import datetime
from typing import Optional, Dict, List, Any
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from database import get_db

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from .screenshot_service import capture_screenshot
from .redirect_checker import trace_redirects
from .header_checker import inspect_headers
from .metadata_extractor import extract_html_metadata
from .llm_reasoning import run_llm_reasoning
from .db import log_analysis, get_previous_scan
from .investigation_coordinator import run_modular_investigation
from bson import ObjectId
from .protection_engine import (
    is_domain_blocked,
    block_domain,
    unblock_domain,
    get_all_blocked_domains,
    get_block_history,
    normalize_domain_name,
)

from .utils import extract_domain, normalize_url
from .qr_decoder import decode_qr
from .whois_checker import lookup_whois
from .ssl_checker import check_ssl
from .typosquat_checker import check_typosquatting
from .phishtank_checker import check_phishtank
from .entity_extractor import extract_entities
from .risk_engine import calculate_risk_score
from .schemas import (
    DomainDetails,
    EntityDetails,
    PhishTankDetails,
    SSLDetails,
    TyposquatDetails,
    AIReasoningDetails,
    MemoryHistoryDetails,
    TimelineItem,
    WebsiteAnalysisResponse,
    BlockRequest,
    BlockResponse,
    ProtectionStatusResponse,
    BlockHistoryItem,
    BlockHistoryResponse,
    WebsiteBlockRequest,
    WebsiteUnblockRequest,
    WebsiteActionResponse,
    WebsiteCheckResponse,
    BlockedWebsiteItem,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/website-analysis",
    response_model=WebsiteAnalysisResponse,
    summary="Analyzes URLs or QR Code Images for phishing and security risks.",
    description="Accepts a URL string or an uploaded QR code image. Decodes QR codes if uploaded, then performs WHOIS registry, SSL certificate, typosquatting, and PhishTank database verifications.",
)
async def analyze_website(
    url: Optional[str] = Form(None),
    qr_image: Optional[UploadFile] = File(None),
    scan_anyway: Optional[bool] = Form(False),
) -> WebsiteAnalysisResponse:
    # Initialize SOC investigation timeline and mission status log
    timeline = []
    
    def add_timeline_step(step_name: str, status: str = "completed"):
        timeline.append(
            TimelineItem(
                step=step_name,
                status=status,
                timestamp=datetime.now().strftime("%H:%M:%S")
            )
        )

    # Step 1: Create Plan
    add_timeline_step("SOC Plan Created")
    add_timeline_step("Input Target Checked")

    if not url and not qr_image:
        logger.warning("Website analysis requested but no inputs were provided.")
        add_timeline_step("Input Validation Failed", "failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'url' or 'qr_image' must be provided.",
        )

    target_url = ""
    source_type = "URL"
    qr_url = None

    # Step 2: Decode QR Code if present
    if qr_image:
        source_type = "QR"
        add_timeline_step("QR Image Uploaded")
        try:
            logger.info(
                f"Processing uploaded QR image: {qr_image.filename} (MIME: {qr_image.content_type})"
            )
            image_bytes = await qr_image.read()

            # Save the uploaded QR image so it is serveable
            img_hash = hashlib.md5(image_bytes).hexdigest()
            qr_filename = f"{img_hash}.png"
            static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../static"))
            qrs_dir = os.path.join(static_dir, "qrs")
            os.makedirs(qrs_dir, exist_ok=True)
            with open(os.path.join(qrs_dir, qr_filename), "wb") as f:
                f.write(image_bytes)
            qr_url = f"/static/qrs/{qr_filename}"

            target_url = decode_qr(image_bytes)
            add_timeline_step("QR Target Decoded")
        except ValueError as val_err:
            logger.warning(f"QR decoding validation error: {val_err}")
            add_timeline_step("QR Decoding Failed", "failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(val_err),
            )
        except Exception as err:
            logger.error(f"Uncaught QR decoding exception: {err}", exc_info=True)
            add_timeline_step("QR Decoding Failed", "failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"QR image processing error: {str(err)}",
            )
    else:
        target_url = url

    # Step 3: URL Normalization
    normalized = normalize_url(target_url)
    domain = extract_domain(normalized)
    add_timeline_step("Target Normalization")

    # Pre-scan Check: If website is blocked and scan_anyway is not True
    if not scan_anyway and is_domain_blocked(domain):
        add_timeline_step("Website Blocked Pre-Check")
        
        blocked_time_val = None
        blocked_by_val = "Website Investigation Agent"
        threat_type_val = "Phishing"
        risk_score_val = 90
        reason_val = "High Risk Website"
        
        db = get_db()
        if db is not None:
            try:
                collection = db["blocked_websites"]
                doc = collection.find_one({"domain": domain})
                if doc:
                    blocked_time_val = doc.get("blocked_at")
                    blocked_by_val = doc.get("blocked_by") or blocked_by_val
                    threat_type_val = doc.get("threat_type") or threat_type_val
                    risk_score_val = doc.get("risk_score") or risk_score_val
                    reason_val = doc.get("reason") or reason_val
            except Exception as db_err:
                logger.warning(f"Error querying blocked details for pre-check: {db_err}")

        ai_details = AIReasoningDetails(
            summary="This website has been blocked by ScamON AI active protection system.",
            threat_category=threat_type_val,
            confidence_rating=100,
            final_decision="BLOCKED",
            reasoning_steps=["Website exists in active blocklist database.", "Domain is blocked by administrator request."],
            recommended_action="Access is blocked. Do not proceed."
        )

        response_payload = WebsiteAnalysisResponse(
            source=source_type,
            url=normalized,
            risk_score=risk_score_val,
            confidence=100,
            threat_type=threat_type_val,
            detected_brand="",
            detected_keywords=[],
            screenshot_url="",
            qr_url=qr_url,
            page_title="Blocked Website",
            favicon_url="",
            http_status=None,
            screenshot_time=None,
            screenshot_resolution=None,
            screenshot_success=False,
            screenshot_error_reason="Website is blocked by ScamON AI",
            domain=DomainDetails(
                name=domain,
                age_days=0,
                registrar="Unknown",
            ),
            ssl=SSLDetails(
                valid=False,
                issuer="Unknown",
                expiry=None,
            ),
            typosquat=TyposquatDetails(
                detected=False,
                original_brand="",
                similarity=0,
            ),
            phishtank=PhishTankDetails(known_phishing=True),
            entities=EntityDetails(
                organization="Blocked",
                domain=domain,
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            ),
            recommendation="This website is already blocked by ScamON AI.",
            investigation_id=str(uuid.uuid4()),
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            redirect_history=[],
            security_headers={},
            html_metadata={},
            ai_reasoning=ai_details,
            memory_history=MemoryHistoryDetails(
                has_history=True,
                last_timestamp=blocked_time_val,
                last_risk_score=risk_score_val,
                last_verdict="BLOCKED"
            ),
            timeline=timeline,
            mission_status="BLOCKED",
            investigation_modules=[],
            is_blocked=True,
            blocked_time=blocked_time_val,
            blocked_by=blocked_by_val
        )
        return response_payload

    # Step 4: Run Enterprise Modular SOC Investigation
    investigation = await run_modular_investigation(normalized)
    modules_results = investigation["modules"]
    verified_evidence = investigation["verified_evidence"]
    verdict = investigation["verdict"]

    # Map details for backward-compatible response fields
    # WHOIS Details
    whois_mod = next((m for m in modules_results if m["module"] == "WHOIS Lookup"), {})
    whois_res = whois_mod.get("evidence", {}) if whois_mod.get("status") == "success" else {
        "name": domain, "age_days": -1, "registrar": "Unknown", "organization": "Unknown", "country": "Unknown"
    }
    add_timeline_step("WHOIS Registry Fetched")

    # SSL Details
    ssl_mod = next((m for m in modules_results if m["module"] == "SSL Certificate Validation"), {})
    ssl_res = ssl_mod.get("evidence", {}) if ssl_mod.get("status") == "success" else {
        "valid": False, "issuer": "Unknown", "expiry": None
    }
    add_timeline_step("SSL Handshake Verified")

    # Typosquatting Details
    typosquat_mod = next((m for m in modules_results if m["module"] == "Typosquatting Detection"), {})
    typosquat_res = typosquat_mod.get("evidence", {}) if typosquat_mod.get("status") == "success" else {
        "detected": False, "original_brand": "None", "similarity": 0
    }
    add_timeline_step("Brand Impersonation Checked")

    # PhishTank Details
    pt_mod = next((m for m in modules_results if m["module"] == "PhishTank"), {})
    known_phishing = pt_mod.get("evidence", {}).get("is_phishing", False) if pt_mod.get("status") == "success" else False
    add_timeline_step("PhishTank Signatures Queried")

    # Redirect Hops Details
    redirects_mod = next((m for m in modules_results if m["module"] == "Redirect Analysis"), {})
    redirects_res = redirects_mod.get("evidence", {}) if redirects_mod.get("status") == "success" else {
        "hops_count": 0, "history": []
    }
    add_timeline_step("Redirect Chain Audited")

    # Inspect HTTP security headers
    headers_res = inspect_headers(normalized)
    add_timeline_step("Security Headers Audited")

    # HTML Metadata details
    metadata_mod = next((m for m in modules_results if m["module"] == "HTML Metadata Extraction"), {})
    metadata_res = metadata_mod.get("evidence", {}) if metadata_mod.get("status") == "success" else {
        "title": "", "description": "", "keywords": ""
    }
    add_timeline_step("HTML Head Harvested")

    # Screenshot details
    screenshot_mod = next((m for m in modules_results if m["module"] == "Screenshot Capture"), {})
    screenshot_res = {
        "success": screenshot_mod.get("status") == "success",
        "screenshot_url": screenshot_mod.get("evidence", {}).get("screenshot_url") if screenshot_mod.get("status") == "success" else None,
        "page_title": screenshot_mod.get("evidence", {}).get("page_title") if screenshot_mod.get("status") == "success" else None,
        "favicon_url": f"https://www.google.com/s2/favicons?domain={domain}&sz=64",
        "http_status": next((m.get("evidence", {}).get("status_code") for m in modules_results if m["module"] == "HTTP Status Check"), 200),
        "screenshot_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "screenshot_resolution": "1280x800",
        "error_reason": screenshot_mod.get("error") if screenshot_mod.get("status") != "success" else None
    }
    add_timeline_step("Website Preview Screenshot Captured")

    # Entity Extraction
    entities_res = extract_entities(domain, whois_res)

    # Risk result mapping
    risk_res = {
        "risk_score": verdict["risk_score"],
        "threat_type": verdict["decision"] if verdict["decision"] != "SAFE" else "Legitimate Website",
        "detected_brand": verdict["detected_brand"],
        "detected_keywords": verdict["detected_keywords"]
    }

    # Step 5: AI Threat Reasoning using Groq LLM
    ai_reasoning = run_llm_reasoning(
        url=normalized,
        domain=domain,
        whois_res=whois_res,
        ssl_res=ssl_res,
        typosquat_res=typosquat_res,
        known_phishing=known_phishing,
        redirects_res=redirects_res,
        headers_res=headers_res,
        metadata_res=metadata_res,
        screenshot_res=screenshot_res,
        verified_evidence=verified_evidence,
        verdict=verdict
    )
    add_timeline_step("LLM Threat Reasoning Finished")

    # Align risk score and verdict dynamically with AI analyst decisions
    ai_decision = ai_reasoning["final_decision"]
    risk_score = verdict["risk_score"]
    
    if ai_decision == "HIGH RISK":
        recommendation = "BLOCK IMMEDIATELY"
    elif ai_decision == "SUSPICIOUS":
        recommendation = "SUSPICIOUS"
    else:
        recommendation = "SAFE"

    # Step 6: Database Memory Recall
    prev_scan = get_previous_scan(normalized)
    
    if prev_scan:
        last_risk = prev_scan.get("risk_score", 0)
        memory_history = MemoryHistoryDetails(
            has_history=True,
            last_timestamp=prev_scan.get("timestamp"),
            last_risk_score=last_risk,
            last_verdict=prev_scan.get("ai_reasoning", {}).get("final_decision") or prev_scan.get("recommendation"),
            score_diff=risk_score - last_risk
        )
    else:
        memory_history = MemoryHistoryDetails(
            has_history=False,
            last_timestamp=None,
            last_risk_score=None,
            last_verdict=None,
            score_diff=0
        )
    add_timeline_step("Database Memory Recalled")

    # Step 7: Agent-to-Agent Collaboration with Agent 5 (Correlation Agent)
    collaborative_payload = {
        "url": normalized,
        "risk_score": risk_score,
        "threat": ai_reasoning["threat_category"],
        "brand": typosquat_res.get("original_brand", "None"),
        "keywords": risk_res.get("detected_keywords", []),
        "evidence": [k for k, v in {
            "SSL Certificate": ssl_res["valid"],
            "WHOIS Age": whois_res["age_days"] != -1,
            "Registrar Info": whois_res["registrar"] != "Unknown",
            "Page Screenshot": screenshot_res["success"],
            "Brand Match": typosquat_res["detected"]
        }.items() if v],
        "recommendation": ai_reasoning["recommended_action"]
    }
    
    try:
        logger.info(f"Agent 4 collaborating with Agent 5 (Correlation Agent). Dispatching payload: {collaborative_payload}")
    except Exception as dispatch_err:
        logger.warning(f"Failed to print collaboration dispatch log: {dispatch_err}")
    add_timeline_step("Correlation Agent Dispatched")

    # Form final AI reasoning schema object
    ai_details = AIReasoningDetails(
        summary=ai_reasoning["summary"],
        threat_category=ai_reasoning["threat_category"] if ai_reasoning.get("final_decision") != "SAFE" else "None (Legitimate Service)",
        confidence_rating=ai_reasoning["confidence_rating"],
        final_decision=ai_reasoning["final_decision"],
        reasoning_steps=ai_reasoning["reasoning_steps"],
        recommended_action=ai_reasoning["recommended_action"],
        trust_indicators=ai_reasoning.get("trust_indicators") or verdict.get("trust_indicators", []),
        risk_indicators=ai_reasoning.get("risk_indicators") or verdict.get("risk_indicators", [])
    )

    # Resolve block metadata if domain is blocked
    is_blocked_status = is_domain_blocked(domain)
    blocked_time_val = None
    blocked_by_val = None
    if is_blocked_status:
        try:
            history = get_block_history()
            for h in history:
                if h.get("domain") == domain and h.get("action") == "block" and h.get("success"):
                    blocked_time_val = h.get("timestamp")
                    blocked_by_val = h.get("blocked_by") or "Website Protection Agent"
                    break
        except Exception as err:
            logger.warning(f"Error fetching block history for metadata: {err}")

    investigation_uuid = str(uuid.uuid4())
    current_time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    # 5. Compile Response
    response_payload = WebsiteAnalysisResponse(
        source=source_type,
        url=normalized,
        trust_score=verdict.get("trust_score", 0),
        risk_score=risk_score,
        confidence=ai_reasoning["confidence_rating"],
        threat_type=risk_res["threat_type"],
        detected_brand=risk_res["detected_brand"],
        detected_keywords=risk_res["detected_keywords"],
        screenshot_url=screenshot_res["screenshot_url"],
        qr_url=qr_url,
        page_title=screenshot_res["page_title"],
        favicon_url=screenshot_res["favicon_url"],
        http_status=screenshot_res["http_status"],
        screenshot_time=screenshot_res["screenshot_time"],
        screenshot_resolution=screenshot_res["screenshot_resolution"],
        screenshot_success=screenshot_res["success"],
        screenshot_error_reason=screenshot_res["error_reason"],
        domain=DomainDetails(
            name=whois_res["name"],
            age_days=whois_res["age_days"],
            registrar=whois_res["registrar"],
        ),
        ssl=SSLDetails(
            valid=ssl_res["valid"],
            issuer=ssl_res["issuer"],
            expiry=ssl_res["expiry"],
        ),
        typosquat=TyposquatDetails(
            detected=typosquat_res["detected"],
            original_brand=typosquat_res["original_brand"],
            similarity=typosquat_res["similarity"],
        ),
        phishtank=PhishTankDetails(known_phishing=known_phishing),
        entities=EntityDetails(
            organization=entities_res["organization"],
            domain=entities_res["domain"],
            timestamp=entities_res["timestamp"],
        ),
        recommendation=recommendation,
        investigation_id=investigation_uuid,
        timestamp=current_time_str,
        redirect_history=redirects_res["history"],
        security_headers=headers_res["findings"],
        html_metadata=metadata_res,
        ai_reasoning=ai_details,
        memory_history=memory_history,
        timeline=timeline,
        mission_status="COMPLETED",
        investigation_modules=modules_results,
        is_blocked=is_blocked_status,
        blocked_time=blocked_time_val,
        blocked_by=blocked_by_val
    )

    try:
        log_payload = response_payload.model_dump()
        log_analysis(log_payload)
        
        # Save to unified investigations history
        from agents.history_helper import save_investigation
        threat_level = "SAFE"
        if response_payload.risk_score >= 75:
            threat_level = "CRITICAL"
        elif response_payload.risk_score >= 50:
            threat_level = "HIGH"
        elif response_payload.risk_score >= 25:
            threat_level = "MEDIUM"
        elif response_payload.risk_score >= 10:
            threat_level = "LOW"
            
        save_investigation(
            agent_type="website",
            investigation_id=response_payload.investigation_id,
            risk_score=response_payload.risk_score,
            threat_level=threat_level,
            input_data=response_payload.url,
            summary=response_payload.ai_reasoning.summary,
            full_report=log_payload,
            recommendation=response_payload.recommendation
        )
    except Exception as log_err:
        logger.warning(f"Failed to copy logs payload to database: {log_err}")

    return response_payload


@router.get(
    "/protection/status",
    response_model=ProtectionStatusResponse,
    summary="Retrieves status and count of blocked domains in the Protection Engine.",
)
async def get_protection_status() -> ProtectionStatusResponse:
    try:
        blocked = get_all_blocked_domains()
        return ProtectionStatusResponse(
            status="Active",
            total_blocked=len(blocked),
            blocked_domains=blocked
        )
    except Exception as err:
        logger.error(f"Failed to fetch protection status: {err}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch protection status: {str(err)}"
        )


@router.get(
    "/protection/history",
    response_model=BlockHistoryResponse,
    summary="Retrieves full log of blocked/unblocked actions.",
)
async def get_protection_history() -> BlockHistoryResponse:
    try:
        history = get_block_history()
        # Parse history items into schema list
        items = []
        for h in history:
            items.append(
                BlockHistoryItem(
                    domain=h["domain"],
                    action=h["action"],
                    timestamp=h["timestamp"],
                    success=h["success"],
                    details=h["details"]
                )
            )
        return BlockHistoryResponse(history=items)
    except Exception as err:
        logger.error(f"Failed to fetch protection history: {err}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch protection history: {str(err)}"
        )


@router.post(
    "/protection/block",
    response_model=BlockResponse,
    summary="Blocks a domain in system hosts file and blocklist database.",
)
async def block_website_domain(req: BlockRequest) -> BlockResponse:
    try:
        res = block_domain(req.domain)
        return BlockResponse(
            success=res["success"],
            message=res["message"],
            error=res["error"],
            admin_error=res["admin_error"],
            blocked_time=res.get("blocked_time"),
            blocked_by=res.get("blocked_by")
        )
    except Exception as err:
        logger.error(f"Failed to block domain {req.domain}: {err}")
        return BlockResponse(
            success=False,
            message="Internal Server Error occurred during block operation.",
            error=str(err),
            admin_error=False
        )


@router.post(
    "/protection/unblock",
    response_model=BlockResponse,
    summary="Unblocks a domain in system hosts file and blocklist database.",
)
async def unblock_website_domain(req: BlockRequest) -> BlockResponse:
    try:
        res = unblock_domain(req.domain)
        return BlockResponse(
            success=res["success"],
            message=res["message"],
            error=res["error"],
            admin_error=res["admin_error"]
        )
    except Exception as err:
        logger.error(f"Failed to unblock domain {req.domain}: {err}")
        return BlockResponse(
            success=False,
            message="Internal Server Error occurred during unblock operation.",
            error=str(err),
            admin_error=False
        )


@router.get("/api/history/websites", tags=["Dashboard"])
async def get_websites_history():
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db["website_scans"].find().sort("_id", -1)
        history = []
        for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            history.append(doc)
        return history
    except Exception as err:
        logger.error(f"Failed to fetch website scans history: {err}")
        return []


@router.get("/api/history/calls", tags=["Dashboard"])
async def get_calls_history():
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db["call_scans"].find().sort("_id", -1)
        history = []
        for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            history.append(doc)
        return history
    except Exception as err:
        logger.error(f"Failed to fetch call scans history: {err}")
        return []


@router.get("/api/history/sms", tags=["Dashboard"])
async def get_sms_history():
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db["sms_scans"].find().sort("_id", -1)
        history = []
        for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            history.append(doc)
        return history
    except Exception as err:
        logger.error(f"Failed to fetch sms scans history: {err}")
        return []


@router.get("/api/history/emails", tags=["Dashboard"])
async def get_emails_history():
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db["email_scans"].find().sort("_id", -1)
        history = []
        for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            history.append(doc)
        return history
    except Exception as err:
        logger.error(f"Failed to fetch email scans history: {err}")
        return []
@router.get("/api/history/complaints", tags=["Dashboard"])
async def get_complaints_history():
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db["email_scans"].find().sort("_id", -1)
        history = []
        for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            history.append(doc)
        return history
    except Exception as err:
        logger.error(f"Failed to fetch complaints history: {err}")
        return []

from fastapi.responses import StreamingResponse
import io
import csv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

@router.get("/api/history", tags=["Dashboard History"])
async def get_unified_history(
    page: int = 1,
    limit: int = 10,
    agent_type: str = "All",
    threat_level: str = "All",
    status: str = "All",
    risk_score: str = "All",
    search: str = "",
    sort_by: str = "newest",
    case_id: Optional[str] = None,
    source: Optional[str] = None
):
    db = get_db()
    if db is None:
        return {"items": [], "total": 0, "stats": {}}
    try:
        query = {}
        if case_id:
            query["case_id"] = case_id
        if source:
            query["source"] = source
        if agent_type and agent_type != "All":
            # Map friendly tab names to database codes
            agent_map = {
                "website": "website",
                "email": "email",
                "call analysis": "call",
                "live call": "live_call",
                "complaint reports": "complaint",
                "xai summaries": "xai",
                "threat correlation": "threat_correlation"
            }
            mapped_type = agent_map.get(agent_type.lower(), agent_type.lower())
            query["agent_type"] = mapped_type

        if threat_level and threat_level != "All":
            query["threat_level"] = threat_level.upper()
        if status and status != "All":
            query["status"] = status.lower()
        if risk_score and risk_score != "All":
            if "-" in risk_score:
                parts = risk_score.split("-")
                query["risk_score"] = {"$gte": int(parts[0]), "$lte": int(parts[1])}

        if search:
            query["$or"] = [
                {"input": {"$regex": search, "$options": "i"}},
                {"investigation_id": {"$regex": search, "$options": "i"}},
                {"summary": {"$regex": search, "$options": "i"}},
                {"recommendation": {"$regex": search, "$options": "i"}}
            ]

        # Determine Sorting
        sort_field = "_id"
        sort_dir = -1
        if sort_by == "oldest":
            sort_dir = 1
        elif sort_by == "highest_risk":
            sort_field = "risk_score"
            sort_dir = -1
        elif sort_by == "lowest_risk":
            sort_field = "risk_score"
            sort_dir = 1

        # Count total matching
        total_items = db["investigations"].count_documents(query)

        # Retrieve items projected (no full_report for lazy loading)
        cursor = db["investigations"].find(query, {"full_report": 0}).sort(sort_field, sort_dir).skip((page - 1) * limit).limit(limit)
        items = []
        for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            items.append(doc)

        # Compile statistics
        total_all = db["investigations"].count_documents({})
        today_str = datetime.now().strftime("%Y-%m-%d")
        total_today = db["investigations"].count_documents({"timestamp": {"$regex": f"^{today_str}"}})
        
        critical_count = db["investigations"].count_documents({"threat_level": "CRITICAL"})
        high_count = db["investigations"].count_documents({"threat_level": "HIGH"})
        medium_count = db["investigations"].count_documents({"threat_level": "MEDIUM"})
        low_count = db["investigations"].count_documents({"threat_level": "LOW"})
        safe_count = db["investigations"].count_documents({"threat_level": "SAFE"})

        stats = {
            "total": total_all,
            "today": total_today,
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count,
            "safe": safe_count
        }

        return {
            "items": items,
            "total": total_items,
            "stats": stats
        }
    except Exception as err:
        logger.error(f"Failed to fetch unified investigations history: {err}")
        return {"items": [], "total": 0, "stats": {}}

@router.get("/api/history/{investigation_id}", tags=["Dashboard History"])
async def get_unified_investigation_details(investigation_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection offline.")
    try:
        doc = db["investigations"].find_one({"investigation_id": investigation_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Investigation not found.")
        doc["_id"] = str(doc["_id"])
        return doc
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Failed to fetch investigation details: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.delete("/api/history/{investigation_id}", tags=["Dashboard History"])
async def delete_unified_investigation(investigation_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection offline.")
    try:
        res = db["investigations"].delete_one({"investigation_id": investigation_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Investigation not found.")
        return {"success": True, "message": "Investigation successfully deleted."}
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Failed to delete investigation: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.delete("/api/history", tags=["Dashboard History"])
async def delete_multiple_or_all_investigations(
    ids: Optional[str] = None,
    all_history: Optional[bool] = None
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection offline.")
    try:
        if all_history:
            db["investigations"].delete_many({})
            return {"success": True, "message": "All investigation history has been cleared successfully."}
        elif ids:
            id_list = [i.strip() for i in ids.split(",") if i.strip()]
            res = db["investigations"].delete_many({"investigation_id": {"$in": id_list}})
            return {"success": True, "message": f"Successfully deleted {res.deleted_count} investigations."}
        else:
            raise HTTPException(status_code=400, detail="Either 'ids' or 'all_history' parameter must be provided.")
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Failed to clear history: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.get("/api/history/{investigation_id}/export/json", tags=["Dashboard History"])
async def export_investigation_json(investigation_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection offline.")
    try:
        doc = db["investigations"].find_one({"investigation_id": investigation_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Investigation not found.")
        doc["_id"] = str(doc["_id"])
        
        json_data = json.dumps(doc, indent=2)
        stream = io.BytesIO(json_data.encode("utf-8"))
        
        return StreamingResponse(
            stream,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=investigation_{investigation_id}.json"}
        )
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"JSON export failure: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.get("/api/history/{investigation_id}/export/csv", tags=["Dashboard History"])
async def export_investigation_csv(investigation_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection offline.")
    try:
        doc = db["investigations"].find_one({"investigation_id": investigation_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Investigation not found.")
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(["Investigation ID", "Agent Type", "Timestamp", "Risk Score", "Threat Level", "Input Source", "Summary", "Recommendation", "Status"])
        # Write values
        writer.writerow([
            doc.get("investigation_id", ""),
            doc.get("agent_type", ""),
            doc.get("timestamp", ""),
            doc.get("risk_score", 0),
            doc.get("threat_level", ""),
            doc.get("input", ""),
            doc.get("summary", ""),
            doc.get("recommendation", ""),
            doc.get("status", "")
        ])
        
        stream = io.BytesIO(output.getvalue().encode("utf-8"))
        return StreamingResponse(
            stream,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=investigation_{investigation_id}.csv"}
        )
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"CSV export failure: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.get("/api/history/{investigation_id}/export/pdf", tags=["Dashboard History"])
async def export_investigation_pdf(investigation_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection offline.")
    try:
        doc = db["investigations"].find_one({"investigation_id": investigation_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Investigation not found.")
            
        buffer = io.BytesIO()
        pdf = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'PDFTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#00E676'),
            spaceAfter=15
        )
        section_style = ParagraphStyle(
            'PDFSection',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#00A3FF'),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'PDFBody',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#333333'),
            spaceAfter=8
        )
        
        story.append(Paragraph("ScamON AI Forensic Audit Report", title_style))
        story.append(Paragraph("Unified Agent Security Assessment Log", styles['Heading3']))
        story.append(Spacer(1, 15))
        
        # Metadata Table
        data = [
            [Paragraph("<b>Investigation ID:</b>", body_style), Paragraph(doc.get("investigation_id", ""), body_style)],
            [Paragraph("<b>Agent Name:</b>", body_style), Paragraph(doc.get("agent_type", "").upper() + " AGENT", body_style)],
            [Paragraph("<b>Timestamp:</b>", body_style), Paragraph(doc.get("timestamp", ""), body_style)],
            [Paragraph("<b>Threat Level:</b>", body_style), Paragraph(doc.get("threat_level", ""), body_style)],
            [Paragraph("<b>Risk Score:</b>", body_style), Paragraph(f"{doc.get('risk_score', 0)}/100", body_style)],
            [Paragraph("<b>Input Scanned:</b>", body_style), Paragraph(doc.get("input", ""), body_style)]
        ]
        
        t = Table(data, colWidths=[120, 400])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f5f5f5')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dddddd')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("Threat Investigation Summary", section_style))
        story.append(Paragraph(doc.get("summary", "No summary details provided."), body_style))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("Security Recommendations", section_style))
        story.append(Paragraph(doc.get("recommendation", "No recommendations provided."), body_style))
        
        pdf.build(story)
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=investigation_{investigation_id}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"PDF export failure: {err}")
        raise HTTPException(status_code=500, detail=str(err))

@router.get("/api/blocked-websites", tags=["Dashboard"])
async def get_blocked_websites_history():
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db["blocked_websites"].find({"blocked": True}).sort("_id", -1)
        blocked = []
        for doc in cursor:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            blocked.append(doc)
        return blocked
    except Exception as err:
        logger.error(f"Failed to fetch blocked websites: {err}")
        return []


@router.get("/api/dashboard/stats", tags=["Dashboard"])
async def get_dashboard_stats():
    db = get_db()
    if db is None:
        return {
            "total_scans": 0,
            "high_risk_websites": 0,
            "blocked_websites": 0,
            "safe_websites": 0,
            "investigations_today": 0,
            "total_complaints": 0
        }
    try:
        total_web = db["website_scans"].count_documents({})
        total_calls = db["call_scans"].count_documents({})
        total_sms = db["sms_scans"].count_documents({})
        total_emails = db["email_scans"].count_documents({})
        total_scans = total_web + total_calls + total_sms + total_emails

        high_risk_websites = db["website_scans"].count_documents({"risk_score": {"$gte": 75}})
        safe_websites = db["website_scans"].count_documents({"risk_score": {"$lt": 50}})
        blocked_websites = db["blocked_websites"].count_documents({"blocked": True})

        today_prefix = datetime.now().strftime("%Y-%m-%d")
        regex_query = {"timestamp": {"$regex": f"^{today_prefix}"}}
        web_today = db["website_scans"].count_documents(regex_query)
        calls_today = db["call_scans"].count_documents(regex_query)
        sms_today = db["sms_scans"].count_documents(regex_query)
        emails_today = db["email_scans"].count_documents(regex_query)
        investigations_today = web_today + calls_today + sms_today + emails_today

        return {
            "total_scans": total_scans,
            "high_risk_websites": high_risk_websites,
            "blocked_websites": blocked_websites,
            "safe_websites": safe_websites,
            "investigations_today": investigations_today,
            "total_complaints": total_emails
        }
    except Exception as err:
        logger.error(f"Failed to compile dashboard stats: {err}")
        return {
            "total_scans": 0,
            "high_risk_websites": 0,
            "blocked_websites": 0,
            "safe_websites": 0,
            "investigations_today": 0,
            "total_complaints": 0
        }


@router.post(
    "/api/websites/block",
    response_model=WebsiteActionResponse,
    summary="Blocks a website and adds it to the protection database.",
    tags=["Protection APIs"]
)
async def api_block_website(req: WebsiteBlockRequest) -> WebsiteActionResponse:
    try:
        domain = req.domain or normalize_domain_name(req.url)
        if not domain:
            raise HTTPException(status_code=400, detail="Domain or URL must be provided.")
            
        res = block_domain(
            domain=domain,
            reason=req.reason or "High Risk Website",
            url=req.url,
            risk_score=req.risk_score,
            threat_type=req.threat_type
        )
        return WebsiteActionResponse(
            success=res["success"],
            message=res["message"]
        )
    except Exception as err:
        logger.error(f"Failed to block website via API: {err}")
        return WebsiteActionResponse(
            success=False,
            message=f"Internal error: {str(err)}"
        )


@router.post(
    "/api/websites/unblock",
    response_model=WebsiteActionResponse,
    summary="Unblocks a website domain in the database and host file.",
    tags=["Protection APIs"]
)
async def api_unblock_website(req: WebsiteUnblockRequest) -> WebsiteActionResponse:
    try:
        res = unblock_domain(req.domain)
        return WebsiteActionResponse(
            success=res["success"],
            message=res["message"]
        )
    except Exception as err:
        logger.error(f"Failed to unblock website via API: {err}")
        return WebsiteActionResponse(
            success=False,
            message=f"Internal error: {str(err)}"
        )


@router.get(
    "/api/websites/blocked",
    response_model=List[BlockedWebsiteItem],
    summary="Returns all blocked websites sorted by latest first.",
    tags=["Protection APIs"]
)
async def api_get_blocked_websites() -> List[BlockedWebsiteItem]:
    db = get_db()
    if db is not None:
        try:
            cursor = db["blocked_websites"].find().sort("updated_at", -1)
            items = []
            for doc in cursor:
                doc["_id"] = str(doc["_id"])
                items.append(BlockedWebsiteItem(**doc))
            return items
        except Exception as err:
            logger.error(f"Failed to fetch blocked websites via MongoDB: {err}")

    # Fallback to local JSON DB
    try:
        from agents.website_agent.protection_engine import read_local_db
        local_data = read_local_db()
        items = []
        for item in local_data.get("blocklist", []):
            if item.get("blocked", True) is True:
                items.append(BlockedWebsiteItem(
                    domain=item.get("domain"),
                    url=item.get("url") or f"https://{item.get('domain')}",
                    risk_score=item.get("risk_score") or 90,
                    threat_type=item.get("threat_type") or "Malware",
                    reason=item.get("reason") or "Blocked",
                    blocked=True,
                    blocked_at=item.get("blocked_time"),
                    unblocked=False,
                    unblocked_at=None,
                    blocked_by=item.get("blocked_by") or "Website Investigation Agent",
                    created_at=item.get("blocked_time"),
                    updated_at=item.get("blocked_time")
                ))
        return items
    except Exception as err:
        logger.error(f"Failed to fetch blocked websites via local DB fallback: {err}")
        return []


@router.get(
    "/api/websites/check",
    summary="Checks if a domain is currently blocked via query parameter.",
    tags=["Protection APIs"]
)
async def api_check_website_blocked_query(domain: str):
    try:
        normalized = normalize_domain_name(domain)
        from agents.website_agent.protection_engine import is_domain_blocked
        if not is_domain_blocked(normalized):
            return {"blocked": False}

        db = get_db()
        reason = "Phishing Website"
        risk_score = 90
        
        if db is not None:
            try:
                collection = db["blocked_websites"]
                doc = collection.find_one({"domain": normalized})
                if doc:
                    reason = doc.get("reason") or reason
                    risk_score = doc.get("risk_score") or risk_score
            except Exception:
                pass
        else:
            try:
                from agents.website_agent.protection_engine import read_local_db
                local_data = read_local_db()
                for item in local_data.get("blocklist", []):
                    if item.get("domain") == normalized:
                        reason = item.get("reason") or reason
                        risk_score = item.get("risk_score") or risk_score
                        break
            except Exception:
                pass

        return {
            "blocked": True,
            "reason": reason,
            "risk_score": risk_score
        }
    except Exception as err:
        logger.error(f"Failed to check website query status: {err}")
        return {"blocked": False}


@router.get(
    "/api/websites/check/{domain}",
    response_model=WebsiteCheckResponse,
    summary="Checks if a domain is currently blocked.",
    tags=["Protection APIs"]
)
async def api_check_website_blocked(domain: str) -> WebsiteCheckResponse:
    try:
        normalized = normalize_domain_name(domain)
        is_blocked = is_domain_blocked(normalized)
        if is_blocked:
            return WebsiteCheckResponse(
                blocked=True,
                message="Website already exists in protection list."
            )
        return WebsiteCheckResponse(blocked=False)
    except Exception as err:
        logger.error(f"Failed to check website status: {err}")
        return WebsiteCheckResponse(blocked=False)


@router.delete(
    "/api/websites/block/{id}",
    response_model=WebsiteActionResponse,
    summary="Deletes a blocked website document from the database.",
    tags=["Protection APIs"]
)
async def api_delete_blocked_website(id: str) -> WebsiteActionResponse:
    db = get_db()
    if db is None:
        return WebsiteActionResponse(success=False, message="Database offline.")
    try:
        collection = db["blocked_websites"]
        res = collection.delete_one({"_id": ObjectId(id)})
        if res.deleted_count > 0:
            return WebsiteActionResponse(success=True, message="Website entry deleted successfully.")
        return WebsiteActionResponse(success=False, message="Website entry not found.")
    except Exception as err:
        logger.error(f"Failed to delete website entry: {err}")
        return WebsiteActionResponse(success=False, message=f"Internal error: {str(err)}")


# --- ScamON AI Assistant Chat API ---
import json
import requests
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str
    content: str

class WebsiteChatRequest(BaseModel):
    report: Dict[str, Any]
    message: str
    history: List[ChatMessage]


def compile_assistant_context(report: Dict[str, Any]) -> str:
    url = report.get("url", "N/A")
    risk_score = report.get("risk_score", "N/A")
    
    # Final decision or verdict
    ai_reason = report.get("ai_reasoning", {})
    threat_level = ai_reason.get("final_decision", report.get("threat_type", "N/A"))
    
    # Domain info
    domain_data = report.get("domain", {})
    domain_age = f"{domain_data.get('age_days', 'N/A')} days"
    whois_info = f"Registrar: {domain_data.get('registrar', 'N/A')}, Name: {domain_data.get('name', 'N/A')}"
    
    # SSL status
    ssl_data = report.get("ssl", {})
    ssl_status = f"Valid: {ssl_data.get('valid', 'N/A')}, Issuer: {ssl_data.get('issuer', 'N/A')}, Expiry: {ssl_data.get('expiry', 'N/A')}"
    
    # DNS Information
    modules = report.get("investigation_modules", [])
    dns_module = next((m for m in modules if m.get("module") == "DNS Resolution"), {})
    dns_info = str(dns_module.get("evidence", "N/A"))
    
    # VirusTotal Result
    vt_module = next((m for m in modules if m.get("module") == "VirusTotal"), {})
    virustotal_result = str(vt_module.get("evidence", "N/A"))
    
    # Brand Impersonation Result
    typo_data = report.get("typosquat", {})
    brand_impersonation_result = f"Detected typosquatting: {typo_data.get('detected', 'N/A')}, Original brand: {typo_data.get('original_brand', 'N/A')}, Similarity: {typo_data.get('similarity', 'N/A')}%"
    
    # Phishing Indicators
    phishing_indicators = ", ".join(ai_reason.get("reasoning_steps", []))
    
    # Malware Detection (Google Safe Browsing & VirusTotal)
    gsb_module = next((m for m in modules if m.get("module") == "Google Safe Browsing"), {})
    malware_detection = f"Google Safe Browsing: {gsb_module.get('evidence', 'N/A')}. VirusTotal: {virustotal_result}"
    
    # Redirect Chain
    redirect_chain = " -> ".join(report.get("redirect_history", []))
    
    # Suspicious Scripts
    html_metadata = report.get("html_metadata", {})
    suspicious_scripts = f"HTML Meta tags: {html_metadata}"
    
    # Reasons
    reasons = ai_reason.get("summary", "N/A")
    
    # Recommendations
    recommendations = report.get("recommendation", ai_reason.get("recommended_action", "N/A"))
    
    context = f"""Website URL: {url}
Risk Score: {risk_score}%
Threat Level: {threat_level}
Domain Age: {domain_age}
WHOIS Info: {whois_info}
SSL Status: {ssl_status}
DNS Information: {dns_info}
VirusTotal Result: {virustotal_result}
Brand Impersonation Result: {brand_impersonation_result}
Phishing Indicators: {phishing_indicators}
Malware Detection: {malware_detection}
Redirect Chain: {redirect_chain}
Suspicious Scripts: {suspicious_scripts}
Reasons: {reasons}
Recommendations: {recommendations}"""
    return context


def get_assistant_stream(messages: List[Dict[str, str]]):
    # Groq API configuration
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    
    if not GROQ_API_KEY:
        yield "Error: GROQ_API_KEY environment variable is not configured."
        return
        
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    
    body = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "temperature": 0.2,
        "stream": True,
        "max_tokens": 1000,
    }
    
    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=body, stream=True, timeout=10)
        response.raise_for_status()
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]
                    if data_str.strip() == '[DONE]':
                        break
                    try:
                        data = json.loads(data_str)
                        content = data['choices'][0]['delta'].get('content', '')
                        if content:
                            yield content
                    except Exception:
                        pass
    except Exception as e:
        logger.error(f"Error in Groq assistant chat stream: {e}")
        yield f"Error communicating with AI service: {str(e)}"


@router.post(
    "/api/websites/chat",
    summary="Streams answers about the currently analyzed website based on the investigation report.",
    tags=["Chat API"]
)
async def api_website_chat(payload: WebsiteChatRequest):
    # 1. Compile the investigation context
    report_context = compile_assistant_context(payload.report)
    
    # 2. Formulate the system instructions
    system_prompt = f"""You are the 🤖 ScamON AI Assistant, an expert cyber threat analysis bot.
Your ONLY role is to answer questions about the website currently under investigation.
You must use the Website Investigation Report below as your sole source of truth.

Website Investigation Report:
{report_context}

CRITICAL INSTRUCTIONS:
1. ONLY answer questions related to the currently analyzed website.
2. If the user asks anything unrelated to this website analysis (such as general knowledge, other websites, programming, hobbies, general conversation like 'how is the weather' or 'what is the capital of Spain'), you MUST refuse to answer and reply EXACTLY with:
"I can only answer questions related to the website currently being analyzed."
3. You must use simple, beginner-friendly language and explain any technical details clearly without jargon unless requested.
4. You MUST structure EVERY response using the following format:
### Summary
[Write a brief summary of safety or issue]

### Reason
[Explain the main reason(s) why this status exists]

### Evidence
- [Bullet point detailing specific evidence]
- [Another bullet point]

### Recommendation
[Cybersecurity advice for the user]

### Confidence Score
[Confidence percentage based on data, e.g. 95%]

5. If the website is unsafe, prefix your response with "⚠ Unsafe Website" or similar. If it is safe, prefix with "✅ Safe Website"."""

    # 3. Build messages list including system prompt and conversational memory
    messages = [{"role": "system", "content": system_prompt}]
    
    # Append conversation history
    for msg in payload.history:
        messages.append({"role": msg.role, "content": msg.content})
        
    # Append the current message
    messages.append({"role": "user", "content": payload.message})
    
    return StreamingResponse(get_assistant_stream(messages), media_type="text/plain")


class ComplaintGenerateRequest(BaseModel):
    report: Optional[Dict[str, Any]] = None
    case_id: Optional[str] = None


class ComplaintSendRequest(BaseModel):
    to: str
    cc: Optional[str] = ""
    subject: str
    body: str
    attachments: List[str]


@router.post("/api/complaints/generate", tags=["Complaints"])
async def api_generate_complaint(payload: ComplaintGenerateRequest):
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../static"))
    try:
        report_data = payload.report
        
        # If case_id is passed, retrieve Case Folder from Evidence Vault
        if payload.case_id:
            db = get_db()
            if db is not None:
                case_doc = db["cases"].find_one({"case_id": payload.case_id})
                if case_doc:
                    evidence = case_doc.get("evidence", {})
                    report_data = {}
                    if "website" in evidence:
                        report_data.update(evidence["website"].get("data", {}))
                    if "email" in evidence:
                        report_data.update(evidence["email"].get("data", {}))
                    if "call" in evidence:
                        report_data.update(evidence["call"].get("data", {}))
                    if "sms" in evidence:
                        sms_data = evidence["sms"].get("data", {})
                        report_data["sms_sender"] = sms_data.get("sms", {}).get("sender") or sms_data.get("sender")
                        report_data["sms_message"] = sms_data.get("sms", {}).get("message") or sms_data.get("message")
                        report_data["sms_risk_score"] = sms_data.get("analysis", {}).get("risk_score") or sms_data.get("risk_score") or 0
                        report_data["sms_recommendation"] = sms_data.get("analysis", {}).get("recommended_action") or sms_data.get("recommendation")
                    if "visual_scam" in evidence:
                        report_data["visual_scam"] = evidence["visual_scam"].get("data", {})
                    
                    report_data["case_id"] = payload.case_id
                    
        if not report_data:
            raise HTTPException(status_code=400, detail="No report data or Case Folder found.")
            
        from .complaint_builder import generate_complaint_package
        result = generate_complaint_package(report_data, static_dir)
        
        # Update case status in vault
        if payload.case_id:
            db = get_db()
            if db is not None:
                db["cases"].update_one(
                    {"case_id": payload.case_id},
                    {"$set": {
                        "status": "Complaint Generated",
                        "reports.complaint": result,
                        "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
                    }}
                )
        return result
    except Exception as err:
        logger.error(f"Failed to generate complaint: {err}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate complaint documentation: {str(err)}"
        )


@router.post("/api/complaints/send", tags=["Complaints"])
async def api_send_complaint(payload: ComplaintSendRequest):
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../static"))
    try:
        from .complaint_builder import send_complaint_email
        result = send_complaint_email(
            to_email=payload.to,
            cc_email=payload.cc,
            subject=payload.subject,
            body=payload.body,
            attachment_paths=payload.attachments,
            static_dir=static_dir
        )
        return result
    except Exception as err:
        logger.error(f"Failed to send complaint: {err}")
        raise HTTPException(
            status_code=400,
            detail=str(err)
        )


@router.get("/api/history/complaints", tags=["Complaints"])
async def get_complaints_history():
    db = get_db()
    if db is None:
        return []
    try:
        complaints = list(db["email_scans"].find({}).sort("created_at", -1).limit(10))
        for c in complaints:
            c["_id"] = str(c["_id"])
        return complaints
    except Exception as err:
        logger.error(f"Failed to fetch complaints history: {err}")
        return []


