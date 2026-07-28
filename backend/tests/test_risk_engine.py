from agents.call_agent.risk_engine import calculate_risk


def test_calculate_risk_zero():
    """Verify that empty inputs result in a 0 risk score and safe recommendation."""
    res = calculate_risk([], {}, {})
    assert res["risk_score"] == 0
    assert res["confidence"] == 100
    assert res["recommendation"] == "Safe Call"


def test_calculate_risk_maximum_scam():
    """Verify that a scam text triggering all factors yields a score of 100 and correct category recommendation."""
    keywords = ["OTP"]
    entities = {
        "OTP Number": ["123456"],
        "Organization Name": ["SBI Bank"],
        "URL": ["http://sbi-alert.com"],
    }
    llm_analysis = {
        "urgency": "High",
        "pressure": "High",
        "confidence": 98,
        "scam_type": "Banking Scam",
    }
    res = calculate_risk(keywords, entities, llm_analysis)

    # 25 (OTP) + 20 (Urgency) + 20 (Pressure) + 20 (Org Name) + 15 (URL) = 100
    assert res["risk_score"] == 100
    assert res["confidence"] == 98
    assert res["recommendation"] == "Possible Banking Scam"


def test_calculate_risk_medium_suspicious():
    """Verify that partial scam triggers calculate a moderate risk score and suspicious recommendation."""
    keywords = ["Verify", "Bank"]
    entities = {"Organization Name": [" SBI "]}
    llm_analysis = {
        "urgency": "Medium",
        "pressure": "Medium",
        "confidence": 65,
        "scam_type": "Identity Theft",
    }
    res = calculate_risk(keywords, entities, llm_analysis)

    # OTP: 0, Urgency: +10, Pressure: +10, Org: +20, URL: 0 -> 40
    assert res["risk_score"] == 40
    assert res["confidence"] == 65
    assert res["recommendation"] == "Suspicious Call - Exercise Caution"
