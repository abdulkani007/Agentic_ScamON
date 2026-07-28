from unittest.mock import patch
from fastapi.testclient import TestClient
from agents.call_agent.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify that root health check returns 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_call_analysis_no_input():
    """Verify that calling the endpoint without parameters returns a 400 Bad Request."""
    response = client.post("/call-analysis")
    assert response.status_code == 400
    assert (
        "Either 'audio_file' or 'transcript' must be provided."
        in response.json()["detail"]
    )


@patch("agents.call_agent.routes.run_llm_reasoning")
def test_call_analysis_transcript_only(mock_reasoning):
    """Verify transcription path when text is directly submitted."""
    mock_reasoning.return_value = {
        "summary": "Forensic test summary.",
        "threat_category": "Banking Scam",
        "confidence_rating": 95,
        "final_decision": "SCAM CONFIRMED",
        "reasoning_steps": ["Indicator 1", "Indicator 2"],
        "recommended_action": "Block Caller"
    }

    response = client.post(
        "/call-analysis", data={"transcript": "Provide the OTP code immediately."}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["agent_name"] == "Call Investigation Agent"
    assert data["risk_score"] == 98
    assert data["confidence"] == 95
    assert data["recommendation"] == "Block Caller"


@patch("agents.call_agent.routes.transcribe_audio")
@patch("agents.call_agent.routes.run_llm_reasoning")
def test_call_analysis_audio_file(mock_reasoning, mock_transcribe):
    """Verify transcription pipeline when a file is uploaded."""
    mock_transcribe.return_value = {
        "transcript": "Please click the link http://secure-login.com to verify credit card.",
        "language": "english",
        "duration": 45
    }
    mock_reasoning.return_value = {
        "summary": "Forensic audio test summary.",
        "threat_category": "Phishing Scam",
        "confidence_rating": 90,
        "final_decision": "HIGH RISK",
        "reasoning_steps": ["Indicator URL", "Indicator Verify"],
        "recommended_action": "Do Not Share OTP"
    }

    files = {"audio_file": ("test.wav", b"fake audio data bytes", "audio/wav")}
    response = client.post("/call-analysis", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["risk_score"] == 85
    assert data["confidence"] == 90
    assert "Credit Card" in data["keywords"]
    assert "Verify" in data["keywords"]
    assert "http://secure-login.com" in data["entities"]["URL"]
