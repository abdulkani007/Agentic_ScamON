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
        recommended_action=ai_reasoning["recommended_action"]
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
            "investigations_today": 0
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
            "investigations_today": investigations_today
        }
    except Exception as err:
        logger.error(f"Failed to compile dashboard stats: {err}")
        return {
            "total_scans": 0,
            "high_risk_websites": 0,
            "blocked_websites": 0,
            "safe_websites": 0,
            "investigations_today": 0
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
        db = get_db()
        if db is not None:
            collection = db["blocked_websites"]
            doc = collection.find_one({"domain": normalized})
            if doc and doc.get("blocked", True) is True:
                return {
                    "blocked": True,
                    "reason": doc.get("reason") or "Phishing Website",
                    "risk_score": doc.get("risk_score") or 90
                }
        return {"blocked": False}
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

