import logging
import requests
from typing import Any, Dict

logger = logging.getLogger(__name__)


def trace_redirects(url: str) -> Dict[str, Any]:
    """Traces the complete HTTP redirect chain and records final landing status."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        logger.info(f"Tracing redirect chain for: {url}")
        # Allow redirects and trace response history
        response = requests.get(
            url, headers=headers, allow_redirects=True, timeout=5
        )

        history_urls = [resp.url for resp in response.history]
        history_urls.append(response.url)  # Add final landing URL

        logger.info(
            f"Redirect trace complete. Hops: {len(response.history)}, Final status: {response.status_code}"
        )
        return {
            "hops_count": len(response.history),
            "history": history_urls,
            "final_status": response.status_code,
            "landing_url": response.url,
        }
    except Exception as err:
        logger.warning(f"Failed to trace redirect hops for {url}: {err}")
        return {
            "hops_count": 0,
            "history": [url],
            "final_status": None,
            "landing_url": url,
        }
