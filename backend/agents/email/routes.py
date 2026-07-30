import logging
import os
import json
import requests
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from typing import List, Dict, Any

from .schemas import (
    EmailConnectResponse,
    EmailFetchRequest,
    EmailSummary,
    EmailAnalysisRequest,
    EmailAnalysisResult
)
from .gmail_auth import (
    is_connected,
    get_authorization_url,
    exchange_code_for_token
)
from .gmail_service import (
    get_profile_email,
    fetch_latest_emails,
    fetch_email_details
)
from .header_analyzer import analyze_headers, extract_domain_from_email
from .link_extractor import extract_urls_from_content, analyze_extracted_links
from .attachment_analyzer import analyze_attachment
from .utils import get_domain_reputation
from .email_agent import run_email_llm_analysis
from .risk_engine import map_llm_risk, calculate_composite_risk, determine_threat_level

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Email Investigation Agent"])

# In-memory store to verify OAuth state and map callback redirects
OAUTH_STATES = {}

@router.post("/api/email/connect", response_model=EmailConnectResponse)
async def api_email_connect(req: Request) -> EmailConnectResponse:
    """Checks Gmail connection status, returning active email or the Google OAuth auth URL."""
    try:
        if is_connected():
            email_addr = get_profile_email()
            return EmailConnectResponse(connected=True, email_address=email_addr)
        
        # Build dynamic redirect URI matching the requested server host/port
        env_redirect_uri = os.getenv("GMAIL_REDIRECT_URI")
        if env_redirect_uri:
            redirect_uri = env_redirect_uri
        else:
            host = req.headers.get("host") or "localhost:8001"
            if host.startswith("127.0.0.1"):
                host = host.replace("127.0.0.1", "localhost", 1)
            redirect_uri = f"http://{host}/email/callback"
        
        auth_url, state, verifier = get_authorization_url(redirect_uri)
        OAUTH_STATES[state] = {
            "redirect_uri": redirect_uri,
            "code_verifier": verifier
        }
        
        return EmailConnectResponse(
            connected=False,
            auth_url=auth_url,
            email_address=None
        )
    except Exception as err:
      logger.error(f"Failed to initialize email authentication: {err}")
      raise HTTPException(
          status_code=500,
          detail=f"Failed to start Google OAuth flow: {str(err)}"
      )

@router.get("/email/callback", response_class=HTMLResponse)
async def oauth_callback(code: str, state: str) -> HTMLResponse:
    """Receives redirected Google auth code, finishes credentials flow, and closes popup."""
    env_redirect_uri = os.getenv("GMAIL_REDIRECT_URI")
    fallback_uri = env_redirect_uri or "http://localhost:8001/email/callback"
    
    state_data = OAUTH_STATES.pop(state, None)
    if isinstance(state_data, dict):
        redirect_uri = state_data.get("redirect_uri", fallback_uri)
        code_verifier = state_data.get("code_verifier")
    else:
        redirect_uri = state_data or fallback_uri
        code_verifier = None
        
    try:
        exchange_code_for_token(code, state, redirect_uri, code_verifier)
        return HTMLResponse(
            content="""
            <html>
                <head>
                    <title>Gmail Connected Successful</title>
                    <style>
                        body {
                            background-color: #05070a;
                            color: #00E676;
                            font-family: 'Courier New', Courier, monospace;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            text-align: center;
                        }
                        .box {
                            border: 1px solid #00E676;
                            padding: 30px;
                            background: rgba(0, 230, 118, 0.02);
                            box-shadow: 0 0 15px rgba(0, 230, 118, 0.2);
                        }
                        .spinner {
                            margin-top: 15px;
                            color: #888;
                            font-size: 11px;
                        }
                    </style>
                    <script>
                        setTimeout(function() {
                            window.close();
                        }, 2500);
                    </script>
                </head>
                <body>
                    <div class="box">
                        <h2>[✓] GMAIL AUTHENTICATION SUCCESSFUL</h2>
                        <p>ScamON AI Email Agent is now successfully connected.</p>
                        <div class="spinner">This window will close automatically...</div>
                    </div>
                </body>
            </html>
            """
        )
    except Exception as err:
        logger.error(f"Error handling Google OAuth callback code exchange: {err}")
        return HTMLResponse(
            content=f"""
            <html>
                <body style="background-color: #05070a; color: #FF3D00; font-family: monospace; padding: 40px;">
                    <h2>[⚠] GOOGLE OAUTH CALLBACK FAILURE</h2>
                    <p>Failed to exchange code for credential token: {str(err)}</p>
                </body>
            </html>
            """,
            status_code=500
        )

