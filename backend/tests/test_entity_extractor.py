from agents.call_agent.entity_extractor import extract_entities


def test_extract_entities_empty():
    """Verify that empty inputs return empty lists for all entity categories."""
    res = extract_entities("")
    assert isinstance(res, dict)
    for k, v in res.items():
        assert v == []


def test_extract_phone_numbers():
    """Verify that phone numbers with and without leading plus are matched."""
    text = "Contact support at +1-800-555-0199 or try 123-456-7890."
    entities = extract_entities(text)

    assert any("+1-800-555-0199" in p for p in entities["Phone Number"])
    assert any("123-456-7890" in p for p in entities["Phone Number"])


def test_extract_urls_and_emails():
    """Verify URLs and email addresses are extracted."""
    text = "Go to http://security-verification.com or send mail to security@paypal.com"
    entities = extract_entities(text)

    assert "http://security-verification.com" in entities["URL"]
    assert "security@paypal.com" in entities["Email"]


def test_extract_dates_and_times():
    """Verify standard date formats and timestamps are matched."""
    text = "Meeting on 2026-07-27 at 14:30 PM or July 28, 2026 at 09:00 AM"
    entities = extract_entities(text)

    assert "2026-07-27" in entities["Date"]
    assert "July 28, 2026" in entities["Date"]
    assert any("14:30" in t for t in entities["Time"])
    assert any("09:00" in t for t in entities["Time"])


def test_extract_otp_number():
    """Verify that 4-8 digit OTP codes preceded by context words are matched."""
    text = "Your verification pin is 987654 and the bank security code is 1234"
    entities = extract_entities(text)

    assert "987654" in entities["OTP Number"]
    assert "1234" in entities["OTP Number"]


def test_extract_organization_names():
    """Verify that organization names match specific indicators or predefined values."""
    text = "SBI Bank support and PayPal Support reported the incident to Federal Reserve."
    entities = extract_entities(text)

    assert any("SBI" in o for o in entities["Organization Name"])
    assert any("PayPal" in o for o in entities["Organization Name"])
