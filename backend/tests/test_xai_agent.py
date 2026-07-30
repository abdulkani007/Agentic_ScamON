import json
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from agents.website_agent.main import app

client = TestClient(app)

@pytest.fixture
def sample_explain_payload():
    return {
        "language": "English",
        "website": {
            "risk_score": 96,
            "verdict": "PHISHING",
            "domain": {"name": "secure-login-bank.com", "age_days": 12, "registrar": "NameCheap"},
            "ssl": {"valid": False, "issuer": "Let's Encrypt"}
        },
        "email": {
            "risk_score": 85,
            "sender": "security-alert@paypal-update.com",
            "subject": "Urgent Action Required",
            "headers_analysis": {"spf": "FAIL", "dkim": "PASS", "dmarc": "FAIL"}
        }
    }

def test_xai_explain_endpoint(sample_explain_payload):
    response = client.post("/api/xai/explain", json=sample_explain_payload)
    assert response.status_code == 200
    data = response.json()
    assert "overall_summary" in data
    assert "overall_risk" in data
    assert "risk_contributors" in data
    assert "investigation_id" in data

def test_xai_chat_endpoint():
    payload = {
        "report": {
            "overall_summary": "Detected a bank credential harvesting campaign.",
            "overall_risk": {"risk_score": 96, "threat_level": "CRITICAL", "confidence": 95},
            "findings": {"website": ["Newly registered phishing domain."]}
        },
        "query": "Why is this risky?"
    }
    response = client.post("/api/xai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data

def test_xai_export_endpoints(sample_explain_payload):
    # First generate a report to create the database document
    resp = client.post("/api/xai/explain", json=sample_explain_payload)
    assert resp.status_code == 200
    inv_id = resp.json()["investigation_id"]

    # Test PDF download
    pdf_resp = client.get(f"/api/xai/{inv_id}/export/pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"

    # Test DOCX download
    docx_resp = client.get(f"/api/xai/{inv_id}/export/docx")
    assert docx_resp.status_code == 200
    assert docx_resp.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def test_complaints_history_endpoint():
    response = client.get("/api/history/complaints")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
