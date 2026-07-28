import difflib
import logging
import re
from typing import Any, Dict

logger = logging.getLogger(__name__)

# List of known target brand tokens
KNOWN_BRANDS = [
    "amazon",
    "google",
    "microsoft",
    "apple",
    "netflix",
    "sbi",
    "icici",
    "hdfc",
    "axis",
    "paytm",
    "phonepe",
    "flipkart",
    "upi",
    "whatsapp",
    "instagram",
    "facebook",
    "linkedin",
    "github",
    "openai",
]

# Proper display formatting for recognized brand names
BRAND_DISPLAY = {
    "amazon": "Amazon",
    "google": "Google",
    "microsoft": "Microsoft",
    "apple": "Apple",
    "netflix": "Netflix",
    "sbi": "SBI",
    "icici": "ICICI",
    "hdfc": "HDFC",
    "axis": "Axis Bank",
    "paytm": "Paytm",
    "phonepe": "PhonePe",
    "flipkart": "Flipkart",
    "upi": "UPI",
    "whatsapp": "WhatsApp",
    "instagram": "Instagram",
    "facebook": "Facebook",
    "linkedin": "LinkedIn",
    "github": "GitHub",
    "openai": "OpenAI",
}

# Verified legitimate brand domains to prevent false positives on official URLs
LEGITIMATE_DOMAINS = {
    "google.com",
    "google.co.in",
    "gmail.com",
    "amazon.com",
    "amazon.in",
    "microsoft.com",
    "office.com",
    "apple.com",
    "icloud.com",
    "netflix.com",
    "sbi.co.in",
    "statebankofindia.com",
    "onlinesbi.sbi",
    "onlinesbi.com",
    "hdfcbank.com",
    "hdfc.com",
    "icicibank.com",
    "paytm.com",
    "phonepe.com",
    "flipkart.com",
    "whatsapp.com",
    "instagram.com",
    "facebook.com",
    "linkedin.com",
    "github.com",
    "openai.com",
    "axisbank.com",
}


def check_typosquatting(domain: str) -> Dict[str, Any]:
    """Analyzes a domain for brand impersonation threats.

    Extracts domain name tokens, filters common TLDs, excludes legit brand domains,
    and returns detected impersonations.
    """
    domain_lower = domain.strip().lower()

    # 1. Skip check if the domain is verified to be legitimate
    if domain_lower in LEGITIMATE_DOMAINS:
        return {
            "detected": False,
            "original_brand": "None",
            "similarity": 100,
        }

    for legit in LEGITIMATE_DOMAINS:
        if domain_lower.endswith("." + legit):
            return {
                "detected": False,
                "original_brand": "None",
                "similarity": 100,
            }

    # 2. Extract domain tokens
    parts = domain_lower.split(".")
    common_tlds = {
        "com",
        "org",
        "net",
        "edu",
        "gov",
        "co",
        "in",
        "us",
        "uk",
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
        "info",
        "biz",
        "app",
    }

    tokens = []
    for p in parts:
        if p not in common_tlds:
            # Split by hyphen or other non-alphanumeric separators
            sub_parts = re.split(r"[^a-zA-Z0-9]", p)
            for sp in sub_parts:
                if sp:
                    tokens.append(sp)

    detected_brand_key = None
    max_similarity = 0
    brand_detected = False

    # 3. Match tokens against known brands list
    for token in tokens:
        for brand in KNOWN_BRANDS:
            # Direct containment check (e.g. brand name is inside domain token)
            if brand in token:
                brand_detected = True
                detected_brand_key = brand
                max_similarity = 98
                break

            # Character similarity typosquatting check (e.g. 'goog1e' or 'amazn')
            ratio = difflib.SequenceMatcher(None, token, brand).ratio()
            if ratio >= 0.78:
                brand_detected = True
                detected_brand_key = brand
                max_similarity = int(ratio * 100)
                break
        if brand_detected:
            break

    if brand_detected and detected_brand_key:
        original_brand = BRAND_DISPLAY[detected_brand_key]
        logger.info(
            f"Brand Impersonation Detected: '{original_brand}' in domain '{domain}' "
            f"with confidence: {max_similarity}%"
        )
        return {
            "detected": True,
            "original_brand": original_brand,
            "similarity": max_similarity,
        }

    return {"detected": False, "original_brand": "None", "similarity": 0}
