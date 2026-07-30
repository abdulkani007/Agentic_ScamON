import json
import logging
import os
import requests
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Load Groq API configurations
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

def run_email_llm_analysis(
    subject: str,
    sender: str,
    receiver: str,
    snippet: str,
    body_text: str,
    headers_summary: Dict[str, Any],
    links_summary: List[Dict[str, Any]],
    attachments_summary: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Uses Groq Llama3 to perform deep email context threat analysis.
    
    Falls back to deterministic rule-based analysis if the API fails or is missing.
    """
    evidence_payload = {
        "subject": subject,
        "sender": sender,
        "receiver": receiver,
        "snippet": snippet,
        "body_text": body_text[:3000],  # Truncate to save tokens
        "headers_summary": headers_summary,
        "links_summary": links_summary,
        "attachments_summary": attachments_summary
    }

    prompt = f"""You are a Senior Mail Gateway Security Specialist and Cyber Threat Intelligence Analyst.
Analyze the email content, headers, links, and attachments to classify its threat profile:

{json.dumps(evidence_payload, indent=2)}

Perform a deep semantic and context analysis to determine:
1. Is this email malicious or safe?
2. What is the specific classification? Must be exactly one of: Safe, Spam, Phishing, Business Email Compromise, Lottery Scam, OTP Scam, Bank Scam, Social Engineering.
3. What specific threat markers support your reasoning?

You must respond strictly with a JSON object. Do not include any markdown format tags or conversational text. Use exactly this JSON structure:
{{
  "classification": "Phishing", // Must be one of: Safe, Spam, Phishing, Business Email Compromise, Lottery Scam, OTP Scam, Bank Scam, Social Engineering
  "confidence": 95, // Integer between 0 and 100
  "reasoning": "Explain the forensic evidence (e.g. SPF/DKIM failures, malicious links, sender spoofing, urgency keywords, macro attachments) that led to this verdict."
}}
"""

    if GROQ_API_KEY and not GROQ_API_KEY.startswith("your_"):
        try:
            logger.info("Sending email forensic payload to Groq LLM...")
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
                logger.info(f"Groq email analysis complete. Classification: {parsed.get('classification')}")
                return parsed
            else:
                logger.warning(f"Groq API returned status {response.status_code}: {response.text}")
        except Exception as err:
            logger.error(f"Failed to contact Groq API or parse LLM response: {err}", exc_info=True)

    # 3. Rule-Based Fallback
    logger.info("Executing rule-based email reasoning engine fallback...")
    
    # Analyze body and subject for semantic keywords
    text_to_scan = (subject + " " + snippet + " " + body_text).lower()
    
    classification = "Safe"
    confidence = 90
    reasons = []

    # Check links and attachments risk scores
    max_link_risk = max([l.get("risk_score", 0) for l in links_summary]) if links_summary else 0
    max_att_risk = max([a.get("risk_score", 0) for a in attachments_summary]) if attachments_summary else 0
    header_risk = headers_summary.get("risk_score", 0)

    # Scenarios:
    if "otp" in text_to_scan or "one time password" in text_to_scan or "verification code" in text_to_scan:
        classification = "OTP Scam"
        confidence = 85
        reasons.append("The email contains text requesting validation of a one-time password (OTP) or security code.")
        
    elif "lottery" in text_to_scan or "prize" in text_to_scan or "won" in text_to_scan or "gift card" in text_to_scan or "reward" in text_to_scan:
        classification = "Lottery Scam"
        confidence = 80
        reasons.append("The email body contains references to winning prizes, rewards, or lottery payouts.")
        
    elif any(bank in text_to_scan for bank in ("bank", "account suspended", "kyc", "card blocked", "netbanking")):
        classification = "Bank Scam"
        confidence = 85
        reasons.append("The email mimics banking communications regarding account suspensions or KYC updates.")
        
    elif any(urg in text_to_scan for urg in ("urgent", "invoice", "payment", "wire transfer", "ceo", "transfer money")):
        classification = "Business Email Compromise"
        confidence = 75
        reasons.append("The content contains business urgency triggers, payment requests, or CEO identity impersonation.")
        
    elif max_link_risk >= 70 or header_risk >= 60:
        classification = "Phishing"
        confidence = 90
        reasons.append("The email contains links marked as high threat by the Website Agent, or header authentication checks failed.")

    elif max_att_risk >= 80:
        classification = "Phishing"
        confidence = 95
        reasons.append("The email contains highly dangerous file attachments (executables or macro-enabled documents).")

    elif "buy" in text_to_scan or "sale" in text_to_scan or "discount" in text_to_scan or "free" in text_to_scan:
        classification = "Spam"
        confidence = 70
        reasons.append("Semantic keywords indicate mass advertising, discounts, or promotional campaigns.")

    if not reasons:
        reasons.append("Standard security profiles verified. No malicious links, attachments, or scam signatures detected.")
    else:
        # If we found scam indicators, increase confidence if header check failed
        if header_risk >= 50:
            confidence = min(confidence + 10, 99)

    return {
        "classification": classification,
        "confidence": confidence,
        "reasoning": " (Fallback engine) ".join(reasons)
    }
