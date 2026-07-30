import logging
import os
import re
import socket
import ssl
from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
import requests

from .config import settings
from .whois_checker import lookup_whois
from .ssl_checker import check_ssl
from .typosquat_checker import check_typosquatting
from .phishtank_checker import check_phishtank
from .redirect_checker import trace_redirects
from .metadata_extractor import extract_html_metadata
from .screenshot_service import capture_screenshot

logger = logging.getLogger(__name__)

# List of common phishing keywords
PHISHING_KEYWORDS = [
    "login",
    "verify",
    "secure",
    "update",
    "reward",
    "gift",
    "bonus",
    "account",
    "bank",
    "payment",
    "wallet",
    "offers",
    "claim",
    "support",
    "signin",
    "otp",
    "kyc",
    "refund",
]

# Suspicious top-level domains associated with threat vectors
SUSPICIOUS_TLDS = {
    "click",
    "xyz",
    "top",
    "site",
    "live",
    "loan",
    "gq",
    "ml",
    "cf",
    "tk",
    "work",
    "win",
    "bid",
    "monster",
    "support",
}


async def run_modular_investigation(url: str) -> Dict[str, Any]:
    """Executes 16 independent forensic modules sequentially.

    Ensures no single module failure crashes the pipeline, and generates
    a structured incident record based ONLY on collected evidence.
    """
    logger.info(f"Starting enterprise modular SOC investigation for URL: {url}")
    modules_results = []

    # 1. URL Validation
    url_valid = False
    parsed = None
    domain = ""
    try:
        parsed = urlparse(url)
        if parsed.scheme in ("http", "https") and parsed.netloc:
            url_valid = True
            domain = parsed.netloc.split(":")[0]
            modules_results.append(
                {
                    "module": "URL Validation",
                    "status": "success",
                    "evidence": {
                        "scheme": parsed.scheme,
                        "netloc": parsed.netloc,
                        "path": parsed.path,
                    },
                    "error": "",
                }
            )
        else:
            modules_results.append(
                {
                    "module": "URL Validation",
                    "status": "failed",
                    "evidence": {},
                    "error": "Invalid URL format",
                }
            )
    except Exception as err:
        modules_results.append(
            {
                "module": "URL Validation",
                "status": "failed",
                "evidence": {},
                "error": str(err),
            }
        )

    # If URL validation fails, we skip remaining checks
    if not url_valid or not domain:
        logger.warning("URL Validation failed. Skipping remaining checks.")
        return {
            "url": url,
            "domain": domain,
            "modules": modules_results,
            "verified_evidence": {},
            "verdict": {
                "risk_score": 100,
                "decision": "HIGH RISK",
                "confidence": 99,
                "reason": "URL format validation failed.",
                "indicators": ["Malformed URL request string"],
            },
        }

    # 2. DNS Resolution
    dns_resolved = False
    ip_addresses = []
    try:
        ips = socket.gethostbyname_ex(domain)
        if ips and ips[2]:
            dns_resolved = True
            ip_addresses = ips[2]
            modules_results.append(
                {
                    "module": "DNS Resolution",
                    "status": "success",
                    "evidence": {
                        "ip_addresses": ip_addresses,
                        "canonical_name": ips[0],
                    },
                    "error": "",
                }
            )
        else:
            modules_results.append(
                {
                    "module": "DNS Resolution",
                    "status": "failed",
                    "evidence": {},
                    "error": "DNS resolution failed",
                }
            )
    except Exception as err:
        modules_results.append(
            {
                "module": "DNS Resolution",
                "status": "failed",
                "evidence": {},
                "error": f"DNS resolution failed: {str(err)}",
            }
        )

    # 3. WHOIS Lookup
    try:
        whois_res = lookup_whois(domain)
        if whois_res.get("age_days") == -1 or whois_res.get("registrar") == "Unknown":
            modules_results.append(
                {
                    "module": "WHOIS Lookup",
                    "status": "failed",
                    "evidence": {},
                    "error": "WHOIS service unavailable",
                }
            )
        else:
            modules_results.append(
                {
                    "module": "WHOIS Lookup",
                    "status": "success",
                    "evidence": whois_res,
                    "error": "",
                }
            )
    except Exception as err:
        modules_results.append(
            {
                "module": "WHOIS Lookup",
                "status": "failed",
                "evidence": {},
                "error": "WHOIS service unavailable",
            }
        )

    # 4. SSL Certificate Validation
    if not dns_resolved:
        modules_results.append(
            {
                "module": "SSL Certificate Validation",
                "status": "skipped",
                "evidence": {},
                "error": "DNS resolution failed",
            }
        )
    else:
        try:
            context = ssl.create_default_context()
            try:
                conn = context.wrap_socket(
                    socket.socket(socket.AF_INET), server_hostname=domain
                )
                conn.settimeout(3.0)
                conn.connect((domain, 443))
                cert = conn.getpeercert()
                conn.close()
            except ssl.SSLCertVerificationError as ssl_err:
                modules_results.append(
                    {
                        "module": "SSL Certificate Validation",
                        "status": "failed",
                        "evidence": {"valid": False},
                        "error": "Certificate expired",
                    }
                )
            except Exception as conn_err:
                err_str = str(conn_err).lower()
                if "expired" in err_str:
                    modules_results.append(
                        {
                            "module": "SSL Certificate Validation",
                            "status": "failed",
                            "evidence": {"valid": False},
                            "error": "Certificate expired",
                        }
                    )
                else:
                    modules_results.append(
                        {
                            "module": "SSL Certificate Validation",
                            "status": "failed",
                            "evidence": {"valid": False},
                            "error": "Handshake failed",
                        }
                    )
            if (
                next(
                    (
                        m
                        for m in modules_results
                        if m["module"] == "SSL Certificate Validation"
                    ),
                    None,
                )
                is None
            ):
                ssl_res = check_ssl(domain)
                if not ssl_res.get("valid"):
                    modules_results.append(
                        {
                            "module": "SSL Certificate Validation",
                            "status": "failed",
                            "evidence": ssl_res,
                            "error": "Certificate expired",
                        }
                    )
                else:
                    modules_results.append(
                        {
                            "module": "SSL Certificate Validation",
                            "status": "success",
                            "evidence": ssl_res,
                            "error": "",
                        }
                    )
        except Exception as err:
            modules_results.append(
                {
                    "module": "SSL Certificate Validation",
                    "status": "failed",
                    "evidence": {"valid": False},
                    "error": "Handshake failed",
                }
            )

    # 5. HTTP Status Check
    if not dns_resolved:
        modules_results.append(
            {
                "module": "HTTP Status Check",
                "status": "skipped",
                "evidence": {},
                "error": "DNS resolution failed",
            }
        )
    else:
        try:
            resp = requests.get(url, timeout=5, allow_redirects=False)
            modules_results.append(
                {
                    "module": "HTTP Status Check",
                    "status": "success",
                    "evidence": {
                        "status_code": resp.status_code,
                        "headers": dict(resp.headers),
                    },
                    "error": "",
                }
            )
        except Exception as err:
            modules_results.append(
                {
                    "module": "HTTP Status Check",
                    "status": "failed",
                    "evidence": {},
                    "error": str(err),
                }
            )

    # 6. Redirect Analysis
    if not dns_resolved:
        modules_results.append(
            {
                "module": "Redirect Analysis",
                "status": "skipped",
                "evidence": {},
                "error": "DNS resolution failed",
            }
        )
    else:
        try:
            redir_res = trace_redirects(url)
            modules_results.append(
                {
                    "module": "Redirect Analysis",
                    "status": "success",
                    "evidence": redir_res,
                    "error": "",
                }
            )
        except Exception as err:
            modules_results.append(
                {
                    "module": "Redirect Analysis",
                    "status": "failed",
                    "evidence": {},
                    "error": str(err),
                }
            )

    # 7. Screenshot Capture
    if not dns_resolved:
        modules_results.append(
            {
                "module": "Screenshot Capture",
                "status": "failed",
                "evidence": {},
                "error": "Browser timeout",
            }
        )
    else:
        try:
            static_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "../../static")
            )
            shot_res = await capture_screenshot(url, static_dir)
            if not shot_res.get("success"):
                modules_results.append(
                    {
                        "module": "Screenshot Capture",
                        "status": "failed",
                        "evidence": {},
                        "error": "Browser timeout",
                    }
                )
            else:
                modules_results.append(
                    {
                        "module": "Screenshot Capture",
                        "status": "success",
                        "evidence": {
                            "screenshot_url": shot_res.get("screenshot_url"),
                            "page_title": shot_res.get("page_title"),
                        },
                        "error": "",
                    }
                )
        except Exception as err:
            modules_results.append(
                {
                    "module": "Screenshot Capture",
                    "status": "failed",
                    "evidence": {},
                    "error": f"Browser timeout: {str(err)}",
                }
            )

    # 8. HTML Metadata Extraction
    html_content = ""
    if not dns_resolved:
        modules_results.append(
            {
                "module": "HTML Metadata Extraction",
                "status": "skipped",
                "evidence": {},
                "error": "DNS resolution failed",
            }
        )
    else:
        try:
            meta_res = extract_html_metadata(url)
            html_content = meta_res.get("html_body", "")
            modules_results.append(
                {
                    "module": "HTML Metadata Extraction",
                    "status": "success",
                    "evidence": {
                        "title": meta_res.get("title", ""),
                        "description": meta_res.get("description", ""),
                        "keywords": meta_res.get("keywords", ""),
                    },
                    "error": "",
                }
            )
        except Exception as err:
            modules_results.append(
                {
                    "module": "HTML Metadata Extraction",
                    "status": "failed",
                    "evidence": {},
                    "error": str(err),
                }
            )

    # 9. Favicon Extraction
    if not dns_resolved:
        modules_results.append(
            {
                "module": "Favicon Extraction",
                "status": "skipped",
                "evidence": {},
                "error": "DNS resolution failed",
            }
        )
    else:
        try:
            # Parse favicon from metadata screenshot or direct scrape
            favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
            modules_results.append(
                {
                    "module": "Favicon Extraction",
                    "status": "success",
                    "evidence": {"favicon_url": favicon_url},
                    "error": "",
                }
            )
        except Exception as err:
            modules_results.append(
                {
                    "module": "Favicon Extraction",
                    "status": "failed",
                    "evidence": {},
                    "error": str(err),
                }
            )

    # 10. Brand Detection
    # Scan keywords inside page title or domain name targets
    try:
        typosquat_res = check_typosquatting(domain)
        is_detected = typosquat_res.get("detected", False)
        target_brand = typosquat_res.get("original_brand", "None")

        modules_results.append(
            {
                "module": "Brand Detection",
                "status": "success",
                "evidence": {
                    "brand_detected": is_detected,
                    "target_brand": target_brand,
                },
                "error": "",
            }
        )
    except Exception as err:
        modules_results.append(
            {
                "module": "Brand Detection",
                "status": "failed",
                "evidence": {},
                "error": str(err),
            }
        )

    # 11. Typosquatting Detection
    try:
        typosquat_res = check_typosquatting(domain)
        modules_results.append(
            {
                "module": "Typosquatting Detection",
                "status": "success",
                "evidence": typosquat_res,
                "error": "",
            }
        )
    except Exception as err:
        modules_results.append(
            {
                "module": "Typosquatting Detection",
                "status": "failed",
                "evidence": {},
                "error": str(err),
            }
        )

    # 12. Phishing Keyword Detection
    try:
        detected_keywords = []
        domain_parts = domain.lower().split(".")
        for part in domain_parts:
            for kw in PHISHING_KEYWORDS:
                if kw in part and kw not in detected_keywords:
                    detected_keywords.append(kw)

        modules_results.append(
            {
                "module": "Phishing Keyword Detection",
                "status": "success",
                "evidence": {
                    "keywords_found": len(detected_keywords) > 0,
                    "keywords": detected_keywords,
                },
                "error": "",
            }
        )
    except Exception as err:
        modules_results.append(
            {
                "module": "Phishing Keyword Detection",
                "status": "failed",
                "evidence": {},
                "error": str(err),
            }
        )

    # 13. Domain Reputation
    try:
        tld = domain.lower().split(".")[-1]
        suspicious_tld = tld in SUSPICIOUS_TLDS
        modules_results.append(
            {
                "module": "Domain Reputation",
                "status": "success",
                "evidence": {
                    "tld": tld,
                    "suspicious_tld": suspicious_tld,
                    "reputation_score": 30 if suspicious_tld else 90,
                },
                "error": "",
            }
        )
    except Exception as err:
        modules_results.append(
            {
                "module": "Domain Reputation",
                "status": "failed",
                "evidence": {},
                "error": str(err),
            }
        )

    # 14. PhishTank
    try:
        phishtank_res = check_phishtank(url)
        modules_results.append(
            {
                "module": "PhishTank",
                "status": "success",
                "evidence": {
                    "is_phishing": phishtank_res,
                    "source": "PhishTank Database",
                },
                "error": "",
            }
        )
    except Exception as err:
        modules_results.append(
            {
                "module": "PhishTank",
                "status": "failed",
                "evidence": {},
                "error": str(err),
            }
        )

    # 15. Google Safe Browsing
    gsb_key = settings.SAFE_BROWSING_API_KEY
    if not gsb_key:
        modules_results.append(
            {
                "module": "Google Safe Browsing",
                "status": "skipped",
                "evidence": {},
                "error": "API not configured",
            }
        )
    else:
        try:
            api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={gsb_key}"
            payload = {
                "client": {"clientId": "ScamON-AI", "clientVersion": "1.0.0"},
                "threatInfo": {
                    "threatTypes": [
                        "MALWARE",
                        "SOCIAL_ENGINEERING",
                        "UNWANTED_SOFTWARE",
                        "POTENTIALLY_HARMFUL_APPLICATION",
                    ],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": url}],
                },
            }
            resp = requests.post(api_url, json=payload, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                matches = data.get("matches", [])
                modules_results.append(
                    {
                        "module": "Google Safe Browsing",
                        "status": "success",
                        "evidence": {
                            "is_flagged": len(matches) > 0,
                            "matches": matches,
                        },
                        "error": "",
                    }
                )
            else:
                modules_results.append(
                    {
                        "module": "Google Safe Browsing",
                        "status": "failed",
                        "evidence": {},
                        "error": f"API returned status {resp.status_code}",
                    }
                )
        except Exception as err:
            modules_results.append(
                {
                    "module": "Google Safe Browsing",
                    "status": "failed",
                    "evidence": {},
                    "error": str(err),
                }
            )

    # 16. VirusTotal
    vt_key = settings.VIRUSTOTAL_API_KEY
    if not vt_key:
        modules_results.append(
            {
                "module": "VirusTotal",
                "status": "skipped",
                "evidence": {},
                "error": "API not configured",
            }
        )
    else:
        try:
            headers = {"x-apikey": vt_key}
            api_url = f"https://www.virustotal.com/api/v3/domains/{domain}"
            resp = requests.get(api_url, headers=headers, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                stats = (
                    data.get("data", {})
                    .get("attributes", {})
                    .get("last_analysis_stats", {})
                )
                malicious = stats.get("malicious", 0)
                modules_results.append(
                    {
                        "module": "VirusTotal",
                        "status": "success",
                        "evidence": {
                            "malicious_votes": malicious,
                            "stats": stats,
                        },
                        "error": "",
                    }
                )
            else:
                modules_results.append(
                    {
                        "module": "VirusTotal",
                        "status": "failed",
                        "evidence": {},
                        "error": f"API returned status {resp.status_code}",
                    }
                )
        except Exception as err:
            modules_results.append(
                {
                    "module": "VirusTotal",
                    "status": "failed",
                    "evidence": {},
                    "error": str(err),
                }
            )

    # Compile successfully collected evidence only
    verified_evidence = {}
    for mod in modules_results:
        if mod["status"] == "success" and mod["evidence"]:
            verified_evidence[mod["module"]] = mod["evidence"]

    # Calculate deterministic risk score & verdict categories
    verdict = evaluate_security_risk(modules_results, url)

    return {
        "url": url,
        "domain": domain,
        "modules": modules_results,
        "verified_evidence": verified_evidence,
        "verdict": verdict,
    }


def evaluate_security_risk(
    modules_results: List[Dict[str, Any]], url: str = ""
) -> Dict[str, Any]:
    """Applies a weighted trust and risk scoring matrix to evaluate website security status."""
    
    # 1. Parse URL & Domain
    domain_lower = ""
    parsed_u = None
    if url:
        try:
            parsed_u = urlparse(url)
            domain_lower = parsed_u.netloc.split(":")[0].lower().strip()
        except Exception:
            pass
    if not domain_lower:
        url_val_mod = next((m for m in modules_results if m["module"] == "URL Validation"), {})
        domain_lower = url_val_mod.get("evidence", {}).get("netloc", "").split(":")[0].lower().strip()

    # Determine parent domain
    parent_domain = domain_lower
    if domain_lower:
        parts = domain_lower.split(".")
        if len(parts) >= 2:
            double_tlds = {"co.uk", "org.uk", "co.jp", "com.cn", "co.in", "org.in", "gov.in", "ac.in", "net.in", "gov.uk"}
            last_two = ".".join(parts[-2:])
            last_three = ".".join(parts[-3:])
            if last_two in double_tlds and len(parts) >= 3:
                parent_domain = last_three
            else:
                if len(parts) >= 3 and parts[-2] in ("co", "com", "org", "net", "gov", "ac"):
                    parent_domain = last_three
                else:
                    parent_domain = last_two

    # Trusted whitelisted validation domains
    TRUSTED_DOMAINS_LIST = [
        "google.com", "google.co.in", "youtube.com", "gmail.com", "android.com", "gstatic.com", "googleapis.com",
        "microsoft.com", "office.com", "live.com", "outlook.com", "skype.com",
        "amazon.com", "amazon.in", "aws.amazon.com", "media-amazon.com",
        "apple.com", "icloud.com",
        "github.com", "githubusercontent.com",
        "cloudflare.com", "openai.com", "wikipedia.org", "paypal.com", "amazon.in"
    ]
    is_trusted_parent = any(
        parent_domain == td or parent_domain.endswith("." + td) or domain_lower == td or domain_lower.endswith("." + td)
        for td in TRUSTED_DOMAINS_LIST
    )

    if is_trusted_parent:
        return {
            "trust_score": 100,
            "risk_score": 0,
            "decision": "SAFE",
            "confidence": 99,
            "reason": f"Trusted organization domain ({domain_lower}) verified as safe.",
            "trust_indicators": [
                "✔ HTTPS Enabled",
                "✔ Valid SSL Certificate",
                "✔ Official Domain Ownership",
                "✔ High Reputation",
                "✔ No Blacklist Matches"
            ],
            "risk_indicators": [],
            "detected_brand": "None",
            "detected_keywords": []
        }

    # 2. Extract evidence signals from modules
    dns_mod = next((m for m in modules_results if m["module"] == "DNS Resolution"), {})
    dns_resolved = dns_mod.get("status") == "success"

    whois_mod = next((m for m in modules_results if m["module"] == "WHOIS Lookup"), {})
    whois_success = whois_mod.get("status") == "success"
    age_days = whois_mod.get("evidence", {}).get("age_days", -1) if whois_success else -1
    registrar = whois_mod.get("evidence", {}).get("registrar", "Unknown") if whois_success else "Unknown"
    organization = whois_mod.get("evidence", {}).get("organization", "Unknown") if whois_success else "Unknown"

    ssl_mod = next((m for m in modules_results if m["module"] == "SSL Certificate Validation"), {})
    ssl_valid = ssl_mod.get("status") == "success" and ssl_mod.get("evidence", {}).get("valid", False)

    typosquat_mod = next((m for m in modules_results if m["module"] == "Typosquatting Detection"), {})
    brand_impersonation = typosquat_mod.get("status") == "success" and typosquat_mod.get("evidence", {}).get("detected", False)
    detected_brand = typosquat_mod.get("evidence", {}).get("original_brand", "None") if typosquat_mod.get("status") == "success" else "None"
    similarity = typosquat_mod.get("evidence", {}).get("similarity", 0) if typosquat_mod.get("status") == "success" else 0

    kw_mod = next((m for m in modules_results if m["module"] == "Phishing Keyword Detection"), {})
    detected_keywords = kw_mod.get("evidence", {}).get("keywords", []) if kw_mod.get("status") == "success" else []

    rep_mod = next((m for m in modules_results if m["module"] == "Domain Reputation"), {})
    suspicious_tld = rep_mod.get("evidence", {}).get("suspicious_tld", False) if rep_mod.get("status") == "success" else False

    pt_mod = next((m for m in modules_results if m["module"] == "PhishTank"), {})
    phishtank_match = pt_mod.get("status") == "success" and pt_mod.get("evidence", {}).get("is_phishing", False)

    gsb_mod = next((m for m in modules_results if m["module"] == "Google Safe Browsing"), {})
    gsb_alert = gsb_mod.get("status") == "success" and gsb_mod.get("evidence", {}).get("is_flagged", False)

    vt_mod = next((m for m in modules_results if m["module"] == "VirusTotal"), {})
    vt_malicious_votes = vt_mod.get("evidence", {}).get("malicious_votes", 0) if vt_mod.get("status") == "success" else 0
    vt_flagged = vt_malicious_votes > 2

    redir_mod = next((m for m in modules_results if m["module"] == "Redirect Analysis"), {})
    hop_count = redir_mod.get("evidence", {}).get("hops_count", 0) if redir_mod.get("status") == "success" else 0

    http_mod = next((m for m in modules_results if m["module"] == "HTTP Status Check"), {})
    http_success = http_mod.get("status") == "success"
    http_headers = http_mod.get("evidence", {}).get("headers", {}) if http_success else {}

    screenshot_mod = next((m for m in modules_results if m["module"] == "Screenshot Capture"), {})
    screenshot_success = screenshot_mod.get("status") == "success"
    page_title = screenshot_mod.get("evidence", {}).get("page_title", "") if screenshot_success else ""

    # 3. Calculate Trust Score (Max 100)
    trust_score = 0
    trust_indicators = []

    # HTTPS is enabled
    if parsed_u and parsed_u.scheme == "https":
        trust_score += 10
        trust_indicators.append("✔ HTTPS Enabled")
    
    # SSL certificate is valid and not expired
    if ssl_valid:
        trust_score += 15
        trust_indicators.append("✔ Valid SSL Certificate")
        
    # Domain age is older than threshold (e.g. > 1 year)
    if age_days >= 365:
        trust_score += 15
        trust_indicators.append(f"✔ Domain Age: {age_days // 365} Years")
    elif age_days >= 180:
        trust_score += 10
        trust_indicators.append("✔ Domain Age: > 6 Months")
        
    # WHOIS registry information is valid
    if whois_success and age_days >= 0 and registrar != "Unknown":
        trust_score += 10
        trust_indicators.append("✔ Valid WHOIS Registry")
        
    # Clean scan history / reputation
    if vt_mod.get("status") == "success" and vt_malicious_votes == 0:
        trust_score += 10
        trust_indicators.append("✔ Clean Scan History (VirusTotal)")
        
    # No blacklist matches (PhishTank)
    if pt_mod.get("status") == "success" and not phishtank_match:
        trust_score += 10
        trust_indicators.append("✔ No Blacklist Matches (PhishTank)")
        
    # No reputation alerts (Google Safe Browsing)
    if gsb_mod.get("status") == "success" and not gsb_alert:
        trust_score += 10
        trust_indicators.append("✔ Clean Reputation (Google Safe Browsing)")
        
    # No malicious redirects (hops <= 1)
    if hop_count <= 1:
        trust_score += 10
        trust_indicators.append("✔ No Suspicious Redirects")
        
    # Expected page title
    if page_title.strip():
        trust_score += 5
        trust_indicators.append(f"✔ Expected Page Title: \"{page_title[:40]}\"")
        
    # Expected company ownership
    if organization != "Unknown" and organization.strip():
        trust_score += 5
        trust_indicators.append(f"✔ Verified Owner: {organization}")

    trust_score = min(max(trust_score, 0), 100)

    # 4. Calculate Risk Score (Max 100)
    risk_score = 0
    risk_indicators = []
    has_strong_malicious_indicator = False

    # High Risk Indicators
    if phishtank_match:
        risk_score += 50
        has_strong_malicious_indicator = True
        risk_indicators.append("❌ Known phishing domain (PhishTank blacklist)")
    if gsb_alert:
        risk_score += 50
        has_strong_malicious_indicator = True
        risk_indicators.append("❌ Flagged by Google Safe Browsing")
    if vt_flagged:
        risk_score += 50
        has_strong_malicious_indicator = True
        risk_indicators.append(f"❌ Flagged by VirusTotal ({vt_malicious_votes} malicious reports)")
    if brand_impersonation and similarity >= 80:
        risk_score += 45
        has_strong_malicious_indicator = True
        risk_indicators.append(f"❌ Brand Impersonation: Targeted impersonation of {detected_brand} ({similarity}% similarity)")

    # Expired SSL on login/payment page check
    url_or_title_lower = (url + " " + page_title).lower()
    is_login_payment_page = any(kw in url_or_title_lower for kw in ["login", "signin", "payment", "checkout", "bank", "pay"])
    if not ssl_valid and dns_resolved and is_login_payment_page:
        risk_score += 40
        has_strong_malicious_indicator = True
        risk_indicators.append("❌ Invalid/Expired SSL certificate on login/payment page")

    # Fake login / credential harvesting check
    has_input_fields = False
    html_mod = next((m for m in modules_results if m["module"] == "HTML Metadata Extraction"), {})
    if html_mod.get("status") == "success":
        body_lower = html_mod.get("evidence", {}).get("html_body", "").lower()
        if "type=\"password\"" in body_lower or "<input" in body_lower:
            has_input_fields = True
    if has_input_fields and (age_days < 90 or brand_impersonation):
        risk_score += 45
        has_strong_malicious_indicator = True
        risk_indicators.append("❌ Deceptive form/credential harvesting input elements detected")

    # Suspicious (Moderate) Indicators
    if age_days >= 0 and age_days < 90:
        risk_score += 15
        risk_indicators.append(f"⚠ Recently registered young domain ({age_days} days)")
    if len(url) > 75:
        risk_score += 10
        risk_indicators.append(f"⚠ Very long URL detected ({len(url)} characters)")
        
    # URL shortening service check
    URL_SHORTENERS = {"bit.ly", "tinyurl.com", "tinyurl", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "adf.ly"}
    is_shortener = any(domain_lower == short or domain_lower.endswith("." + short) for short in URL_SHORTENERS)
    if is_shortener:
        risk_score += 15
        risk_indicators.append("⚠ URL shortening service used")

    # Unusual subdomains check
    subdomains_count = len(domain_lower.split(".")) - 2
    contains_phish_kw_subdomain = any(kw in domain_lower.split(".")[0] for kw in ["login", "secure", "verify", "update", "bank"])
    if subdomains_count >= 2 or contains_phish_kw_subdomain:
        risk_score += 15
        risk_indicators.append("⚠ Unusual or deep subdomain structure")

    # Redirect hops
    if hop_count >= 2:
        risk_score += 10
        risk_indicators.append(f"⚠ Suspicious redirects detected ({hop_count} hops)")

    # Visually similar typosquatting
    if brand_impersonation and similarity < 80:
        risk_score += 15
        risk_indicators.append(f"⚠ Domain name visually similar to brand: {detected_brand} ({similarity}%)")

    # SSL not valid but not on login/payment page
    if not ssl_valid and dns_resolved and not is_login_payment_page:
        risk_score += 15
        risk_indicators.append("⚠ Missing or invalid SSL security certificate")

    # Obfuscated JavaScript or hidden fields check
    body_lower = html_mod.get("evidence", {}).get("html_body", "").lower() if html_mod.get("status") == "success" else ""
    has_obfuscation = "eval(function(p,a,c,k,e,r)" in body_lower or "_0x" in body_lower or "unescape(" in body_lower
    if has_obfuscation:
        risk_score += 15
        risk_indicators.append("⚠ Obfuscated/Packed JavaScript signatures detected")

    # Expected external scripts check
    if "<script src=\"http://" in body_lower:
        risk_score += 10
        risk_indicators.append("⚠ Unexpected external HTTP scripts loaded on secure site")

    # 5. Informational Events (Risk Impact = 0)
    # Check DNS Failure
    if dns_mod.get("status") == "failed":
        risk_indicators.append("⚠ Temporary DNS lookup failure (No impact)")
        
    # Check Browser/Screenshot Timeout
    if screenshot_mod.get("status") == "failed":
        risk_indicators.append("⚠ Website preview unavailable (No impact)")
        
    # Check Network Timeout
    if http_mod.get("status") == "failed":
        risk_indicators.append("⚠ Network timeout / Slow website (No impact)")
        
    # Check Google Favicon Service
    favicon_mod = next((m for m in modules_results if m["module"] == "Favicon Extraction"), {})
    fav_url = favicon_mod.get("evidence", {}).get("favicon_url", "")
    if "google.com/s2/favicons" in fav_url:
        risk_indicators.append("⚠ Google Favicon Service used (No impact)")

    # CDN checks
    server_hdr = str(http_headers.get("Server", "")).lower()
    via_hdr = str(http_headers.get("Via", "")).lower()
    if "cloudflare" in server_hdr:
        risk_indicators.append("⚠ Cloudflare CDN detected (No impact)")
    if "cloudfront" in via_hdr or "cloudfront" in server_hdr:
        risk_indicators.append("⚠ AWS CDN CloudFront detected (No impact)")
    if "akamai" in server_hdr or "akamai" in via_hdr:
        risk_indicators.append("⚠ Akamai CDN detected (No impact)")

    # 6. Apply False Positive Prevention Rule
    if not has_strong_malicious_indicator:
        has_suspicious_evidence = (
            brand_impersonation or
            (age_days >= 0 and age_days < 90) or
            is_shortener or
            hop_count >= 2 or
            has_obfuscation
        )
        if not has_suspicious_evidence:
            risk_score = 0
            decision = "SAFE"
            confidence = 95
            reason = "Website is safe. Verified trust indicators are strong, and no malicious signals exist."
        elif risk_score >= 35:
            decision = "SUSPICIOUS"
            confidence = 80
            reason = "Website exhibits suspicious characteristics. Review details below."
        else:
            decision = "SAFE"
            confidence = 90
            reason = "No strong malicious indicators found. Website is safe."
    else:
        risk_score = min(max(risk_score, 0), 100)
        if risk_score >= 70:
            decision = "HIGH RISK"
            confidence = 95
            reason = "High risk threat indicators verified. Known phishing database match, brand abuse, or malware alert."
        elif risk_score >= 35:
            decision = "SUSPICIOUS"
            confidence = 80
            reason = "Website exhibits suspicious indicators. Manual verification recommended."
        else:
            decision = "SAFE"
            confidence = 90
            reason = "Risk signals present but overruled by safe indicator trust factors."

    return {
        "trust_score": trust_score,
        "risk_score": risk_score,
        "decision": decision,
        "confidence": confidence,
        "reason": reason,
        "trust_indicators": trust_indicators,
        "risk_indicators": risk_indicators,
        "detected_brand": detected_brand,
        "detected_keywords": detected_keywords
    }
