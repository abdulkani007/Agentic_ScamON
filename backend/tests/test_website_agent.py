from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from agents.website_agent.main import app
from agents.website_agent.risk_engine import calculate_risk_score
from agents.website_agent.typosquat_checker import check_typosquatting

client = TestClient(app)


def test_website_agent_health():
    """Verify that Agent 4 root health endpoint is operational."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Website & QR Verification Agent" in response.json()["service"]


def test_typosquatting_detection():
    """Verify brand similarity calculations identify trusted vs typosquatted domains."""
    # Trusted original brand
    res_trusted = check_typosquatting("google.com")
    assert res_trusted["detected"] is False
    assert res_trusted["similarity"] == 100

    # Slight typosquat variant (high similarity)
    res_typo = check_typosquatting("goog1e.com")
    assert res_typo["detected"] is True
    assert res_typo["original_brand"] == "Google"
    assert res_typo["similarity"] >= 78

    # Unrelated domain
    res_unrelated = check_typosquatting("myexamplewebsite.org")
    assert res_unrelated["detected"] is False


def test_risk_scoring_engine():
    """Verify that risk scores and recommendations map accurately under different threat scores."""
    # Safe Link test
    res_safe = calculate_risk_score(
        url="https://google.com",
        domain="google.com",
        whois_res={"age_days": 1000, "registrar": "GoDaddy"},
        ssl_res={"valid": True},
        typosquat_res={"detected": False, "original_brand": "Google", "similarity": 100},
        known_phishing=False,
    )
    assert res_safe["risk_score"] == 0
    assert res_safe["recommendation"] == "SAFE"

    # Phishing Threat test
    res_phish = calculate_risk_score(
        url="https://goog1e.com/verify-identity",
        domain="goog1e.com",
        whois_res={"age_days": 10, "registrar": "NameCheap"},  # Young domain
        ssl_res={"valid": False},  # Invalid SSL
        typosquat_res={"detected": True, "original_brand": "Google", "similarity": 90},
        known_phishing=True,  # Matches PhishTank
    )
    # PhishTank(40) + Brand(35) + SSL(15) + Young(20) = 110 (clamped to 100)
    assert res_phish["risk_score"] == 100
    assert res_phish["recommendation"] == "BLOCK IMMEDIATELY"


@patch("agents.website_agent.investigation_coordinator.lookup_whois")
@patch("agents.website_agent.investigation_coordinator.check_ssl")
@patch("agents.website_agent.investigation_coordinator.check_phishtank")
@patch("agents.website_agent.investigation_coordinator.capture_screenshot")
@patch("agents.website_agent.routes.run_llm_reasoning")
@patch("agents.website_agent.investigation_coordinator.socket.gethostbyname_ex")
def test_website_analysis_endpoint(mock_dns, mock_llm, mock_screenshot, mock_phish, mock_ssl, mock_whois):
    """Verify POST /website-analysis routing maps results correctly with mocked checkers."""
    mock_dns.return_value = ("goog1e.com", [], ["142.250.190.46"])
    mock_whois.return_value = {
        "name": "goog1e.com",
        "age_days": 12,
        "registrar": "NameCheap Inc",
        "organization": "Unknown",
        "creation_date": "2026-07-16T00:00:00",
        "expiry_date": None,
        "country": "US",
    }
    mock_ssl.return_value = {
        "valid": False,
        "issuer": "Sectigo",
        "expiry": None,
    }
    mock_phish.return_value = False
    mock_screenshot.return_value = {
        "success": True,
        "screenshot_url": "/static/screenshots/mock.png",
        "page_title": "Google",
        "favicon_url": "https://www.google.com/favicon.ico",
        "http_status": 200,
        "screenshot_time": "2026-07-28 10:00:00 UTC",
        "screenshot_resolution": "1280x800",
        "error_reason": None,
    }
    mock_llm.return_value = {
        "summary": "Highly suspicious typosquatted domain targeting Google brand properties.",
        "threat_category": "Brand Impersonation / Phishing Campaign",
        "confidence_rating": 85,
        "final_decision": "HIGH RISK",
        "reasoning_steps": [
            "The domain targets Google brand name using typosquatting.",
            "SSL certificate is missing or invalid."
        ],
        "recommended_action": "Do Not Enter Credentials"
    }

    response = client.post("/website-analysis", data={"url": "goog1e.com"})
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "success"
    assert data["source"] == "URL"
    assert data["risk_score"] == 75
    assert data["typosquat"]["detected"] is True
    assert data["recommendation"] == "BLOCK IMMEDIATELY"
    assert data["threat_type"] == "HIGH RISK"
    assert data["detected_brand"] == "Google"
    assert data["screenshot_url"] == "/static/screenshots/mock.png"
    assert "investigation_id" in data
    assert "security_headers" in data
    assert "redirect_history" in data
    assert data["ai_reasoning"]["confidence_rating"] == 85
    assert data["ai_reasoning"]["final_decision"] == "HIGH RISK"


@patch("agents.website_agent.protection_engine.add_to_hosts_file")
@patch("agents.website_agent.protection_engine.remove_from_hosts_file")
@patch("agents.website_agent.protection_engine.verify_hosts_blocked")
@patch("agents.website_agent.protection_engine.verify_hosts_unblocked")
def test_protection_block_unblock_endpoints(mock_unblock_verify, mock_block_verify, mock_remove, mock_add):
    """Verify POST /protection/block and /protection/unblock endpoints."""
    mock_add.return_value = None
    mock_remove.return_value = None
    mock_block_verify.return_value = True
    mock_unblock_verify.return_value = True
    
    # Clean blocklist of "phish-test.click" first if it remains from any previous runs
    client.post("/protection/unblock", json={"domain": "phish-test.click"})

    # 1. Block domain
    response = client.post("/protection/block", json={"domain": "phish-test.click"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Blocked" in data["message"]
    assert "blocked_time" in data
    assert data["blocked_by"] == "Website Investigation Agent"

    # 2. Get status
    response = client.get("/protection/status")
    assert response.status_code == 200
    status_data = response.json()
    assert status_data["status"] == "Active"
    assert "phish-test.click" in status_data["blocked_domains"]

    # 3. Get history
    response = client.get("/protection/history")
    assert response.status_code == 200
    history_data = response.json()
    assert len(history_data["history"]) > 0
    assert history_data["history"][0]["domain"] == "phish-test.click"

    # 4. Unblock domain
    response = client.post("/protection/unblock", json={"domain": "phish-test.click"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Unblocked" in data["message"]

    # 5. Get status again
    response = client.get("/protection/status")
    assert response.status_code == 200
    status_data = response.json()
    assert "phish-test.click" not in status_data["blocked_domains"]


@patch("agents.website_agent.investigation_coordinator.lookup_whois")
@patch("agents.website_agent.investigation_coordinator.check_ssl")
@patch("agents.website_agent.investigation_coordinator.check_phishtank")
@patch("agents.website_agent.investigation_coordinator.capture_screenshot")
@patch("agents.website_agent.routes.run_llm_reasoning")
@patch("agents.website_agent.investigation_coordinator.socket.gethostbyname_ex")
def test_trusted_domains_safety(mock_dns, mock_llm, mock_screenshot, mock_phish, mock_ssl, mock_whois):
    """Verify that trusted subdomains resolve as safe with risk score 0 despite WHOIS failure."""
    mock_dns.return_value = ("meet.google.com", [], ["142.250.190.46"])
    # WHOIS service is unavailable
    mock_whois.return_value = {
        "name": "meet.google.com",
        "age_days": -1,
        "registrar": "Unknown",
        "organization": "Unknown",
        "error": "WHOIS service unavailable"
    }
    mock_ssl.return_value = {
        "valid": True,
        "issuer": "Google Trust Services LLC",
        "expiry": "2026-10-10",
    }
    mock_phish.return_value = False
    mock_screenshot.return_value = {
        "success": True,
        "screenshot_url": "/static/screenshots/mock.png",
        "page_title": "Google Meet",
    }
    mock_llm.return_value = {
        "summary": "Verified safe official domain belonging to Google organization.",
        "threat_category": "None (Legitimate Service)",
        "confidence_rating": 99,
        "final_decision": "SAFE",
        "reasoning_steps": [
            "Domain belongs to trusted Google organisation.",
            "Valid SSL certificate and DNS resolved."
        ],
        "recommended_action": "Safe to browse"
    }

    response = client.post("/website-analysis", data={"url": "https://meet.google.com"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["risk_score"] == 0
    assert data["recommendation"] == "SAFE"
    assert data["threat_type"] == "Legitimate Website"




