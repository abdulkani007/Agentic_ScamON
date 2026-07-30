import json
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from agents.website_agent.main import app

client = TestClient(app)

def test_sms_analyze_endpoint():
    payload = {
        "sender": "VM-HDFCBK",
        "message": "Your account has been suspended. Click here to verify https://secure-login-hdfc.com",
        "timestamp": "2026-07-29T18:25:00"
    }
    
    response = client.post("/api/sms/analyze", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "success"
    assert "analysis" in data
    assert "sms" in data
    assert data["sms"]["sender"] == "HDFCBK"
    assert "Your account has been suspended" in data["sms"]["message"]
    
    # Check that risk score is parsed and direct compatible field is set
    assert "risk_score" in data
    assert isinstance(data["risk_score"], int)
