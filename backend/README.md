# ScamShield AI - Backend Services (Agent 1 & Agent 4)

This repository contains the production-ready backend services for the **ScamShield AI** enterprise-grade cybersecurity platform. It includes two modular agents:
1. **Agent 1 (Call Analysis Agent)**: Analyzes call audio or transcripts for social engineering scams using OpenAI Whisper, Regex parsing, and Groq LLM reasoning.
2. **Agent 4 (Website & QR Verification Agent)**: Analyzes suspicious URLs or QR Code Images for phishing threats using WHOIS domain checks, SSL certificate handshake validations, brand similarity calculations, and PhishTank database lookups.

---

## Project Structure

```
backend/
├── agents/
│   ├── __init__.py            # Marks the folder as a package
│   ├── call_agent/            # Agent 1 (Call Analysis)
│   │   ├── __init__.py        # Marks the folder as a package
│   │   ├── main.py            # FastAPI application initialization & exception handlers
│   │   ├── routes.py          # /call-analysis API endpoint definition
│   │   ├── schemas.py         # Pydantic schemas representing request & response shapes
│   │   ├── whisper_service.py # Speech-to-text service utilizing OpenAI Whisper
│   │   ├── keyword_detector.py # Regular-expression keyword detection service
│   │   ├── entity_extractor.py # Regular-expression entity extraction service
│   │   ├── risk_engine.py     # Weighted risk scoring and recommendation engine
│   │   ├── utils.py           # Logging setup and audio file validation helpers
│   │   └── config.py          # Settings configuration class (pydantic-settings)
│   └── website_agent/         # Agent 4 (Website & QR Verification)
│       ├── __init__.py        # Marks the folder as a package
│       ├── main.py            # FastAPI app initialization, CORS, & exception handlers
│       ├── routes.py          # /website-analysis API endpoint definition
│       ├── schemas.py         # Pydantic schemas representing request & response shapes
│       ├── qr_decoder.py      # QR code image decoder (pyzbar + cv2 fallback)
│       ├── whois_checker.py   # WHOIS query service (python-whois)
│       ├── ssl_checker.py     # Socket connection port 443 SSL certificate parser
│       ├── typosquat_checker.py # Brand similarity comparisons (difflib)
│       ├── phishtank_checker.py # Online PhishTank phishing database query client
│       ├── entity_extractor.py # Entity mapping service
│       ├── risk_engine.py     # Weighted risk scoring calculation
│       ├── db.py              # Optional MongoDB Atlas threat auditor client
│       ├── utils.py           # Logging setup and URL normalization helpers
│       └── config.py          # Settings configuration class (pydantic-settings)
├── tests/                     # Pytest testing suite
│   ├── __init__.py            # Marks the folder as a package
│   ├── test_whisper_service.py # Unit tests for Whisper Speech-to-Text
│   ├── test_keyword_detector.py # Unit tests for keyword detection
│   ├── test_entity_extractor.py # Unit tests for entity extraction matching
│   ├── test_risk_engine.py    # Unit tests for Call Analysis Risk Engine
│   ├── test_routes.py         # Unit tests for Call Analysis routes
│   └── test_website_agent.py  # Unit tests for Website & QR Verification Agent
├── requirements.txt           # Core dependencies & testing framework requirements
├── README.md                  # This comprehensive documentation file
└── .env.example               # Template for configuration environment variables
```

---

## Installation Guide

### Prerequisites
- **Python**: Version 3.11.x (Stable)
- **FFmpeg**: Required by Whisper for audio file parsing

### Setup Steps

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Initialize a clean Python 3.11 virtual environment**:
   ```bash
   py -3.11 -m venv venv
   ```

3. **Activate the virtual environment**:
   - **On PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **On Windows Command Prompt**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **On Git Bash / macOS / Linux**:
     ```bash
     source venv/Scripts/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up local environment file**:
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
   Open the `.env` file and configure your settings. Add your `GROQ_API_KEY`:
   ```env
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```

---

## Run Commands

You can run both agent microservices concurrently on different ports:

### 1. Run Call Analysis Agent (Port 8000)
```bash
# Run from backend/ directory with activated virtual environment
uvicorn agents.call_agent.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive docs: `http://127.0.0.1:8000/docs`

### 2. Run Website & QR Verification Agent (Port 8001)
```bash
# Run from backend/ directory with activated virtual environment
uvicorn agents.website_agent.main:app --host 0.0.0.0 --port 8001 --reload
```
Interactive docs: `http://127.0.0.1:8001/docs`

---

## Testing Commands

We use `pytest` to execute our test suite containing 24 tests that validate all independent modules and endpoints.

To run the tests:

```bash
# Run from the backend/ directory with activated virtual environment
pytest -v
```

---

## API Documentation

### Agent 1: Call Analysis Endpoint
- **URL**: `POST /call-analysis`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `audio_file`: Optional audio file (`.mp3` or `.wav`)
  - `transcript`: Optional raw text transcript string
- **Response Shape (200 OK)**:
  ```json
  {
    "agent_name": "Call Analysis Agent",
    "status": "success",
    "risk_score": 92,
    "confidence": 97,
    "transcript": "Hello, this is a call from SBI Bank Customer Care... We detected urgent suspicious activity...",
    "keywords": ["Bank", "Verify", "Urgent"],
    "entities": {
      "Phone Number": ["+1-800-555-0199"],
      "Organization Name": ["SBI Bank Customer Care"]
    },
    "llm_analysis": {
      "urgency": "High",
      "pressure": "High",
      "confidence": 95,
      "scam_type": "Banking Scam",
      "reasoning": "The caller impersonated bank support, created urgency..."
    },
    "recommendation": "Possible Banking Scam"
  }
  ```

### Agent 4: Website & QR Verification Endpoint
- **URL**: `POST /website-analysis`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `url`: Optional raw URL string (e.g. `sbi-verify.com`)
  - `qr_image`: Optional uploaded QR image (`.png`, `.jpg`, `.jpeg`)
- **Response Shape (200 OK)**:
  ```json
  {
    "agent_name": "Website & QR Verification Agent",
    "status": "success",
    "source": "URL",
    "url": "https://goog1e.com",
    "risk_score": 50,
    "confidence": 95,
    "domain": {
      "name": "goog1e.com",
      "age_days": 12,
      "registrar": "NameCheap Inc"
    },
    "ssl": {
      "valid": false,
      "issuer": "Sectigo",
      "expiry": null
    },
    "typosquat": {
      "detected": true,
      "original_brand": "google.com",
      "similarity": 90
    },
    "phishtank": {
      "known_phishing": false
    },
    "entities": {
      "organization": "Unknown",
      "domain": "goog1e.com",
      "timestamp": "2026-07-28T09:44:00Z"
    },
    "recommendation": "Medium Risk Suspicious Website"
  }
  ```
