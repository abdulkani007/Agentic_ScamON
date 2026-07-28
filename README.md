# ScamShield AI - Multi-Agent Cybersecurity Platform

ScamShield AI is an enterprise-grade cybersecurity threat hunting and analysis platform designed to shield organizations and individuals from social engineering threats. This workspace implements two critical modular agents:
1. **Agent 1 (Call Analysis Agent)**: Analyzes call audio recordings or scripts to identify verbal social engineering scams.
2. **Agent 4 (Website & QR Verification Agent)**: Inspects suspicious links and QR codes to detect phishing domains, typosquatting brand impersonation, invalid SSL registries, and blacklisted URLs.

---

## Workspace Structure

```
Agents/
├── backend/                   # FastAPI Backend Services
│   ├── agents/
│   │   ├── call_agent/        # Agent 1: STT, Regex Pattern Scan, & LLM Analysis
│   │   └── website_agent/     # Agent 4: WHOIS, SSL, Typosquat, & PhishTank
│   ├── tests/                 # Testing suite (24 unit tests passing)
│   ├── requirements.txt       # Combined package dependencies
│   └── README.md              # Detailed API schema reference & instructions
├── frontend/                  # React + Vite Glassmorphic Dashboard Console
│   ├── src/
│   │   ├── App.jsx            # Unified UI (Collapsible Sidebar, Call Scan, Web Scan)
│   │   └── index.css          # Dark Glassmorphism CSS Design system stylesheet
│   ├── package.json           # Frontend package dependencies
│   └── vite.config.js         # Vite configuration
└── README.md                  # Unified project guide (this file)
```

---

## Getting Started

### 1. Run the Backend Services
First, navigate to the `backend/` directory and configure the environment:
```bash
cd backend
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# Or .\venv\Scripts\activate.bat for Command Prompt
# Or source venv/Scripts/activate for Git Bash / Linux

pip install -r requirements.txt
copy .env.example .env
```
Ensure your `.env` contains your `GROQ_API_KEY`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Launch the agents in separate terminals or processes:
```bash
# Run Agent 1 (Call Analysis) on Port 8000
uvicorn agents.call_agent.main:app --port 8000 --reload

# Run Agent 4 (Website & QR Scan) on Port 8001
uvicorn agents.website_agent.main:app --port 8001 --reload
```

---

### 2. Run the React Console Dashboard
Open a new terminal window, navigate to the `frontend/` directory, and launch the development environment:
```bash
cd frontend
npm install
npm run dev
```
The React security console will run at **`http://localhost:5173`**.

---

## Verification & Testing Guide

### Running Automated Test Suite
Ensure both services behave correctly by running the `pytest` unit test package from the `backend/` directory:
```bash
# Executed with virtual environment active
pytest -v
```
All 24 test cases will pass successfully.

### Manual Scenarios
1. Open **`http://localhost:5173`** in your web browser.
2. Toggle the sidebar to choose between **Call Analysis** and **Web & QR Scan**.
3. **Call Analysis (Agent 1)**:
   - Input a scam script transcript (e.g. *"This is an urgent security notification from SBI. We detected fraudulent charges on your credit card. Please read back the OTP we sent you to cancel them."*) or upload a phone call `.wav`/`.mp3` recording.
   - Click **Initiate Threat Scan** to view the live timeline flow and risk outputs.
4. **Web & QR Scan (Agent 4)**:
   - Select the **Web & QR Scan** view.
   - Enter a suspicious typosquatted URL like `sbi-security-verify.co.in` or upload a QR code image encoding the link.
   - Click **Verify Website Link**. Watch the sequence timeline verify `QR Decode -> WHOIS -> SSL -> Typosquatting -> PhishTank` and generate a risk verdict card detailing domain age, SSL issuer, and typosquatting similarity percentage.
