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
    domain_lower = domain.strip().lower()

    # Subdomain resolution to parent domain
    parent_domain = domain_lower
    if domain_lower:
        parts = domain_lower.split(".")
        if len(parts) >= 2:
            double_tlds = {"co.uk", "org.uk", "co.jp", "com.cn", "co.in", "org.in", "gov.in", "ac.in", "net.in", "gov.uk"}
            last_two = ".".join(parts[-2:])
            last_three = ".".join(parts[-3:])
            if last_two in double_tlds and len(parts) >= 3:
                parent_domain = last_three
            else:
                if len(parts) >= 3 and parts[-2] in ("co", "com", "org", "net", "gov", "ac"):
                    parent_domain = last_three
                else:
                    parent_domain = last_two

    # Trusted parent domains check
    TRUSTED_ORGANIZATIONS = [
        "google.com", "google.co.in", "youtube.com", "gmail.com", "android.com", "gstatic.com", "googleapis.com",
        "microsoft.com", "office.com", "live.com", "outlook.com", "skype.com",
        "amazon.com", "amazon.in", "aws.amazon.com", "media-amazon.com",
        "apple.com", "icloud.com",
        "github.com", "githubusercontent.com",
        "cloudflare.com",
    ]
    is_trusted_parent = any(
        parent_domain == td or parent_domain.endswith("." + td) or domain_lower == td or domain_lower.endswith("." + td)
        for td in TRUSTED_ORGANIZATIONS
    )

    risk_score = 0
    detected_words = []

    # Extract domain name tokens
    parts = domain_lower.split(".")
    tokens = []
    for p in parts:
        # Split by non-alphanumeric characters
        sub_parts = re.split(r"[^a-zA-Z0-9]", p)
        for sp in sub_parts:
            if sp:
                tokens.append(sp)

    # 1. Known PhishTank Database Match (+40)
    if known_phishing:
        risk_score += 40
        logger.debug("Risk Weight: Known PhishTank Match (+40)")

    # 2. Brand Name Impersonation / Typosquatting (+35)
    if typosquat_res.get("detected", False):
        risk_score += 35
        logger.debug("Risk Weight: Brand Impersonation Present (+35)")

    # 3. Phishing Keyword Detections
    has_login_kw = False
    has_verify_kw = False
    has_offer_kw = False

    # Check for keywords inside extracted tokens
    for token in tokens:
        for kw in PHISHING_KEYWORDS:
            if kw in token:
                if kw not in detected_words:
                    detected_words.append(kw)
                if kw in ("login", "signin"):
                    has_login_kw = True
                elif kw in (
                    "verify",
                    "secure",
                    "update",
                    "account",
                    "bank",
                    "payment",
                    "wallet",
                    "claim",
                    "support",
                    "otp",
                    "kyc",
                    "refund",
                ):
                    has_verify_kw = True
                elif kw in ("reward", "gift", "bonus", "offers"):
                    has_offer_kw = True

    if has_login_kw:
        risk_score += 20
        logger.debug("Risk Weight: Login Keyword (+20)")
    if has_verify_kw:
        risk_score += 20
        logger.debug("Risk Weight: Verify Keyword (+20)")
    if has_offer_kw:
        risk_score += 10
        logger.debug("Risk Weight: Offer Keyword (+10)")

    # 4. Suspicious TLD Check (+15)
    tld = domain_lower.split(".")[-1]
    if tld in SUSPICIOUS_TLDS:
        risk_score += 15
        logger.debug("Risk Weight: Suspicious TLD (+15)")

    # 5. SSL Check (+15 / -5)
    ssl_valid = ssl_res.get("valid", False)
    is_local = domain_lower in ("localhost", "127.0.0.1")
    if not ssl_valid and not is_local:
        risk_score += 15
        logger.debug("Risk Weight: SSL Missing/Expired (+15)")
    elif ssl_valid:
        # Decrease risk slightly if SSL is valid
        risk_score -= 5
        logger.debug("Risk Weight: SSL Valid (-5)")

    # 6. WHOIS Verification Failure (+10)
    age_days = whois_res.get("age_days", -1)
    registrar = whois_res.get("registrar", "Unknown")

    whois_failed = (
        (age_days == -1) or (registrar == "Unknown") or (not registrar.strip())
    )
    if whois_failed:
        is_unavailable = whois_res.get("error") == "WHOIS service unavailable" or whois_res.get("error") == "WHOIS server unavailable"
        if not is_unavailable:
            risk_score += 10
            logger.debug("Risk Weight: WHOIS Query Failure (+10)")

    # 7. Recently Registered Domain (+20)
    # Check registration age (younger than 30 days, excluding failures)
    if 0 <= age_days < 30:
        risk_score += 20
        logger.debug("Risk Weight: Recently Registered (<30 days) (+20)")

    # 8. URL Shortener Match (+15)
    is_shortener = False
    for short in URL_SHORTENERS:
        if domain_lower == short or domain_lower.endswith("." + short):
            is_shortener = True
            break
    if is_shortener:
        risk_score += 15
        logger.debug("Risk Weight: URL Shortener (+15)")

    # 9. IP Address Host Check (+20)
    parsed_url = urlparse(url)
    host = parsed_url.netloc.split(":")[0]
    has_ip = re.search(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", host)
    if has_ip:
        risk_score += 20
        logger.debug("Risk Weight: IP Address Host (+20)")

    # Clamp final risk score range to strictly [0, 100]
    risk_score = min(max(int(risk_score), 0), 100)

    # Overrule checks for trusted domains
    if is_trusted_parent:
        malicious_signals = 1 if known_phishing else 0
        if malicious_signals < 2:
            risk_score = 0

    # Determine Threat Type Category
    if risk_score >= 70:
        if typosquat_res.get("detected", False):
            threat_type = "Brand Impersonation"
        else:
            threat_type = "Possible Phishing Website"
    elif risk_score >= 30:
        threat_type = "Suspicious Website"
    else:
        threat_type = "Legitimate Website"

    # Determine Actionable Recommendation String
    if risk_score > 90:
        recommendation = "BLOCK IMMEDIATELY"
    elif risk_score >= 70:
        recommendation = "BLOCK THIS WEBSITE"
    elif risk_score >= 30:
        recommendation = "SUSPICIOUS"
    else:
        recommendation = "SAFE"

    # Derive overall analysis confidence rating
    if known_phishing:
        confidence = 98
    elif typosquat_res.get("detected", False):
        confidence = 95
    else:
        confidence = 85

    logger.info(
        f"Weighted risk evaluation finished. Score: {risk_score}, "
        f"Recommendation: {recommendation}, Brand: {typosquat_res.get('original_brand', 'None')}"
    )

    return {
        "risk_score": risk_score,
        "confidence": confidence,
        "threat_type": threat_type,
        "recommendation": recommendation,
        "detected_brand": typosquat_res.get("original_brand", "None"),
        "detected_keywords": detected_words,
    }