@router.post("/api/email/fetch", response_model=List[EmailSummary])
async def api_fetch_emails(req: EmailFetchRequest) -> List[EmailSummary]:
    """Fetches list of latest emails from the connected Gmail inbox."""
    if not is_connected():
        raise HTTPException(
            status_code=401,
            detail="Gmail account is not connected. Please complete authentication flow first."
        )
    try:
        return fetch_latest_emails(filter_type=req.filter_type, limit=req.limit)
    except Exception as err:
        logger.error(f"Error fetching Gmail messages: {err}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Gmail emails: {str(err)}"
        )

@router.post("/api/email/analyze", response_model=EmailAnalysisResult)
async def api_analyze_email(req: EmailAnalysisRequest) -> EmailAnalysisResult:
    """Performs full SOC investigation on a specific email message."""
    if not is_connected():
        raise HTTPException(
            status_code=401,
            detail="Gmail account is not connected. Authenticate to execute scan."
        )
    try:
        # 1. Fetch full message details
        details = fetch_email_details(req.message_id)
        
        # 2. Analyze headers SPF/DKIM/DMARC
        header_report = analyze_headers(details.headers)
        
        # 3. Analyze sender domain reputation
        from_domain = extract_domain_from_email(details.sender)
        domain_report = get_domain_reputation(from_domain)
        
        # 4. Extract and check URLs
        extracted_urls = extract_urls_from_content(details.body_text, details.body_html)
        links_report = await analyze_extracted_links(extracted_urls)
        
        # 5. Audit attachments risk
        attachments_report = []
        for att in details.attachments:
            attachments_report.append(analyze_attachment(att))

        # 6. Call Groq AI classification model
        headers_summary = {
            "spf": header_report.spf,
            "dkim": header_report.dkim,
            "dmarc": header_report.dmarc,
            "risk_score": header_report.risk_score
        }
        links_summary = [{"url": l.url, "risk_score": l.risk_score, "decision": l.decision} for l in links_report]
        attachments_summary = [{"filename": a.filename, "risk_score": a.risk_score} for a in attachments_report]
        
        llm_res = run_email_llm_analysis(
            subject=details.subject,
            sender=details.sender,
            receiver=details.receiver,
            snippet=details.snippet,
            body_text=details.body_text,
            headers_summary=headers_summary,
            links_summary=links_summary,
            attachments_summary=attachments_summary
        )

        # 7. Compile composite risk indicators
        max_link_risk = max([l.risk_score for l in links_report]) if links_report else 0
        max_att_risk = max([a.risk_score for a in attachments_report]) if attachments_report else 0
        llm_mapped_risk = map_llm_risk(llm_res.get("classification", "Safe"), llm_res.get("confidence", 0))

        composite_score = calculate_composite_risk(
            header_score=header_report.risk_score,
            domain_score=domain_report.reputation_score,
            website_score=max_link_risk,
            attachment_score=max_att_risk,
            llm_score=llm_mapped_risk
        )
        
        threat_level = determine_threat_level(composite_score)

        res_obj = EmailAnalysisResult(
            message_id=req.message_id,
            subject=details.subject,
            sender=details.sender,
            receiver=details.receiver,
            date=details.date,
            snippet=details.snippet,
            headers_analysis=header_report,
            links_analysis=links_report,
            attachments_analysis=attachments_report,
            domain_reputation=domain_report,
            llm_classification=llm_res.get("classification", "Safe"),
            llm_reasoning=llm_res.get("reasoning", "No threat detected."),
            risk_score=composite_score,
            threat_level=threat_level
        )

        try:
            from agents.history_helper import save_investigation
            save_investigation(
                agent_type="email",
                investigation_id=res_obj.message_id,
                risk_score=res_obj.risk_score,
                threat_level=res_obj.threat_level,
                input_data=res_obj.subject,
                summary=res_obj.llm_reasoning,
                full_report=res_obj.model_dump(),
                recommendation="Review the details of authentication headers and links scan before taking actions."
            )
        except Exception as history_err:
            logger.warning(f"Failed to save email scan to history: {history_err}")

        return res_obj

    except Exception as err:
        logger.error(f"Email SOC analysis pipeline failed for message {req.message_id}: {err}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Email analysis pipeline error: {str(err)}"
        )


