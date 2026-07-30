import logging

logger = logging.getLogger(__name__)

def map_llm_risk(classification: str, confidence: int) -> int:
    """Maps LLM classification and confidence rating to a numeric risk value (0-100)."""
    cls_lower = classification.lower()
    
    base_score = 0
    if cls_lower in ("phishing", "business email compromise", "otp scam", "bank scam"):
        base_score = 90
    elif cls_lower in ("lottery scam", "social engineering"):
        base_score = 75
    elif cls_lower == "spam":
        base_score = 40
    elif cls_lower == "safe":
        base_score = 0
    else:
        base_score = 50  # Unknown/suspicious

    # Adjust by confidence level
    conf_factor = max(min(confidence, 100), 0) / 100.0
    return int(base_score * conf_factor)

def calculate_composite_risk(
    header_score: int,
    domain_score: int,
    website_score: int,
    attachment_score: int,
    llm_score: int,
) -> int:
    """Calculates a unified cybersecurity risk score (0-100)."""
    # Weighted model components
    header_w = 0.20
    domain_w = 0.15
    website_w = 0.25
    attachment_w = 0.25
    llm_w = 0.15

    weighted = (
        (header_score * header_w) +
        (domain_score * domain_w) +
        (website_score * website_w) +
        (attachment_score * attachment_w) +
        (llm_score * llm_w)
    )

    # Elevation Rule: If any component has critical indicators, guarantee a high threat score
    max_indicator = max(header_score, website_score, attachment_score)
    if max_indicator >= 85:
        # Guarantee a minimum composite rating near the critical indicator
        composite = max(weighted, max_indicator - 5)
    else:
        composite = weighted

    return int(min(max(composite, 0), 100))

def determine_threat_level(score: int) -> str:
    """Resolves numeric risk score to a standard cybersecurity threat level label."""
    if score >= 86:
        return "Critical"
    elif score >= 61:
        return "High"
    elif score >= 36:
        return "Medium"
    elif score >= 16:
        return "Low"
    return "Safe"
