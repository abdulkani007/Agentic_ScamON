import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from agents.website_agent.main import app

client = TestClient(app)

# A tiny valid 1x1 PNG image byte stream
MOCK_PNG = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'

def test_visual_analyze_endpoint_whatsapp():
    files = {
        "file": ("test_whatsapp_screenshot.png", MOCK_PNG, "image/png")
    }
    data = {
        "case_id": "TEST-CASE-12345"
    }

    response = client.post("/api/visual_scam/analyze", files=files, data=data)
    assert response.status_code == 200
    
    res_data = response.json()
    assert res_data["status"] == "success"
    assert res_data["image_type"] == "WhatsApp Chat"
    assert res_data["scam_category"] == "Courier Scam / Billing Fraud"
    assert res_data["risk_score"] >= 80
    assert "urls_found" in res_data
    assert "https://bill-pay-electricity.com" in res_data["urls_found"]
    assert "agents_invoked" in res_data
    assert "case_id" in res_data
    assert res_data["case_id"] == "TEST-CASE-12345"

def test_visual_analyze_endpoint_invalid_file():
    files = {
        "file": ("test_bad_file.txt", b"random text data", "text/plain")
    }
    response = client.post("/api/visual_scam/analyze", files=files)
    assert response.status_code == 400
    assert "Unsupported image format" in response.json()["detail"]
