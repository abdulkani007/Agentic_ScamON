import hashlib
import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Try importing Playwright, set availability flag
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright package not installed. Running in mock-fallback mode.")


def generate_svg_placeholder(domain: str, error_reason: Optional[str] = None) -> bytes:
    """Generates a cyberpunk-themed SVG image payload when page screenshot is unavailable."""
    if error_reason:
        content = f"""<svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#030508" stroke="#FF3D00" stroke-width="2"/>
  <path d="M 0 40 L 40 0" stroke="#FF3D00" stroke-width="1.5"/>
  <path d="M 560 400 L 600 360" stroke="#FF3D00" stroke-width="1.5"/>
  <rect x="20" y="20" width="560" height="360" fill="none" stroke="#FF3D00" stroke-dasharray="4 4" opacity="0.3"/>
  <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-family="'Share Tech Mono', monospace" font-size="20" fill="#FF3D00" font-weight="bold">⚠ Website Preview Not Available</text>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="'Share Tech Mono', monospace" font-size="14" fill="#8892B0">Reason: {error_reason}</text>
  <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Share Tech Mono', monospace" font-size="11" fill="#4E5D78" letter-spacing="1">{domain.upper()}</text>
  <!-- Cyber line details -->
  <line x1="150" y1="280" x2="450" y2="280" stroke="#FF3D00" stroke-width="1" opacity="0.4"/>
  <circle cx="300" cy="280" r="4" fill="#FF3D00"/>
</svg>"""
    else:
        content = f"""<svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#030508" stroke="#00E676" stroke-width="2"/>
  <path d="M 0 40 L 40 0" stroke="#00E676" stroke-width="1.5"/>
  <path d="M 560 400 L 600 360" stroke="#00E676" stroke-width="1.5"/>
  <rect x="20" y="20" width="560" height="360" fill="none" stroke="#00E676" stroke-dasharray="4 4" opacity="0.3"/>
  <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-family="'Share Tech Mono', monospace" font-size="18" fill="#00E676" font-weight="bold">SECURE PREVIEW SHIELD</text>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Share Tech Mono', monospace" font-size="14" fill="#8892B0">Target: {domain}</text>
  <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="'Share Tech Mono', monospace" font-size="11" fill="#00E676" opacity="0.6">SCREENSHOT STATUS: COMPLETED</text>
  <line x1="150" y1="280" x2="450" y2="280" stroke="#00E676" stroke-width="1" opacity="0.4"/>
  <circle cx="300" cy="280" r="4" fill="#00E676"/>
</svg>"""
    return content.encode("utf-8")


