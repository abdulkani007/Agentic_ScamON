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
def sample_web_evidence():
    return {
        "url": "https://secure-login-bank.com",
        "domain": {"name": "secure-login-bank.com"},
        "risk_score": 85,
        "verdict": "PHISHING"
    }

def test_create_case_endpoint():
    response = client.post("/api/evidence/cases")
    assert response.status_code == 201
    data = response.json()
    assert "case_id" in data
    assert data["status"] == "Open"

def test_add_evidence_endpoint(sample_web_evidence):
    # First create a case ID
    res = client.post("/api/evidence/cases")
    assert res.status_code == 201
    case_id = res.json()["case_id"]

    # Post evidence
    payload = {
        "case_id": case_id,
        "agent_source": "website",
        "evidence_data": sample_web_evidence
    }
    response = client.post("/api/evidence/add", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == case_id
    assert "website" in data["evidence"]
    assert data["overall_risk_score"] == 85
    assert data["overall_threat_level"] == "CRITICAL"

def test_list_cases_endpoint():
    response = client.get("/api/evidence/cases")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_update_status_endpoint():
    # Create case
    res = client.post("/api/evidence/cases")
    assert res.status_code == 201
    case_id = res.json()["case_id"]

    # Update status
    status_payload = {"status": "Closed"}
    response = client.post(f"/api/evidence/cases/{case_id}/status", json=status_payload)
    assert response.status_code == 200
    assert response.json()["message"] == "Case status updated to Closed."

def test_export_endpoints(sample_web_evidence):
    # Create case and add evidence
    res = client.post("/api/evidence/cases")
    assert res.status_code == 201
    case_id = res.json()["case_id"]

    payload = {
        "case_id": case_id,
        "agent_source": "website",
        "evidence_data": sample_web_evidence
    }
    client.post("/api/evidence/add", json=payload)

    # Test PDF download
    pdf_resp = client.get(f"/api/evidence/cases/{case_id}/export/pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"

    # Test DOCX download
    docx_resp = client.get(f"/api/evidence/cases/{case_id}/export/docx")
    assert docx_resp.status_code == 200
    assert docx_resp.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    # Test ZIP download
    zip_resp = client.get(f"/api/evidence/cases/{case_id}/export/zip")
    assert zip_resp.status_code == 200
    assert zip_resp.headers["content-type"] == "application/x-zip-compressed"

    # Test deletion
    del_resp = client.delete(f"/api/evidence/cases/{case_id}")
    assert del_resp.status_code == 200