from pydantic import BaseModel

class EmailChatMessage(BaseModel):
    role: str
    content: str

class EmailChatRequest(BaseModel):
    report: Dict[str, Any]
    message: str
    history: List[EmailChatMessage]

def compile_email_assistant_context(report: Dict[str, Any]) -> str:
    subject = report.get("subject", "N/A")
    sender = report.get("sender", "N/A")
    receiver = report.get("receiver", "N/A")
    date = report.get("date", "N/A")
    body = report.get("body", "N/A")
    
    headers_analysis = report.get("headers_analysis", {})
    spf = headers_analysis.get("spf", "N/A")
    dkim = headers_analysis.get("dkim", "N/A")
    dmarc = headers_analysis.get("dmarc", "N/A")
    mismatch_from_return_path = headers_analysis.get("mismatch_from_return_path", False)
    mismatch_from_reply_to = headers_analysis.get("mismatch_from_reply_to", False)
    received_hops = headers_analysis.get("received_hops", 0)
    
    domain_reputation = report.get("domain_reputation", {})
    domain = domain_reputation.get("domain", "N/A")
    age_days = domain_reputation.get("age_days", "N/A")
    registrar = domain_reputation.get("registrar", "N/A")
    valid_ssl = domain_reputation.get("valid_ssl", False)
    has_mx_records = domain_reputation.get("has_mx_records", False)
    
    links_analysis = report.get("links_analysis", [])
    attachments_analysis = report.get("attachments_analysis", [])
    
    llm_classification = report.get("llm_classification", "N/A")
    threat_level = report.get("threat_level", "N/A")
    risk_score = report.get("risk_score", "N/A")
    llm_reasoning = report.get("llm_reasoning", "N/A")
    
    ctx = f"""Email Forensics Investigation Report:
- Subject: {subject}
- Sender: {sender}
- Receiver: {receiver}
- Date: {date}
- Threat Verdict: {llm_classification}
- Threat Level: {threat_level}
- Composite Risk Score: {risk_score}/100
- AI Reasoning: {llm_reasoning}

Authentication Header Security:
- SPF Check: {spf}
- DKIM Check: {dkim}
- DMARC Check: {dmarc}
- From/Return-Path Mismatch: {mismatch_from_return_path}
- From/Reply-To Mismatch: {mismatch_from_reply_to}
- Received Mail Hops: {received_hops}

Sender Domain Reputation:
- Domain: {domain}
- Domain Age: {age_days} days
- Registrar: {registrar}
- Valid SSL: {valid_ssl}
- Active Mail Exchange (MX) Records: {has_mx_records}

Extracted Body Links Scan:
"""
    if links_analysis:
        for idx, link in enumerate(links_analysis):
            ctx += f"  {idx + 1}. URL: {link.get('url', 'N/A')} | Domain: {link.get('domain', 'N/A')} | Risk: {link.get('risk_score', 'N/A')} | Verdict: {link.get('decision', 'N/A')}\n"
    else:
        ctx += "  None detected.\n"
        
    ctx += "\nAttachments Security Scan:\n"
    if attachments_analysis:
        for idx, att in enumerate(attachments_analysis):
            ctx += f"  {idx + 1}. Filename: {att.get('filename', 'N/A')} | Size: {att.get('size_bytes', 0)} bytes | Risk Score: {att.get('risk_score', 0)} | Cause: {att.get('reason', 'N/A')}\n"
    else:
        ctx += "  None detected.\n"
        
    ctx += f"\nEmail Body Text Payload:\n{body}\n"
    return ctx