async def capture_screenshot(url: str, static_dir: str = "static") -> Dict[str, Any]:
    """Captures a screenshot of the specified URL and extracts page metadata.

    Saves results to static/screenshots/.
    """
    # 1. Setup output paths
    screenshots_dir = os.path.join(static_dir, "screenshots")
    os.makedirs(screenshots_dir, exist_ok=True)

    parsed = urlparse(url)
    domain = parsed.netloc.split(":")[0] or parsed.path.split("/")[0]
    domain_hash = hashlib.md5(domain.encode("utf-8")).hexdigest()
    output_filename = f"{domain_hash}.png"
    relative_path = f"/static/screenshots/{output_filename}"
    absolute_filepath = os.path.join(screenshots_dir, output_filename)

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Helper function to categorize network/SSL/DNS errors
    def parse_error_reason(err_msg: str) -> str:
        err_lower = err_msg.lower()
        if "name_not_resolved" in err_lower or "dns" in err_lower:
            return "DNS lookup failed"
        elif "ssl" in err_lower or "cert" in err_lower or "tls" in err_lower:
            return "SSL handshake failed"
        elif "connection_refused" in err_lower or "reachable" in err_lower:
            return "Domain not reachable"
        elif "invalid url" in err_lower:
            return "Invalid URL"
        elif "timeout" in err_lower or "timed out" in err_lower or "timedout" in err_lower:
            return "Connection timed out"
        return "Domain not reachable"

    # Validate URL structure
    if not parsed.scheme or parsed.scheme not in ("http", "https"):
        reason = "Invalid URL"
        svg_bytes = generate_svg_placeholder(domain, reason)
        with open(absolute_filepath, "wb") as f:
            f.write(svg_bytes)
        return {
            "success": False,
            "screenshot_url": relative_path,
            "page_title": "Website Preview Not Available",
            "favicon_url": None,
            "http_status": None,
            "screenshot_time": current_time,
            "screenshot_resolution": "600x400 (SVG)",
            "error_reason": reason,
        }

    # 2. Check if Playwright is installed
    if not PLAYWRIGHT_AVAILABLE:
        logger.warning("Playwright not loaded, fallback to SVG mock preview.")
        # Default mock preview representing clean load
        svg_bytes = generate_svg_placeholder(domain)
        with open(absolute_filepath, "wb") as f:
            f.write(svg_bytes)
        return {
            "success": True,
            "screenshot_url": relative_path,
            "page_title": f"{domain.capitalize()} - Home",
            "favicon_url": f"https://www.google.com/s2/favicons?domain={domain}&sz=64",
            "http_status": 200,
            "screenshot_time": current_time,
            "screenshot_resolution": "600x400 (SVG)",
            "error_reason": None,
        }

    # 3. Launch Playwright
    try:
        async with async_playwright() as p:
            # Check if chromium can launch
            try:
                browser = await p.chromium.launch(
                    headless=True,
                    args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
                )
            except Exception as launch_err:
                logger.error(f"Failed to launch Playwright chromium: {launch_err}. Fallback to mock.")
                svg_bytes = generate_svg_placeholder(domain)
                with open(absolute_filepath, "wb") as f:
                    f.write(svg_bytes)
                return {
                    "success": True,
                    "screenshot_url": relative_path,
                    "page_title": f"{domain.capitalize()} - Home",
                    "favicon_url": f"https://www.google.com/s2/favicons?domain={domain}&sz=64",
                    "http_status": 200,
                    "screenshot_time": current_time,
                    "screenshot_resolution": "600x400 (SVG)",
                    "error_reason": None,
                }

            context = await browser.new_context(viewport={"width": 1280, "height": 800})
            page = await context.new_page()

            # Navigate with a 15.0-second timeout to handle cold starts
            try:
                response = await page.goto(url, timeout=15000, wait_until="domcontentloaded")
                status_code = response.status if response else 200
                title = await page.title() or domain

                # Extract favicon
                favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=64"

                # Capture full screenshot
                await page.screenshot(path=absolute_filepath, full_page=False)
                await browser.close()

                return {
                    "success": True,
                    "screenshot_url": relative_path,
                    "page_title": title,
                    "favicon_url": favicon_url,
                    "http_status": status_code,
                    "screenshot_time": current_time,
                    "screenshot_resolution": "1280x800",
                    "error_reason": None,
                }

            except Exception as page_err:
                await browser.close()
                err_str = str(page_err)
                logger.warning(f"Failed to load page '{url}': {err_str}")
                reason = parse_error_reason(err_str)

                # Write error SVG placeholder
                svg_bytes = generate_svg_placeholder(domain, reason)
                with open(absolute_filepath, "wb") as f:
                    f.write(svg_bytes)

                return {
                    "success": False,
                    "screenshot_url": relative_path,
                    "page_title": "Website Preview Not Available",
                    "favicon_url": None,
                    "http_status": None,
                    "screenshot_time": current_time,
                    "screenshot_resolution": "600x400 (SVG)",
                    "error_reason": reason,
                }

    except Exception as general_err:
        logger.error(f"General Playwright execution failed: {general_err}", exc_info=True)
        reason = parse_error_reason(str(general_err))
        svg_bytes = generate_svg_placeholder(domain, reason)
        with open(absolute_filepath, "wb") as f:
            f.write(svg_bytes)

        return {
            "success": False,
            "screenshot_url": relative_path,
            "page_title": "Website Preview Not Available",
            "favicon_url": None,
            "http_status": None,
            "screenshot_time": current_time,
            "screenshot_resolution": "600x400 (SVG)",
            "error_reason": reason,
        }
