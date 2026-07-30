from __future__ import annotations

import json
from pathlib import Path

from ..schemas import AgentState

RISK_CONFIG_PATH = Path(__file__).resolve().parents[1] / "prompts" / "risk_config.json"
SCAM_LIKE_CLASSIFICATIONS = {
    "bank phishing",
    "kyc scam",
    "upi scam",
    "lottery scam",
    "delivery scam",
    "investment scam",
    "suspicious",
}

RULE_INDICATOR_LABELS = {
    "otp": "OTP Request",
    "payment": "Payment Request",
    "urgency": "Urgent Language",
    "threat": "Threat Language",
    "reward": "Reward Language",
}


def load_risk_config() -> dict:
    return json.loads(RISK_CONFIG_PATH.read_text(encoding="utf-8"))


def build_risk_assessment(state: AgentState) -> AgentState:
    config = load_risk_config()
    contributors: list[dict[str, object]] = []
    indicators: list[str] = []

    rule_score = calculate_rule_score(state, config["rules"], contributors, indicators)
    tool_score = calculate_tool_score(state, config["tools"], contributors, indicators)
    llm_score = calculate_llm_score(state, config["llm"]["max_weight"], contributors, indicators)

    final_score = min(100, rule_score + tool_score + llm_score)
    severity = map_severity(final_score)

    merged_indicators = list(dict.fromkeys(indicators + state.investigation_result.indicators))
    entities = {
        "sender": state.extracted_features.sender_id,
        "phone_number": state.extracted_features.phone_number,
        "organization": state.extracted_features.organization,
        "urls": [url.url for url in state.extracted_features.urls],
    }

    state.final_report.classification = state.investigation_result.classification
    state.final_report.confidence = state.investigation_result.confidence
    state.final_report.risk_score = final_score
    state.final_report.severity = severity
    state.final_report.indicators = merged_indicators
    state.final_report.contributors = contributors
    state.final_report.entities = entities
    state.final_report.summary = state.investigation_result.summary

    return state


def calculate_rule_score(
    state: AgentState,
    weights: dict[str, int],
    contributors: list[dict[str, object]],
    indicators: list[str],
) -> int:
    score = 0
    keyword_set = set(state.extracted_features.keywords)

    for keyword, label in RULE_INDICATOR_LABELS.items():
        if keyword in keyword_set:
            weight = weights.get(keyword, 0)
            score += weight
            indicators.append(label)
            contributors.append(
                {
                    "source": "Rule Engine",
                    "indicator": label,
                    "weight": weight,
                }
            )

    if state.extracted_features.urls:
        weight = weights.get("url_present", 0)
        score += weight
        indicators.append("URL Present")
        contributors.append(
            {
                "source": "Rule Engine",
                "indicator": "URL Present",
                "weight": weight,
            }
        )

        if len(state.extracted_features.urls) > 1:
            weight = weights.get("multiple_urls", 0)
            score += weight
            indicators.append("Multiple URLs")
            contributors.append(
                {
                    "source": "Rule Engine",
                    "indicator": "Multiple URLs",
                    "weight": weight,
                }
            )

    if state.extracted_features.organization:
        weight = weights.get("organization_mentioned", 0)
        score += weight
        indicators.append("Organization Mentioned")
        contributors.append(
            {
                "source": "Rule Engine",
                "indicator": "Organization Mentioned",
                "weight": weight,
            }
        )

    return score


def calculate_tool_score(
    state: AgentState,
    weights: dict[str, int],
    contributors: list[dict[str, object]],
    indicators: list[str],
) -> int:
    score = 0

    sender_result = state.tool_results.get("sender_reputation")
    if sender_result:
        if sender_result.status == "unavailable":
            weight = weights.get("unknown_sender", 0)
            score += weight
            indicators.append("Unknown Sender")
            contributors.append(
                {
                    "source": "Sender Reputation",
                    "indicator": "Unknown Sender",
                    "weight": weight,
                }
            )
        elif sender_result.status == "success":
            reported_scams = int(sender_result.data.get("reported_scams", 0))
            trusted = bool(sender_result.data.get("trusted", False))
            if reported_scams > 0 and not trusted:
                weight = weights.get("reported_sender", 0)
                score += weight
                indicators.append("Reported Sender")
                contributors.append(
                    {
                        "source": "Sender Reputation",
                        "indicator": "Reported Sender",
                        "weight": weight,
                    }
                )

    organization_result = state.tool_results.get("organization_verification")
    if organization_result:
        if organization_result.status == "unavailable":
            weight = weights.get("unknown_organization", 0)
            score += weight
            indicators.append("Unknown Organization")
            contributors.append(
                {
                    "source": "Organization Verification",
                    "indicator": "Unknown Organization",
                    "weight": weight,
                }
            )
        elif organization_result.status == "success":
            domain_matches = bool(organization_result.data.get("domain_matches", False))
            if not domain_matches and state.extracted_features.urls:
                weight = weights.get("organization_mismatch", 0)
                score += weight
                indicators.append("Official Domain Mismatch")
                contributors.append(
                    {
                        "source": "Organization Verification",
                        "indicator": "Official Domain Mismatch",
                        "weight": weight,
                    }
                )

    return score


def calculate_llm_score(
    state: AgentState,
    max_weight: int,
    contributors: list[dict[str, object]],
    indicators: list[str],
) -> int:
    classification = (state.investigation_result.classification or "").strip().lower()
    confidence = state.investigation_result.confidence or 0.0

    if classification not in SCAM_LIKE_CLASSIFICATIONS:
        return 0

    llm_score = round(max(0.0, min(1.0, confidence)) * max_weight)
    if llm_score > 0:
        indicators.append("High Confidence Investigation")
        contributors.append(
            {
                "source": "LLM",
                "indicator": "High Confidence Investigation",
                "weight": llm_score,
            }
        )

    return llm_score


def map_severity(score: int) -> str:
    if score <= 24:
        return "Low"
    if score <= 49:
        return "Medium"
    if score <= 74:
        return "High"
    return "Critical"
