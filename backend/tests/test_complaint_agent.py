import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from agents.website_agent.main import app

client = TestClient(app)

@pytest.fixture
def mock_website_report():
    return {
        "url": "https://suspicious-verify-secure.com",
        "domain": {
            "name": "suspicious-verify-secure.com",
            "age_days": 15
        },
        "risk_score": 85,
        "verdict": "PHISHING",
        "threat_type": "Phishing Link",
        "recommendation": "This website is highly likely to be phishing. Blocking is strongly recommended.",
        "ai_reasoning": {
            "summary": "This site matches typosquatting patterns for a trusted financial firm.",
            "reasoning_steps": [
                "WHOIS record shows domain was registered 15 days ago.",
                "SSL certificate lacks vendor verification.",
                "Typosquatting brand matches Bank of America similarity."
            ]
        }
    }


def test_generate_complaint_endpoint(mock_website_report):
    """Verify complaint files are generated and metadata returns successfully."""
    response = client.post("/api/complaints/generate", json={"report": mock_website_report})
    assert response.status_code == 200
    data = response.json()
    assert "complaint_id" in data
    assert "subject" in data
    assert "body" in data
    assert "attachments" in data
    assert len(data["attachments"]) >= 3
    
    # Verify PDF files exist on disk in static complaints folder
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../static"))
    complaint_id = data["complaint_id"]
    for attachment in data["attachments"]:
        rel_path = attachment["path"]
        abs_path = os.path.join(static_dir, rel_path.replace("/static/", "", 1))
        assert os.path.exists(abs_path)


def test_send_complaint_endpoint():
    """Verify complaint email dispatch can be triggered with mock SMTP."""
    payload = {
        "to": "test-recipient@scamon.org",
        "cc": "test-cc@scamon.org",
        "subject": "Test Complaint Regarding Suspected Cyber Scam",
        "body": "This is a test complaint from ScamON automated test suite.",
        "attachments": []
    }
    
    # Temporarily set dummy SMTP credentials for mock verification
    with patch.dict(os.environ, {"GMAIL_USER": "test-sender@gmail.com", "GMAIL_APP_PASSWORD": "mock-app-password"}):
        with patch("smtplib.SMTP_SSL") as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value = mock_server
            
            response = client.post("/api/complaints/send", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["recipient"] == "test-recipient@scamon.org"
            
            # Verify SMTP functions were called correctly
            mock_smtp.assert_called_once_with("smtp.gmail.com", 465, timeout=12)
            mock_server.login.assert_called_once_with("test-sender@gmail.com", "mock-app-password")
            mock_server.sendmail.assert_called_once()
            mock_server.quit.assert_called_once()
