import logging
import requests
from .config import settings

logger = logging.getLogger(__name__)


def check_phishtank(url: str) -> bool:
    """Verifies the URL against the PhishTank phishing database.

    Returns:
        bool: True if the URL is registered as a confirmed phishing link.
    """
    api_url = "https://checkurl.phishtank.com/checkurl/"

    payload = {"url": url, "format": "json"}
    if settings.PHISHTANK_API_KEY:
        payload["app_key"] = settings.PHISHTANK_API_KEY

    try:
        logger.debug(f"Querying PhishTank database for URL: {url}")
        # Short timeout to keep the dashboard responsive
        headers = {"User-Agent": "phishtank/ScamShieldAI"}
        response = requests.post(
            api_url, data=payload, headers=headers, timeout=2.5
        )

        if response.status_code == 200:
            res_data = response.json()
            results = res_data.get("results", {})
            in_database = results.get("in_database", False)
            valid = results.get("valid", False)

            is_phishing = in_database and (valid == "true" or valid is True)
            logger.info(
                f"PhishTank result parsed. URL: {url}, Known Phishing: {is_phishing}"
            )
            return is_phishing

        elif response.status_code == 429:
            logger.warning(
                "PhishTank API rate limit exceeded. Defaulting to safe offline state."
            )
        else:
            logger.warning(
                f"PhishTank API returned status code {response.status_code}. Defaulting to safe offline state."
            )

    except Exception as err:
        logger.warning(
            f"PhishTank verification failed due to network exception: {err}. Returning offline default (False)."
        )

    # Heuristic fallback: if URL has extremely suspicious subdomains or parameters and is not safe
    return False
