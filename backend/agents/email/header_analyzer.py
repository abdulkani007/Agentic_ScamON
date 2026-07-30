import re
import logging
from typing import Dict, Any, List
from .schemas import HeaderAnalysisInfo

logger = logging.getLogger(__name__)

def extract_email_address(val: str) -> str:
    """Extracts raw email address from a header value (e.g., 'Name <addr@domain.com>')."""
    if not val:
        return ""
    match = re.search(r'[\w\.\-]+@[\w\.\-]+\.\w+', val)
    if match:
        return match.group(0).lower()
    return val.strip().lower()

def extract_domain_from_email(val: str) -> str:
    """Extracts domain name from an email header value."""
    addr = extract_email_address(val)
    if "@" in addr:
        return addr.split("@")[-1]
    return addr

def parse_auth_results(headers: Dict[str, str]) -> tuple[str, str, str, str, str, str]:
    """Parses Authentication-Results and Received-SPF headers to extract SPF, DKIM, and DMARC status."""
    spf_status = "none"
    dkim_status = "none"
    dmarc_status = "none"
    spf_reason = ""
    dkim_reason = ""
    dmarc_reason = ""

    # Check Authentication-Results (often X-Authentication-Results)
    auth_header = ""
    for k, v in headers.items():
        if k.lower() in ("authentication-results", "x-authentication-results"):
            auth_header = v
            break

    if auth_header:
        # Regex searches for spf=..., dkim=..., dmarc=...
        spf_match = re.search(r'\bspf=(\w+)', auth_header, re.IGNORECASE)
        dkim_match = re.search(r'\bdkim=(\w+)', auth_header, re.IGNORECASE)
        dmarc_match = re.search(r'\bdmarc=(\w+)', auth_header, re.IGNORECASE)

        if spf_match:
            spf_status = spf_match.group(1).lower()
            spf_reason = "Extracted from Authentication-Results header."
        if dkim_match:
            dkim_status = dkim_match.group(1).lower()
            dkim_reason = "Extracted from Authentication-Results header."
        if dmarc_match:
            dmarc_status = dmarc_match.group(1).lower()
            dmarc_reason = "Extracted from Authentication-Results header."

    # Fallback for SPF (Received-SPF)
    if spf_status == "none":
        rec_spf = ""
        for k, v in headers.items():
            if k.lower() == "received-spf":
                rec_spf = v
                break
        if rec_spf:
            parts = rec_spf.split()
            if parts:
                spf_status = parts[0].lower()
                spf_reason = f"Extracted from Received-SPF: {rec_spf[:60]}"

    # Fallback for DKIM: If DKIM-Signature header exists but auth result is missing, mark as neutral/verified
    if dkim_status == "none":
        has_dkim_sig = any(k.lower() == "dkim-signature" for k in headers.keys())
        if has_dkim_sig:
            dkim_status = "neutral"
            dkim_reason = "DKIM-Signature header exists but Authentication-Results are missing."

    return spf_status, dkim_status, dmarc_status, spf_reason, dkim_reason, dmarc_reason

def analyze_headers(headers: Dict[str, str]) -> HeaderAnalysisInfo:
    """Performs static analysis of headers to compile HeaderAnalysisInfo and calculates risk score."""
    # Parse Auth Results
    spf, dkim, dmarc, spf_reason, dkim_reason, dmarc_reason = parse_auth_results(headers)

    # Basic headers
    from_val = headers.get("From", "")
    return_path = headers.get("Return-Path", "")
    reply_to = headers.get("Reply-To", "")
    msg_id = headers.get("Message-ID", "")

    from_domain = extract_domain_from_email(from_val)
    return_path_domain = extract_domain_from_email(return_path) if return_path else ""
    reply_to_domain = extract_domain_from_email(reply_to) if reply_to else ""

    # Alignment check
    mismatch_return_path = False
    if return_path_domain and from_domain:
        # Check domain alignment (e.g. sender amazon.in vs return-path amazonsupport.in)
        mismatch_return_path = (from_domain != return_path_domain)

    mismatch_reply_to = False
    if reply_to_domain and from_domain:
        mismatch_reply_to = (from_domain != reply_to_domain)

    # Count hops
    received_hops = sum(1 for k in headers.keys() if k.lower() == "received")

    # Inspect suspicious headers
    suspicious_headers = []
    
    # Check X-Spam-Status / X-Spam-Flag
    for k, v in headers.items():
        k_lower = k.lower()
        if "spam" in k_lower and ("yes" in v.lower() or "true" in v.lower()):
            suspicious_headers.append(f"{k}: {v}")
        elif "phish" in k_lower or "scam" in k_lower:
            suspicious_headers.append(f"{k}: {v}")
        elif k_lower == "x-mailer" and any(bad in v.lower() for bad in ("php", "bulk", "mass", "sender", "script")):
            suspicious_headers.append(f"Suspicious Mailer: {v}")

    # Calculate Header Risk Score (0-100)
    score = 0
    
    # 1. SPF/DKIM/DMARC failures
    if spf == "fail":
        score += 30
    elif spf in ("none", "neutral"):
        score += 5

    if dkim == "fail":
        score += 30
    elif dkim in ("none", "neutral"):
        score += 5

    if dmarc == "fail":
        score += 35
    elif dmarc == "none":
        score += 10

    # 2. Domain Alignment mismatch
    if mismatch_return_path:
        score += 25
    if mismatch_reply_to:
        score += 20

    # 3. Custom suspicious headers
    score += len(suspicious_headers) * 15

    # 4. Long hop chain (potential routing hiding)
    if received_hops > 8:
        score += 15
    elif received_hops > 5:
        score += 5

    # Clamp score
    risk_score = min(max(score, 0), 100)

    return HeaderAnalysisInfo(
        spf=spf,
        dkim=dkim,
        dmarc=dmarc,
        return_path=return_path,
        reply_to=reply_to,
        message_id=msg_id,
        received_hops=received_hops,
        spf_reason=spf_reason,
        dkim_reason=dkim_reason,
        dmarc_reason=dmarc_reason,
        mismatch_from_return_path=mismatch_return_path,
        mismatch_from_reply_to=mismatch_reply_to,
        suspicious_headers=suspicious_headers,
        risk_score=risk_score
    )
