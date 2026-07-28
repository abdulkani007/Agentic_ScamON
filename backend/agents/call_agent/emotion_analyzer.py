import logging
import re
from typing import Dict

logger = logging.getLogger(__name__)


def analyze_emotions(transcript: str) -> Dict[str, int]:
    """Scans the transcript using keyword classification to compute confidence scores

    (0-100) for six key socio-emotional pressure tactics.
    """
    t_lower = transcript.lower()

    # Define threat emotion keywords
    fear_words = [
        "arrest",
        "police",
        "jail",
        "lawsuit",
        "court",
        "complaint",
        "prosecute",
        "illegal",
        "penalty",
        "crime",
        "investigation",
    ]
    urgency_words = [
        "immediately",
        "now",
        "quick",
        "hurry",
        "fast",
        "urgent",
        "expire",
        "seconds",
        "minutes",
        "block",
        "today",
    ]
    pressure_words = [
        "must",
        "required",
        "compulsory",
        "do it",
        "otherwise",
        "fail",
        "cancelling",
        "stop",
        "refuse",
        "penalty",
    ]
    aggression_words = [
        "shutup",
        "listen to me",
        "do not speak",
        "officer",
        "authorized",
        "force",
        "warn",
        "hangup",
        "obey",
    ]
    trust_words = [
        "help you",
        "secure",
        "safe",
        "officer",
        "department",
        "verify",
        "support",
        "trust",
        "assistant",
        "resolve",
    ]
    social_eng_words = [
        "otp",
        "code",
        "account",
        "verification",
        "bank",
        "manager",
        "update",
        "kyc",
        "card",
        "pin",
        "credentials",
    ]

    def score_category(words) -> int:
        count = 0
        for w in words:
            # Use regex word boundaries to match exact keywords
            count += len(re.findall(r"\b" + re.escape(w) + r"\b", t_lower))
        return min(count * 25, 100) if count > 0 else 0

    scores = {
        "Fear": max(score_category(fear_words), 10),
        "Urgency": max(score_category(urgency_words), 10),
        "Pressure": max(score_category(pressure_words), 15),
        "Aggression": max(score_category(aggression_words), 5),
        "Trust Building": max(score_category(trust_words), 20),
        "Social Engineering": max(score_category(social_eng_words), 15),
    }

    logger.info(f"Emotion profile extracted: {scores}")
    return scores
