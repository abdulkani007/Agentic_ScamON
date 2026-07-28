from agents.call_agent.keyword_detector import detect_keywords


def test_detect_keywords_empty():
    """Verify that empty inputs return an empty list of keywords."""
    assert detect_keywords("") == []
    assert detect_keywords(None) == []


def test_detect_keywords_scam_phrase():
    """Verify that multiple risk keywords are accurately detected in a phrase."""
    text = "Urgent: Please provide the OTP for verification at SBI Bank."
    detected = detect_keywords(text)

    assert "OTP" in detected
    assert "Bank" in detected
    assert "Verify" in detected
    assert "Urgent" in detected
    assert "Debit Card" not in detected


def test_detect_keywords_case_insensitivity():
    """Verify keyword matching is case-insensitive."""
    assert "Credit Card" in detect_keywords("credit card details")
    assert "UPI" in detect_keywords("upi payment")
    assert "Account Blocked" in detect_keywords("account blocked immediately")


def test_detect_keywords_word_boundaries():
    """Verify that boundaries prevent partial matches from triggering keywords."""
    # 'kyc' inside 'skyclear' should not trigger keyword
    assert "KYC" not in detect_keywords("skyclear support services")
    # 'bank' inside 'mountebank' should not trigger keyword
    assert "Bank" not in detect_keywords("he is a mountebank actor")
