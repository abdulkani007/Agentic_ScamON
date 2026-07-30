import json
import logging
import os
import requests
from typing import Any, Dict

logger = logging.getLogger(__name__)

# Load Groq API configurations
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def run_llm_reasoning(
    transcript: str,
    speaker_count: int,
    duration: int,
    language: str,
    entities: Dict[str, Any],
    emotions: Dict[str, int],
    detected_keywords: list[str],
) -> Dict[str, Any]:
    """Sends all audio transcript telemetry and keyword entities to Groq Llama-3

    to reason on potential social engineering call scams.
    """
    evidence_payload = {
        "transcript": transcript,
        "speaker_count": speaker_count,
        "duration_seconds": duration,
        "detected_language": language,
        "extracted_entities": entities,
        "emotion_metrics": emotions,
        "flagged_keywords": detected_keywords,
    }

    prompt = f"""You are an expert Cyber Crime Investigator and Digital Forensics Examiner.
Analyze this transcript of a suspicious phone call and the accompanying telemetry:

{json.dumps(evidence_payload, indent=2)}

Perform a deep logical analysis to determine:
1. Is this call a scam?
2. What is the specific scam category? Must be one of: Banking Scam, UPI Scam, OTP Scam, Loan Scam, KYC Scam, Lottery Scam, Job Scam, Investment Scam, Tech Support Scam, Romance Scam, Courier Scam, Unknown Fraud, None.
3. What specific indicators support your decision?
4. What is the confidence level of your assessment?

You must respond strictly with a JSON object. Do not include any markdown format tags or conversational text. Use exactly this JSON structure:
{{
  "summary": "A concise paragraph summarizing your cyber forensics findings.",
  "threat_category": "Name of the scam type (e.g. Banking Scam).",
  "confidence_rating": 90, // An integer confidence rating between 0 and 100
  "final_decision": "SCAM CONFIRMED", // Must be one of: SAFE, MONITOR, SUSPICIOUS, HIGH RISK, SCAM CONFIRMED
  "reasoning_steps": [
    "Indicator 1: explain why it is flagged",
    "Indicator 2: explain why it is flagged",
    "Indicator 3: explain why it is flagged"
  ],
  "recommended_action": "Block Caller" // Must be one of: Ignore Call, Do Not Share OTP, Block Caller, Report Number, Notify Cyber Crime Portal
}}
"""

    if GROQ_API_KEY and not GROQ_API_KEY.startswith("your_"):
        try:
            logger.info("Sending call forensics evidence payload to Groq LLM...")
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            body = {
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
                "max_tokens": 800,
            }
            response = requests.post(
                GROQ_API_URL, headers=headers, json=body, timeout=8
            )

            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                logger.info(
                    f"Groq call reasoning complete. Verdict: {parsed.get('final_decision')}"
                )
                return parsed
            else:
                logger.warning(
                    f"Groq API returned status {response.status_code}: {response.text}"
                )
        except Exception as err:
            logger.error(
                f"Failed to contact Groq API or parse LLM response: {err}",
                exc_info=True,
            )

    # 3. Failsafe Rule-Based Fallback
    logger.info("Executing rule-based call reasoning engine fallback...")

    # Basic indicator parsing
    has_otp = entities.get("otp_number") is not None or "otp" in transcript.lower()
    has_bank = entities.get("organization_names") is not None and len(entities.get("organization_names")) > 0
    has_money = "money" in transcript.lower() or "amount" in transcript.lower() or "pay" in transcript.lower()
    urgency_high = emotions.get("Urgency", 0) >= 50 or emotions.get("Pressure", 0) >= 50

    reasoning_steps = []
    if has_otp:
        reasoning_steps.append("The caller explicitly requested a one-time password (OTP).")
    if has_bank:
        reasoning_steps.append(
            f"The caller impersonated a banking organization: {entities.get('organization_names')}."
        )
    if has_money:
        reasoning_steps.append("The conversation involved requests for financial transfer or payments.")
    if urgency_high:
        reasoning_steps.append("High urgency and psychological pressure tactics were detected.")

    if len(detected_keywords) > 0:
        reasoning_steps.append(f"Flagged scam phrases detected: {detected_keywords}.")

    if has_otp and has_bank:
        decision = "SCAM CONFIRMED"
        rec = "Block Caller"
        cat = "Banking Scam"
        conf = 98
        summary = "Critical banking scam detected. Caller impersonated a bank official to harvest sensitive OTP authorization codes."
    elif has_money or urgency_high:
        decision = "HIGH RISK"
        rec = "Do Not Share OTP"
        cat = "UPI Scam"
        conf = 85
        summary = "High scam indicators found. Caller attempted to create psychological pressure to extract transaction confirmations."
    elif len(detected_keywords) > 0:
        decision = "SUSPICIOUS"
        rec = "Ignore Call"
        cat = "Unknown Fraud"
        conf = 60
        summary = "Potential social engineering scam. Conversation triggers flagged scam word frequencies."
    else:
        decision = "SAFE"
        rec = "Ignore Call"
        cat = "None"
        conf = 95
        summary = "Safe call profile. No pressure indicators, phishing keywords, or credential requests detected."

    if not reasoning_steps:
        reasoning_steps.append("No suspicious social engineering indicators found.")

    return {
        "summary": summary,
        "threat_category": cat,
        "confidence_rating": conf,
        "final_decision": decision,
        "reasoning_steps": reasoning_steps,
        "recommended_action": rec,
    }
