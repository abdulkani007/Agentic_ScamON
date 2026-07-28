import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def calculate_risk(
    keywords: List[str],
    entities: Dict[str, List[Any]],
    llm_analysis: Dict[str, Any],
) -> Dict[str, Any]:
    """Calculates the final scam risk score, overall confidence, and

    actionable recommendation for the Call Analysis Agent.

    Args:
        keywords (List[str]): List of detected risk keywords.
        entities (Dict[str, List[Any]]): Dictionary of extracted entities.
        llm_analysis (Dict[str, Any]): Structured LLM analysis details.

    Returns:
        Dict[str, Any]: Dictionary containing keys "risk_score", "confidence",
        and "recommendation".
    """
    risk_score = 0

    # 1. OTP Request Check (+25)
    # Check if "OTP" keyword exists or if an OTP number was extracted
    has_otp_keyword = any(k.upper() == "OTP" for k in keywords)
    has_otp_entity = len(entities.get("OTP Number", [])) > 0
    if has_otp_keyword or has_otp_entity:
        risk_score += 25
        logger.debug("Risk Engine: OTP request factor triggered (+25)")

    # 2. Urgency Check (+20)
    urgency = str(llm_analysis.get("urgency", "Low")).strip().lower()
    if urgency == "high":
        risk_score += 20
        logger.debug("Risk Engine: High urgency factor triggered (+20)")
    elif urgency == "medium":
        risk_score += 10
        logger.debug("Risk Engine: Medium urgency factor triggered (+10)")

    # 3. Emotional Pressure Check (+20)
    pressure = str(llm_analysis.get("pressure", "Low")).strip().lower()
    if pressure == "high":
        risk_score += 20
        logger.debug("Risk Engine: High pressure factor triggered (+20)")
    elif pressure == "medium":
        risk_score += 10
        logger.debug("Risk Engine: Medium pressure factor triggered (+10)")

    # 4. Organization Impersonation Check (+20)
    # Check if any Organization Names were extracted
    has_org = len(entities.get("Organization Name", [])) > 0
    if has_org:
        risk_score += 20
        logger.debug("Risk Engine: Organization impersonation factor triggered (+20)")

    # 5. Malicious URL Check (+15)
    # Check if any URLs were extracted
    has_url = len(entities.get("URL", [])) > 0
    if has_url:
        risk_score += 15
        logger.debug("Risk Engine: URL factor triggered (+15)")

    # Clamp the risk score to be strictly in range [0, 100]
    risk_score = min(max(int(risk_score), 0), 100)

    # Derive overall confidence from the LLM reasoning confidence score
    raw_confidence = llm_analysis.get("confidence")
    if raw_confidence is None:
        confidence = 100 if risk_score == 0 else 85
    else:
        confidence = min(max(int(raw_confidence), 0), 100)

    # Determine recommendation based on risk level and identified scam category
    scam_type = llm_analysis.get("scam_type", "Scam")
    if risk_score >= 70:
        if scam_type.lower() in ("not a scam", "safe", "none"):
            recommendation = "Suspicious Call - Exercise Caution"
        else:
            recommendation = f"Possible {scam_type}"
    elif risk_score >= 40:
        recommendation = "Suspicious Call - Exercise Caution"
    else:
        recommendation = "Safe Call"

    logger.info(
        f"Risk Engine calculation complete. Score: {risk_score}, "
        f"Confidence: {confidence}, Recommendation: {recommendation}"
    )

    return {
        "risk_score": risk_score,
        "confidence": confidence,
        "recommendation": recommendation,
    }
