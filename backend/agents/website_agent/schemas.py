from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DomainDetails(BaseModel):
    name: str = Field(..., description="The queried domain name.")
    age_days: int = Field(..., description="Domain age in days.")
    registrar: str = Field(..., description="The registrar of the domain.")


class SSLDetails(BaseModel):
    valid: bool = Field(..., description="Whether the certificate is valid.")
    issuer: str = Field(..., description="The organization that issued the cert.")
    expiry: Optional[str] = Field(
        None, description="Expiration ISO date of the SSL certificate."
    )


class TyposquatDetails(BaseModel):
    detected: bool = Field(
        ..., description="Whether brand typosquatting was identified."
    )
    original_brand: str = Field(
        ..., description="The matched brand targeted by impersonation."
    )
    similarity: int = Field(
        ..., description="The similarity ratio percentage (0 to 100)."
    )


class PhishTankDetails(BaseModel):
    known_phishing: bool = Field(
        ..., description="Whether the URL is a known phishing threat."
    )


class EntityDetails(BaseModel):
    organization: str = Field(
        ..., description="The organization registering the domain."
    )
    domain: str = Field(..., description="Parsed domain name.")
    timestamp: str = Field(..., description="Execution verification timestamp.")


class AIReasoningDetails(BaseModel):
    summary: str = Field(..., description="Summary paragraph of AI SOC analyst findings.")
    threat_category: str = Field(..., description="The classified threat category.")
    confidence_rating: int = Field(..., description="AI confidence score (0 to 100).")
    final_decision: str = Field(..., description="The final risk rating verdict.")
    reasoning_steps: List[str] = Field(..., description="Explainable threat indicators.")
    recommended_action: str = Field(..., description="The recommended action strategy.")
    trust_indicators: List[str] = Field(default_factory=list, description="Verified trust signals.")
    risk_indicators: List[str] = Field(default_factory=list, description="Verified threat signals.")


class MemoryHistoryDetails(BaseModel):
    has_history: bool = Field(..., description="Whether a previous scan is present.")
    last_timestamp: Optional[str] = Field(None, description="Timestamp of the previous scan.")
    last_risk_score: Optional[int] = Field(None, description="Risk score of the previous scan.")
    last_verdict: Optional[str] = Field(None, description="Verdict of the previous scan.")
    score_diff: Optional[int] = Field(None, description="Score difference from previous scan.")


class TimelineItem(BaseModel):
    step: str = Field(..., description="Description of the workflow step.")
    status: str = Field(..., description="The execution status of the step.")
    timestamp: str = Field(..., description="The completion timestamp.")


class InvestigationModuleResult(BaseModel):
    module: str
    status: str
    evidence: Dict[str, Any] = Field(default_factory=dict)
    error: str = ""


class WebsiteAnalysisResponse(BaseModel):
    agent_name: str = Field(default="Website & QR Verification Agent")
    status: str = Field(default="success")
    source: str = Field(
        ..., description="The check entrypoint mode ('URL' or 'QR')."
    )
    url: str = Field(..., description="The evaluated URL.")
    trust_score: int = Field(default=0, description="Overall trust rating score.")
    risk_score: int = Field(..., description="Scam probability score from 0 to 100.")
    confidence: int = Field(..., description="Analysis confidence rating (0 to 100).")
    threat_type: str = Field(..., description="The classified threat category of the domain.")
    detected_brand: str = Field(..., description="The identified brand targeted by impersonation.")
    detected_keywords: List[str] = Field(..., description="The list of flagged phishing words in the URL.")
    screenshot_url: Optional[str] = Field(None, description="The URL to the captured page screenshot.")
    qr_url: Optional[str] = Field(None, description="The URL to the uploaded QR code image (if source is QR).")
    page_title: Optional[str] = Field(None, description="The title of the loaded page.")
    favicon_url: Optional[str] = Field(None, description="The favicon URL of the target domain.")
    http_status: Optional[int] = Field(None, description="The HTTP response status code of the page load.")
    screenshot_time: Optional[str] = Field(None, description="The timestamp of the screenshot capture.")
    screenshot_resolution: Optional[str] = Field(None, description="The resolution of the captured image.")
    screenshot_success: bool = Field(default=False, description="Whether the screenshot was successfully captured.")
    screenshot_error_reason: Optional[str] = Field(None, description="The reason if screenshot capture failed.")
    domain: DomainDetails
    ssl: SSLDetails
    typosquat: TyposquatDetails
    phishtank: PhishTankDetails
    entities: EntityDetails
    recommendation: str = Field(
        ..., description="The actionable threat rating advice."
    )
    investigation_id: str = Field(..., description="Unique SOC UUID.")
    timestamp: str = Field(..., description="Investigation execution timestamp.")
    redirect_history: List[str] = Field(..., description="Redirect chain history.")
    security_headers: Dict[str, str] = Field(..., description="Audited response headers.")
    html_metadata: Dict[str, str] = Field(..., description="HTML head elements extracted.")
    ai_reasoning: AIReasoningDetails = Field(..., description="Deep LLM analyst decision results.")
    memory_history: MemoryHistoryDetails = Field(..., description="Comparison with past memory files.")
    timeline: List[TimelineItem] = Field(..., description="Workflow timeline checks status.")
    mission_status: str = Field(..., description="The overall mission status.")
    investigation_modules: List[InvestigationModuleResult] = Field(default_factory=list, description="Forensic details of the 16 independent investigation modules.")
    is_blocked: bool = Field(default=False, description="Whether the domain is currently in the blocklist.")
    blocked_time: Optional[str] = Field(None, description="Timestamp domain was blocked if applicable.")
    blocked_by: Optional[str] = Field(None, description="Agent identity that triggered block if applicable.")

    model_config = {"populate_by_name": True, "by_alias": True}


