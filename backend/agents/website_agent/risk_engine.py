import logging
import re
from typing import Any, Dict
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Core phishing keywords grouped by threat context
PHISHING_KEYWORDS = [
    "login",
    "verify",
    "secure",
    "update",
    "reward",
    "gift",
    "bonus",
    "account",
    "bank",
    "payment",
    "wallet",
    "offers",
    "claim",
    "support",
    "signin",
    "otp",
    "kyc",
    "refund",
]

# Suspicious top-level domains associated with threat vectors
SUSPICIOUS_TLDS = {
    "click",
    "xyz",
    "top",
    "site",
    "live",
    "loan",
    "gq",
    "ml",
    "cf",
    "tk",
    "work",
    "win",
    "bid",
    "monster",
    "support",
}

# Recognized URL shorteners commonly used to mask threat links
URL_SHORTENERS = {
    "bit.ly",
    "tinyurl.com",
    "tinyurl",
    "goo.gl",
    "t.co",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "adf.ly",
}


def calculate_risk_score(
    url: str,
    domain: str,
    whois_res: Dict[str, Any],
    ssl_res: Dict[str, Any],
    typosquat_res: Dict[str, Any],
    known_phishing: bool,
) -> Dict[str, Any]:
    """Calculates the weighted threat score, confidence level, threat type,
    and recommendations based on multi-stage security signal checks.
    """
    # Construct a mock modules_results structure to feed into evaluate_security_risk
    # WHOIS Lookup module
    whois_success = whois_res and whois_res.get("age_days", -1) != -1
    whois_mod = {
        "module": "WHOIS Lookup",
        "status": "success" if whois_success else "failed",
        "evidence": whois_res or {}
    }

    # SSL Certificate Validation module
    ssl_mod = {
        "module": "SSL Certificate Validation",
        "status": "success",
        "evidence": ssl_res or {"valid": False}
    }

    # Typosquatting Detection module
    typosquat_mod = {
        "module": "Typosquatting Detection",
        "status": "success",
        "evidence": typosquat_res or {"detected": False, "original_brand": "None", "similarity": 0}
    }

    # PhishTank module
    pt_mod = {
        "module": "PhishTank",
        "status": "success",
        "evidence": {"is_phishing": known_phishing}
    }

    # Phishing Keyword Detection module
    detected_keywords = []
    domain_parts = domain.lower().split(".")
    for part in domain_parts:
        for kw in PHISHING_KEYWORDS:
            if kw in part and kw not in detected_keywords:
                detected_keywords.append(kw)
    kw_mod = {
        "module": "Phishing Keyword Detection",
        "status": "success",
        "evidence": {"keywords": detected_keywords}
    }

    # Domain Reputation module
    tld = domain.lower().split(".")[-1] if domain else ""
    suspicious_tld = tld in SUSPICIOUS_TLDS
    rep_mod = {
        "module": "Domain Reputation",
        "status": "success",
        "evidence": {"tld": tld, "suspicious_tld": suspicious_tld}
    }

    # DNS Resolution module
    dns_mod = {
        "module": "DNS Resolution",
        "status": "success"
    }

    # Screenshot and HTTP status modules (since this is offline, success = true, page_title = None)
    screenshot_mod = {
        "module": "Screenshot Capture",
        "status": "success",
        "evidence": {"page_title": ""}
    }

    http_mod = {
        "module": "HTTP Status Check",
        "status": "success"
    }

    mock_modules = [whois_mod, ssl_mod, typosquat_mod, pt_mod, kw_mod, rep_mod, dns_mod, screenshot_mod, http_mod]

    # Run the core evaluation logic
    from .investigation_coordinator import evaluate_security_risk
    verdict = evaluate_security_risk(mock_modules, url)

    # Add legacy compatibility fields
    verdict["threat_type"] = verdict["decision"] if verdict["decision"] != "SAFE" else "Legitimate Website"
    
    # Actionable Recommendation String
    if verdict["decision"] == "HIGH RISK":
        verdict["recommendation"] = "BLOCK IMMEDIATELY"
    elif verdict["decision"] == "SUSPICIOUS":
        verdict["recommendation"] = "SUSPICIOUS"
    else:
        verdict["recommendation"] = "SAFE"

    return verdict
