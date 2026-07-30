import pytest
from fastapi.testclient import TestClient
from agents.website_agent.main import app
from agents.email.header_analyzer import analyze_headers
from agents.email.attachment_analyzer import analyze_attachment
from agents.email.schemas import AttachmentInfo
from agents.email.risk_engine import calculate_composite_risk, determine_threat_level

client = TestClient(app)

def test_spf_dkim_dmarc_parsing():
    headers = {
        "From": "Support <support@amazon.com>",
        "Authentication-Results": "mx.google.com; spf=pass smtp.mailfrom=support@amazon.com; dkim=fail header.i=@amazon.com; dmarc=pass",
        "Return-Path": "support@amazon.com",
        "Reply-To": "support@amazon.com",
        "Message-ID": "<msg123@amazon.com>"
    }
    report = analyze_headers(headers)
    assert report.spf == "pass"
    assert report.dkim == "fail"
    assert report.dmarc == "pass"
    assert report.mismatch_from_return_path is False
    assert report.mismatch_from_reply_to is False

def test_header_alignment_mismatch():
    headers = {
        "From": "Support <support@amazon.com>",
        "Authentication-Results": "mx.google.com; spf=pass; dkim=pass; dmarc=pass",
        "Return-Path": "attacker@scamdomain.com",
        "Reply-To": "billing@scamdomain.com",
        "Message-ID": "<msg123@amazon.com>"
    }
    report = analyze_headers(headers)
    assert report.mismatch_from_return_path is True
    assert report.mismatch_from_reply_to is True
    assert report.risk_score > 30

def test_dangerous_attachment_risk():
    att = AttachmentInfo(
        id="att123",
        filename="invoice.exe",
        mime_type="application/octet-stream",
        size_bytes=1024
    )
    report = analyze_attachment(att)
    assert report.suspicious is True
    assert report.risk_score == 95
    assert "executable" in report.reason.lower()

def test_macro_document_attachment_risk():
    att = AttachmentInfo(
        id="att456",
        filename="report.docm",
        mime_type="application/vnd.ms-word.document.macroEnabled.12",
        size_bytes=20480
    )
    report = analyze_attachment(att)
    assert report.suspicious is True
    assert report.risk_score == 85
    assert "macro" in report.reason.lower()

def test_composite_risk_engine():
    # Test safe case
    safe_score = calculate_composite_risk(
        header_score=5,
        domain_score=0,
        website_score=0,
        attachment_score=0,
        llm_score=0
    )
    assert safe_score < 15
    assert determine_threat_level(safe_score) == "Safe"

    # Test critical override case (dangerous attachment)
    crit_score = calculate_composite_risk(
        header_score=5,
        domain_score=0,
        website_score=0,
        attachment_score=95,
        llm_score=0
    )
    assert crit_score >= 85
    assert determine_threat_level(crit_score) == "Critical"

def test_api_connect_unauthorized(monkeypatch):
    # Mock is_connected to return False, guaranteeing 401 response regardless of token.json existence
    monkeypatch.setattr("agents.email.routes.is_connected", lambda: False)
    response = client.post("/api/email/fetch", json={"filter_type": "inbox", "limit": 5})
    assert response.status_code == 401
    assert "not connected" in response.json()["detail"].lower()
