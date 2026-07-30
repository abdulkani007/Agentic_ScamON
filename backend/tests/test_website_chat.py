from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from agents.website_agent.main import app

client = TestClient(app)

def test_chat_endpoint_refusal():
    # Test unrelated question refusal
    payload = {
        "report": {
            "url": "https://sbi-verify.com",
            "risk_score": 95,
            "threat_type": "Phishing",
            "domain": {
                "name": "sbi-verify.com",
                "age_days": 2,
                "registrar": "NameCheap Inc"
            },
            "ssl": {
                "valid": False,
                "issuer": "N/A",
                "expiry": "N/A"
            },
            "typosquat": {
                "detected": True,
                "original_brand": "sbi.co.in",
                "similarity": 85
            },
            "phishtank": {
                "known_phishing": True
            },
            "entities": {
                "organization": "Unknown",
                "domain": "sbi-verify.com",
                "timestamp": "2026-07-29"
            },
            "recommendation": "Do not enter passwords.",
            "investigation_id": "test-uuid-123",
            "timestamp": "2026-07-29T09:00:00",
            "redirect_history": ["https://sbi-verify.com"],
            "security_headers": {},
            "html_metadata": {},
            "ai_reasoning": {
                "summary": "This site impersonates SBI Bank.",
                "threat_category": "Phishing",
                "confidence_rating": 97,
                "final_decision": "HIGH RISK",
                "reasoning_steps": ["Domain created 2 days ago", "PhishTank matches"],
                "recommended_action": "Block Website"
            },
            "memory_history": {
                "has_history": False
            },
            "timeline": [],
            "mission_status": "HIGH RISK",
            "investigation_modules": []
        },
        "message": "What is the capital of France?",
        "history": []
    }
    
    response = client.post("/api/websites/chat", json=payload)
    assert response.status_code == 200
    assert "I can only answer questions related to the website currently being analyzed." in response.text


def test_chat_endpoint_valid_question():
    # Test a valid question about the website
    payload = {
        "report": {
            "url": "https://sbi-verify.com",
            "risk_score": 95,
            "threat_type": "Phishing",
            "domain": {
                "name": "sbi-verify.com",
                "age_days": 2,
                "registrar": "NameCheap Inc"
            },
            "ssl": {
                "valid": False,
                "issuer": "N/A",
                "expiry": "N/A"
            },
            "typosquat": {
                "detected": True,
                "original_brand": "sbi.co.in",
                "similarity": 85
            },
            "phishtank": {
                "known_phishing": True
            },
            "entities": {
                "organization": "Unknown",
                "domain": "sbi-verify.com",
                "timestamp": "2026-07-29"
            },
            "recommendation": "Do not enter passwords.",
            "investigation_id": "test-uuid-123",
            "timestamp": "2026-07-29T09:00:00",
            "redirect_history": ["https://sbi-verify.com"],
            "security_headers": {},
            "html_metadata": {},
            "ai_reasoning": {
                "summary": "This site impersonates SBI Bank.",
                "threat_category": "Phishing",
                "confidence_rating": 97,
                "final_decision": "HIGH RISK",
                "reasoning_steps": ["Domain created 2 days ago", "PhishTank matches"],
                "recommended_action": "Block Website"
            },
            "memory_history": {
                "has_history": False
            },
            "timeline": [],
            "mission_status": "HIGH RISK",
            "investigation_modules": []
        },
        "message": "Is this website safe?",
        "history": []
    }
    
    response = client.post("/api/websites/chat", json=payload)
    assert response.status_code == 200
    content = response.text
    assert len(content) > 0
    # Response should have structured format
    assert "Summary" in content or "Reason" in content or "Evidence" in content
