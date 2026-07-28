import pytest
from fastapi.testclient import TestClient
from agents.website_agent.main import app
from database import get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    db = get_db()
    if db is not None:
        db["blocked_websites"].delete_many({})
    yield
    if db is not None:
        db["blocked_websites"].delete_many({})

def test_api_block_website():
    payload = {
        "url": "https://testblockedsite.com/login",
        "domain": "testblockedsite.com",
        "risk_score": 95,
        "threat_type": "Phishing",
        "reason": "Phishing detection"
    }
    response = client.post("/api/websites/block", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "successfully" in data["message"] or "blocked" in data["message"].lower()

    # Block duplicate
    response2 = client.post("/api/websites/block", json=payload)
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["success"] is False
    assert "already blocked" in data2["message"]

def test_api_check_website_blocked():
    response = client.get("/api/websites/check/testblockedsite.com")
    assert response.status_code == 200
    assert response.json()["blocked"] is False

    payload = {
        "url": "https://testblockedsite.com",
        "domain": "testblockedsite.com",
        "risk_score": 95,
        "threat_type": "Phishing",
        "reason": "Phishing detection"
    }
    client.post("/api/websites/block", json=payload)

    response2 = client.get("/api/websites/check/testblockedsite.com")
    assert response2.status_code == 200
    assert response2.json()["blocked"] is True
    assert "protection list" in response2.json()["message"]

def test_api_unblock_website():
    payload = {
        "url": "https://testunblock.com",
        "domain": "testunblock.com",
        "risk_score": 90,
        "threat_type": "Malware",
        "reason": "Malware detection"
    }
    client.post("/api/websites/block", json=payload)

    response = client.post("/api/websites/unblock", json={"domain": "testunblock.com"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    response2 = client.get("/api/websites/check/testunblock.com")
    assert response2.json()["blocked"] is False

def test_api_get_blocked_websites():
    payload = {
        "url": "https://testlist.com",
        "domain": "testlist.com",
        "risk_score": 90,
        "threat_type": "Malware",
        "reason": "Malware detection"
    }
    client.post("/api/websites/block", json=payload)

    response = client.get("/api/websites/blocked")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    item = data[0]
    assert item["domain"] == "testlist.com"
    assert item["blocked"] is True

def test_pre_scan_blocked_check():
    payload = {
        "url": "https://testprescan.com",
        "domain": "testprescan.com",
        "risk_score": 98,
        "threat_type": "Phishing",
        "reason": "Phishing threat"
    }
    client.post("/api/websites/block", json=payload)

    response = client.post("/website-analysis", data={"url": "https://testprescan.com"})
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["ai_reasoning"]["final_decision"] == "BLOCKED"
    assert res_data["recommendation"] == "This website is already blocked by ScamON AI."
    assert res_data["is_blocked"] is True