def get_email_assistant_stream(messages: List[Dict[str, Any]]):
    from .email_agent import GROQ_API_URL, GROQ_API_KEY
    if not GROQ_API_KEY:
        yield "Error: GROQ_API_KEY is not configured in the backend environment."
        return
        
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    
    body = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "temperature": 0.1,
        "stream": True,
        "max_tokens": 1200,
    }
    
    try:
        response = requests.post(GROQ_API_URL, headers=headers, json=body, stream=True, timeout=10)
        response.raise_for_status()
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]
                    if data_str.strip() == '[DONE]':
                        break
                    try:
                        data = json.loads(data_str)
                        content = data['choices'][0]['delta'].get('content', '')
                        if content:
                            yield content
                    except Exception:
                        pass
    except Exception as e:
        logger.error(f"Error in Groq email assistant chat stream: {e}")
        yield f"Error communicating with AI service: {str(e)}"

@router.post(
    "/api/email/chat",
    summary="Streams answers about the currently analyzed email based on the investigation report.",
    tags=["Email Investigation Agent"]
)
async def api_email_chat(payload: EmailChatRequest):
    # 1. Compile context
    report_context = compile_email_assistant_context(payload.report)
    
    # 2. Formulate system prompt
    system_prompt = f"""You are the 🤖 ScamON AI Email Security Assistant, an expert SOC (Security Operations Center) analyst helping the user understand whether an email is safe or malicious.
Your ONLY role is to answer questions about the email currently under investigation.
You must use the Email Forensics Investigation Report below as your sole source of truth.

Email Forensics Investigation Report:
{report_context}

CRITICAL RULES:
1. Every response MUST strictly be formatted into the following four sections (use markdown headings):
   ### Summary
   [Provide a clear, direct answer to the user's question, explaining the situation]
   
   ### Evidence
   [List the specific evidence from the investigation report supporting your answer as bullet points. If there is no evidence for a particular point, do not list it]
   
   ### Risk Level
   [State the composite risk score and threat level from the report, e.g. "Low Threat (20/100)" or "Critical Threat (95/100)"]
   
   ### Recommendation
   [Provide actionable, step-by-step security recommendations for the user based on the evidence]

2. NEVER hallucinate. You must ONLY use the provided report, header analysis, website scan, attachment analysis, risk engine, and LLM analysis results. If the report/investigation does not contain enough information to answer a question, you must respond EXACTLY with:
"I don't have enough evidence from the current investigation to answer that confidently."

3. OUT OF SCOPE QUESTIONS: If the user asks general knowledge questions, hobbies, scripting, jokes, unrelated people, or anything not directly related to the currently investigated email, you MUST respond EXACTLY with:
"I am ScamON AI Email Security Assistant.
I can only answer questions related to the currently investigated email.
Please ask about the sender, headers, links, attachments, authentication results, phishing indicators, or security recommendations."
"""
    
    # 3. Build messages list including system prompt and conversational memory
    messages = [{"role": "system", "content": system_prompt}]
    
    # Append conversation history
    for msg in payload.history:
        messages.append({"role": msg.role, "content": msg.content})
        
    # Append the current message
    messages.append({"role": "user", "content": payload.message})
    
    return StreamingResponse(get_email_assistant_stream(messages), media_type="text/plain")