class BlockRequest(BaseModel):
    domain: str = Field(..., description="The domain target to block or unblock.")


class BlockResponse(BaseModel):
    success: bool = Field(..., description="Whether the operation succeeded.")
    message: str = Field(..., description="Success or error status summary.")
    error: Optional[str] = Field(None, description="Detailed error log if failure occurred.")
    admin_error: bool = Field(default=False, description="Whether an administrator permission error occurred.")
    blocked_time: Optional[str] = Field(None, description="Timestamp domain was blocked.")
    blocked_by: Optional[str] = Field(None, description="Agent identity that triggered block.")


class ProtectionStatusResponse(BaseModel):
    status: str = Field(..., description="Overall engine status (e.g. 'Active').")
    total_blocked: int = Field(..., description="Count of currently blocked domains.")
    blocked_domains: List[str] = Field(..., description="List of currently blocked domains.")


class BlockHistoryItem(BaseModel):
    domain: str = Field(..., description="Domain target name.")
    action: str = Field(..., description="Action taken ('block' or 'unblock').")
    timestamp: str = Field(..., description="Timestamp of action.")
    success: bool = Field(..., description="Whether the hosts file edit succeeded.")
    details: str = Field(..., description="Status info.")


class BlockHistoryResponse(BaseModel):
    history: List[BlockHistoryItem] = Field(..., description="List of protection engine history items.")


class WebsiteBlockRequest(BaseModel):
    url: str = Field(default="", description="The URL to block.")
    domain: str = Field(default="", description="The domain to block.")
    risk_score: int = Field(default=0, description="Risk score of the website.")
    threat_type: str = Field(default="", description="The classified threat category.")
    reason: str = Field(default="", description="The reason for blocking.")


class WebsiteUnblockRequest(BaseModel):
    domain: str = Field(..., description="The domain to unblock.")


class WebsiteActionResponse(BaseModel):
    success: bool = Field(..., description="Whether the block/unblock action succeeded.")
    message: str = Field(..., description="Status summary message.")


class WebsiteCheckResponse(BaseModel):
    blocked: bool = Field(..., description="Whether the website domain is blocked.")
    message: Optional[str] = Field(None, description="Blocked warning info.")


class BlockedWebsiteItem(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    domain: str = Field(..., description="The normalized domain.")
    url: str = Field(..., description="Original URL scanned.")
    risk_score: int = Field(..., description="Risk score.")
    threat_type: str = Field(..., description="Threat category.")
    reason: str = Field(..., description="Block reason.")
    blocked: bool = Field(..., description="Current block status.")
    blocked_at: str = Field(..., description="Timestamp domain was blocked.")
    unblocked: bool = Field(..., description="Whether it has been unblocked.")
    unblocked_at: Optional[str] = Field(None, description="Timestamp domain was unblocked.")
    blocked_by: str = Field(default="Website Investigation Agent", description="Entity initiating block.")
    created_at: str = Field(..., description="Creation timestamp.")
    updated_at: str = Field(..., description="Last update timestamp.")

    model_config = {"populate_by_name": True, "protected_namespaces": ()}


