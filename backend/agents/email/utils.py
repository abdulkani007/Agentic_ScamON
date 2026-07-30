import logging
import dns.resolver
from typing import Dict, Any
from agents.website_agent.whois_checker import lookup_whois
from agents.website_agent.ssl_checker import check_ssl
from .schemas import DomainReputationInfo

logger = logging.getLogger(__name__)

def check_mx_records(domain: str) -> bool:
    """Resolves DNS MX records for the sender domain using dnspython."""
    try:
        if not domain or domain.lower() in ("localhost", "127.0.0.1", "me"):
            return True
        
        logger.debug(f"Checking DNS MX records for domain: {domain}")
        # Resolve MX records
        answers = dns.resolver.resolve(domain, "MX")
        return len(answers) > 0
    except Exception as err:
        logger.warning(f"DNS MX record lookup failed for {domain}: {err}")
        return False

def get_domain_reputation(domain: str) -> DomainReputationInfo:
    """Evaluates the sender domain reputation by compiling WHOIS, SSL, and DNS MX records."""
    if not domain or domain.lower() in ("localhost", "127.0.0.1", "me"):
        return DomainReputationInfo(
            domain=domain or "unknown",
            age_days=3650,
            registrar="Localhost Registry",
            valid_ssl=True,
            ssl_issuer="Localhost CA",
            has_mx_records=True,
            reputation_score=0
        )

    # 1. WHOIS Lookup
    whois_data = lookup_whois(domain)
    age_days = whois_data.get("age_days", -1)
    registrar = whois_data.get("registrar", "Unknown")

    # 2. SSL check
    ssl_data = check_ssl(domain)
    valid_ssl = ssl_data.get("valid", False)
    ssl_issuer = ssl_data.get("issuer", "Unknown")

    # 3. DNS MX check
    has_mx = check_mx_records(domain)

    # Calculate Reputation Score (0 to 100)
    score = 0

    # Critical indicator: No MX records on email domain is extremely high risk (likely spoofed/fake domain)
    if not has_mx:
        score += 55
        
    # Young domain check
    if age_days != -1 and age_days < 90:
        score += 25
    elif age_days == -1:
        # Unknown domain age is slightly suspicious
        score += 10

    # SSL validation failures
    if not valid_ssl:
        score += 20

    # Unregistered/Unknown Registrar
    if registrar == "Unknown":
        score += 10

    reputation_score = min(max(score, 0), 100)

    return DomainReputationInfo(
        domain=domain,
        age_days=age_days if age_days != -1 else 0,
        registrar=registrar,
        valid_ssl=valid_ssl,
        ssl_issuer=ssl_issuer,
        has_mx_records=has_mx,
        reputation_score=reputation_score
    )
