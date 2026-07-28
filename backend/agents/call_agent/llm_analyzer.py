import json
import logging
from typing import Any, Dict
import httpx
from .config import settings

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"


def analyze_transcript(transcript: str) -> Dict[str, Any]:
    """Analyzes a call transcript using the Groq API (llama-3.1-8b-instant model)

    to detect urgency, pressure, scam type, confidence, and reasoning.

    Args:
        transcript (str): The call transcript to analyze.

    Returns:
        Dict[str, Any]: Structured dictionary with keys matching the
        LLMAnalysisResult schema.
    """
    if not settings.GROQ_API_KEY:
        logger.error("GROQ_API_KEY is not set in environment settings.")
        raise ValueError(
            "GROQ_API_KEY is missing. Please add it to your environment or .env file."
        )

    if not transcript or not transcript.strip():
        logger.info(
            "Transcript is empty or blank. Returning default no-scam analysis."
        )
        return {
            "urgency": "Low",
            "pressure": "Low",
            "confidence": 0,
            "scam_type": "Not a Scam",
            "reasoning": "The provided call audio or text did not contain any discernible speech to analyze.",
        }

    system_prompt = (
        "You are an expert cybersecurity analyst for ScamShield AI.\n"
        "Analyze the provided call transcript for potential scam activities by evaluating:\n"
        "- Urgency (pressure to act quickly)\n"
        "- Manipulation (deception/social engineering tactics)\n"
        "- Authority Impersonation (SBI Bank, Support, Government Agencies)\n"
        "- Emotional Pressure (fear, intimidation, greed)\n"
        "- Scam Category (classification of the scam)\n"
        "- Confidence (probability that this call is a scam from 0 to 100)\n\n"
        "You MUST return a JSON object with EXACTLY the following format:\n"
        "{\n"
        '    "urgency": "High" | "Medium" | "Low",\n'
        '    "pressure": "High" | "Medium" | "Low",\n'
        '    "confidence": int,\n'
        '    "scam_type": "string",\n'
        '    "reasoning": "string explaining your analysis, mentioning urgency, manipulation, impersonation, etc."\n'
        "}"
    )

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"Analyze the following call transcript:\n\n{transcript}",
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1,
    }

    try:
        logger.info(f"Sending transcript to Groq API using model: {GROQ_MODEL}")
        with httpx.Client(timeout=30.0) as client:
            response = client.post(GROQ_API_URL, headers=headers, json=payload)
            response.raise_for_status()

            response_data = response.json()
            content = response_data["choices"][0]["message"]["content"]
            logger.info("Successfully received response from Groq API.")

            result = json.loads(content)

            # Ensure all required keys are present and conform to basic types
            required_keys = {
                "urgency",
                "pressure",
                "confidence",
                "scam_type",
                "reasoning",
            }
            missing_keys = required_keys - set(result.keys())
            if missing_keys:
                raise ValueError(
                    f"LLM response missing required keys: {missing_keys}"
                )

            # Basic type conversion/safeguard
            result["confidence"] = int(result["confidence"])

            return result

    except httpx.HTTPStatusError as http_err:
        logger.error(
            f"HTTP error from Groq API: {http_err.response.status_code} - {http_err.response.text}"
        )
        raise RuntimeError(
            f"Groq API returned HTTP error: {http_err.response.status_code}"
        )
    except json.JSONDecodeError as json_err:
        logger.error(f"Failed to parse JSON response from Groq: {json_err}")
        raise RuntimeError(f"Failed to parse LLM JSON output: {str(json_err)}")
    except Exception as e:
        logger.error(f"Unexpected error during Groq LLM analysis: {e}")
        raise RuntimeError(f"LLM analysis failed: {str(e)}")
