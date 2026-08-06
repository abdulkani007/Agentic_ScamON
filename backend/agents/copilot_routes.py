import json
import logging
import os
import time
import re
import asyncio
import uuid
import tempfile
import shutil
import requests
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Header
from fastapi.responses import StreamingResponse
from database import get_db

# Connect to other agents' functionalities
from agents.email.gmail_auth import is_connected, get_authorization_url
from agents.email.gmail_service import fetch_latest_emails
from agents.email.routes import api_analyze_email, EmailAnalysisRequest, OAUTH_STATES
from agents.sms_agent_routes import run_sms_investigation_audit
from agents.website_agent.routes import analyze_website, get_unified_history, api_generate_complaint, ComplaintGenerateRequest
from agents.visual_scam.visual_agent import VisualScamAgent
from agents.call_agent.routes import analyze_call
from agents.xai.routes import generate_xai_explanation

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Master Copilot Agent"])

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

async def classify_intent(message: str, history: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Classifies the user's natural language request into a specific target agent intent."""
    clean_msg = message.strip()
    
    # 1. Heuristic regex checks for direct website URLs
    url_pattern = re.compile(
        r'^(https?://)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(/\S*)?$', 
        re.IGNORECASE
    )
    if url_pattern.match(clean_msg):
        return {"intent": "analyze_website", "parameters": {"url": clean_msg}}
        
    analyze_prefix_match = re.match(r'^analyze\s+(.+)$', clean_msg, re.IGNORECASE)
    if analyze_prefix_match:
        potential_url = analyze_prefix_match.group(1).strip()
        if url_pattern.match(potential_url):
            return {"intent": "analyze_website", "parameters": {"url": potential_url}}

    # 2. Heuristics for short standard questions
    lower_msg = clean_msg.lower()
    if lower_msg in ["show today's sms", "show sms", "fetch sms", "fetch latest sms", "show today sms"]:
        return {"intent": "fetch_sms", "parameters": {"limit": 5}}

    if lower_msg in ["show latest emails", "show emails", "fetch emails", "show latest 5 emails", "what are my recent emails", "show recent emails"]:
        return {"intent": "fetch_emails", "parameters": {"filter": "inbox", "limit": 5}}
        
    if lower_msg in ["show unread emails", "fetch unread emails", "show unread messages"]:
        return {"intent": "fetch_emails", "parameters": {"filter": "unread", "limit": 5}}

    # 3. LLM-based Classifier fallback
    if not GROQ_API_KEY:
        return {"intent": "general_chat", "parameters": {}}
        
    system_prompt = """You are the intent classifier for the ScamON AI Security Copilot.
Analyze the user's message and categorize it into exactly one of these intents:

1. "fetch_emails" - When user asks to see recent, unread, or search emails (e.g., "Show my emails", "Show unread messages", "Search emails from HDFC").
2. "analyze_email" - When user asks to analyze a specific email, e.g. by index or keyword (e.g., "Analyze email 2", "Is the first email safe?", "Inspect the latest email").
3. "fetch_sms" - When user asks to see recent or today's SMS (e.g., "Show today's SMS", "Fetch my SMS").
4. "analyze_sms" - When user asks to analyze a specific SMS, e.g. by index (e.g., "Analyze SMS 1", "Inspect SMS 3").
5. "analyze_website" - When user wants to check/analyze a website domain or URL (e.g., "Analyze youtube.com", "check phish-alert.com").
6. "explain_threat" - When user asks to explain why something is suspicious or asks for XAI detail (e.g., "Explain why this website is suspicious", "Explain the analysis").
7. "generate_complaint" - When user wants to generate a cybercrime complaint (e.g., "Generate complaint", "Create a legal report").
8. "view_history" - When user asks to see investigation history, past scans, or statistics (e.g., "Show my history", "List past scans").
9. "view_vault" - When user wants to see the Evidence Vault status or active cases (e.g., "Open Evidence Vault", "Show my cases").
10. "general_chat" - Default category for normal conversation, security questions, greetings, or clarifications.

Return ONLY a JSON object. Do not include markdown or text other than the JSON.
Format:
{
  "intent": "intent_name",
  "parameters": {
    "index": integer or null (for index-based selection like email 2, sms 1),
    "filter": "unread" | "inbox" | "all" | null (for emails),
    "query": "search query string" | null,
    "url": "domain/url string" | null
  }
}
"""
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        
        context_messages = [{"role": "system", "content": system_prompt}]
        # Limit history to prevent context bloat during classification
        for msg in history[-5:]:
            context_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        context_messages.append({"role": "user", "content": message})
        
        body = {
            "model": "llama-3.1-8b-instant",
            "messages": context_messages,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "max_tokens": 150
        }
        
        res = requests.post(GROQ_API_URL, headers=headers, json=body, timeout=5)
        if res.status_code == 200:
            parsed = json.loads(res.json()["choices"][0]["message"]["content"])
            return parsed
    except Exception as e:
        logger.error(f"Error classifying user intent: {e}")
        
    return {"intent": "general_chat", "parameters": {}}


async def generate_copilot_stream(
    message: Optional[str],
    history_list: List[Dict[str, Any]],
    file: Optional[UploadFile],
    case_id: Optional[str]
):
    """NDJSON streaming generator that executes forensic agents and outputs statuses, logs, and answers."""
    
    # 1. Attachment Processing Triage
    if file:
        filename = file.filename
        content_type = file.content_type or ""
        
        is_image = content_type.startswith("image/") or any(filename.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"])
        is_audio = content_type.startswith("audio/") or any(filename.lower().endswith(ext) for ext in [".wav", ".mp3", ".m4a"])
        
        if is_image:
            yield json.dumps({"type": "status", "content": "Ingesting screenshot image..."}) + "\n"
            await asyncio.sleep(0.3)
            yield json.dumps({"type": "status", "content": "Running visual scam forensics & OCR..."}) + "\n"
            
            start_time = time.time()
            try:
                file_bytes = await file.read()
                agent = VisualScamAgent()
                result = await agent.analyze(file_bytes, filename, case_id or "SCAMON-2026-000001")
                latency = int((time.time() - start_time) * 1000)
                
                yield json.dumps({
                    "type": "log",
                    "agent": "Visual Agent",
                    "action": f"Analyze Image ({filename})",
                    "status": "Success",
                    "latency_ms": latency
                }) + "\n"
                
                yield json.dumps({
                    "type": "data",
                    "payload": {
                        "type": "visual_analysis",
                        "report": result
                    }
                }) + "\n"
                
                summary = f"Visual analysis complete. Risk Score: **{result.get('risk_score', 0)}/100** ({result.get('threat_level', 'SAFE')}). Predicted Category: **{result.get('scam_category', 'Unknown')}**.\n\nExtracted Text OCR:\n```\n{result.get('extracted_text')}\n```"
                yield json.dumps({"type": "text", "content": summary}) + "\n"
            except Exception as err:
                latency = int((time.time() - start_time) * 1000)
                yield json.dumps({
                    "type": "log",
                    "agent": "Visual Agent",
                    "action": f"Analyze Image ({filename})",
                    "status": "Failed",
                    "latency_ms": latency
                }) + "\n"
                yield json.dumps({"type": "text", "content": f"Visual scan failed: {str(err)}"}) + "\n"
                
        elif is_audio:
            yield json.dumps({"type": "status", "content": "Ingesting audio call recording..."}) + "\n"
            await asyncio.sleep(0.3)
            yield json.dumps({"type": "status", "content": "Transcribing call via Whisper..."}) + "\n"
            
            start_time = time.time()
            try:
                # Seek to start
                await file.seek(0)
                result = await analyze_call(audio_file=file)
                latency = int((time.time() - start_time) * 1000)
                
                yield json.dumps({
                    "type": "log",
                    "agent": "Call Agent",
                    "action": f"Analyze Audio Call ({filename})",
                    "status": "Success",
                    "latency_ms": latency
                }) + "\n"
                
                result_dict = result.dict() if hasattr(result, "dict") else dict(result)
                yield json.dumps({
                    "type": "data",
                    "payload": {
                        "type": "call_analysis",
                        "report": result_dict
                    }
                }) + "\n"
                
                ai_reason = result_dict.get("ai_analysis") or {}
                summary = f"Call transcript audit complete. Risk Score: **{result_dict.get('risk_score', 0)}/100** ({ai_reason.get('final_decision') or 'SAFE'}).\n\nTranscript:\n> {result_dict.get('transcript')}"
                yield json.dumps({"type": "text", "content": summary}) + "\n"
            except Exception as err:
                latency = int((time.time() - start_time) * 1000)
                yield json.dumps({
                    "type": "log",
                    "agent": "Call Agent",
                    "action": f"Analyze Audio Call ({filename})",
                    "status": "Failed",
                    "latency_ms": latency
                }) + "\n"
                yield json.dumps({"type": "text", "content": f"Call transcription and analysis failed: {str(err)}"}) + "\n"
        else:
            yield json.dumps({"type": "text", "content": "Unsupported attachment format. Please upload screenshots (.png, .jpg) or audio files (.wav, .mp3)."}) + "\n"
        return

    # 2. Natural Language Request Orchestration
    if not message:
        yield json.dumps({"type": "text", "content": "Please enter a message or upload a file for analysis."}) + "\n"
        return
        
    yield json.dumps({"type": "status", "content": "Classifying intent..."}) + "\n"
    classification = await classify_intent(message, history_list)
    intent = classification.get("intent", "general_chat")
    parameters = classification.get("parameters", {})
    
    # Delegate to appropriate backend agent logic
    if intent == "fetch_emails":
        filter_type = parameters.get("filter") or "inbox"
        limit = parameters.get("limit") or 5
        
        yield json.dumps({"type": "status", "content": "Calling Email Agent..."}) + "\n"
        await asyncio.sleep(0.3)
        yield json.dumps({"type": "status", "content": "Fetching Gmail..."}) + "\n"
        
        if not is_connected():
            auth_url, state, verifier = get_authorization_url("http://localhost:8001/email/callback")
            OAUTH_STATES[state] = {
                "redirect_uri": "http://localhost:8001/email/callback",
                "code_verifier": verifier
            }
            yield json.dumps({
                "type": "error",
                "code": "GMAIL_DISCONNECTED",
                "content": "Gmail is not connected. Would you like to reconnect?",
                "auth_url": auth_url
            }) + "\n"
            return
            
        start_time = time.time()
        try:
            emails_list = fetch_latest_emails(filter_type=filter_type, limit=limit)
            latency = int((time.time() - start_time) * 1000)
            
            yield json.dumps({
                "type": "log",
                "agent": "Email Agent",
                "action": f"Fetch Recent Emails (filter: {filter_type})",
                "status": "Success",
                "latency_ms": latency
            }) + "\n"
            
            if not emails_list:
                yield json.dumps({"type": "text", "content": "No recent emails found."}) + "\n"
                return
                
            yield json.dumps({
                "type": "data",
                "payload": {
                    "type": "email_list",
                    "emails": [
                        {
                            "id": em.id,
                            "threadId": em.threadId,
                            "subject": em.subject,
                            "sender": em.sender,
                            "receiver": em.receiver,
                            "date": em.date,
                            "snippet": em.snippet,
                            "is_unread": em.is_unread
                        } for em in emails_list
                    ]
                }
            }) + "\n"
            
            summary_text = f"Here are your latest {len(emails_list)} emails from Gmail. You can click **Analyze** next to any card to run the forensics scanner."
            yield json.dumps({"type": "text", "content": summary_text}) + "\n"
            
        except Exception as err:
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "Email Agent",
                "action": "Fetch Recent Emails",
                "status": "Failed",
                "latency_ms": latency
            }) + "\n"
            yield json.dumps({"type": "text", "content": f"Failed to retrieve emails: {str(err)}"}) + "\n"
            
    elif intent == "analyze_email":
        index = parameters.get("index")
        target_id = None
        
        # Scan history memory for previous emails
        for hist_msg in reversed(history_list):
            payload = hist_msg.get("payload")
            if payload and payload.get("type") == "email_list":
                emails = payload.get("emails", [])
                if index and 1 <= index <= len(emails):
                    target_id = emails[index - 1]["id"]
                    break
                    
        # Fallback to latest
        if not target_id:
            if index == 1 or not index:
                if is_connected():
                    emails_list = fetch_latest_emails(filter_type="inbox", limit=1)
                    if emails_list:
                        target_id = emails_list[0].id
                        
        if not target_id:
            yield json.dumps({"type": "text", "content": "Could not identify which email to analyze. Please fetch recent emails first."}) + "\n"
            return
            
        yield json.dumps({"type": "status", "content": "Calling Email Agent..."}) + "\n"
        await asyncio.sleep(0.3)
        yield json.dumps({"type": "status", "content": "Analyzing Email Forensics..."}) + "\n"
        
        if not is_connected():
            yield json.dumps({"type": "error", "code": "GMAIL_DISCONNECTED", "content": "Gmail is disconnected."}) + "\n"
            return
            
        start_time = time.time()
        try:
            req = EmailAnalysisRequest(message_id=target_id)
            report = await api_analyze_email(req)
            latency = int((time.time() - start_time) * 1000)
            
            yield json.dumps({
                "type": "log",
                "agent": "Email Agent",
                "action": "Analyze Email Forensics",
                "status": "Success",
                "latency_ms": latency
            }) + "\n"
            
            report_dict = report.dict() if hasattr(report, "dict") else dict(report)
            yield json.dumps({
                "type": "data",
                "payload": {
                    "type": "email_analysis",
                    "report": report_dict
                }
            }) + "\n"
            
            explanation = f"Email scan complete. Risk Score: **{report.risk_score}/100** ({report.threat_level}). Verdict: **{report.llm_classification}**.\n\nReasoning: {report.llm_reasoning}"
            yield json.dumps({"type": "text", "content": explanation}) + "\n"
        except Exception as err:
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "Email Agent",
                "action": "Analyze Email Forensics",
                "status": "Failed",
                "latency_ms": latency
            }) + "\n"
            yield json.dumps({"type": "text", "content": f"Failed to analyze email: {str(err)}"}) + "\n"
            
    elif intent == "fetch_sms":
        limit = parameters.get("limit") or 5
        yield json.dumps({"type": "status", "content": "Calling SMS Agent..."}) + "\n"
        await asyncio.sleep(0.3)
        yield json.dumps({"type": "status", "content": "Fetching SMS Stream..."}) + "\n"
        
        start_time = time.time()
        try:
            db = get_db()
            if db is None:
                raise RuntimeError("Database offline.")
            
            cursor = db["investigations"].find({"agent_type": "sms"}).sort("timestamp", -1).limit(limit)
            sms_list = []
            for doc in cursor:
                sms_list.append({
                    "investigation_id": doc["investigation_id"],
                    "sender": doc.get("full_report", {}).get("sms", {}).get("sender") or doc["input"].split(":")[0].replace("SMS from ", "").strip(),
                    "message": doc.get("full_report", {}).get("sms", {}).get("message") or doc["input"].split(":")[-1].strip(),
                    "timestamp": doc["timestamp"],
                    "status": doc["status"],
                    "risk_score": doc.get("risk_score", 0),
                    "threat_level": doc.get("threat_level", "SAFE")
                })
                
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "SMS Agent",
                "action": "Fetch Collected SMS",
                "status": "Success",
                "latency_ms": latency
            }) + "\n"
            
            if not sms_list:
                yield json.dumps({"type": "text", "content": "No recent SMS found."}) + "\n"
                return
                
            yield json.dumps({
                "type": "data",
                "payload": {
                    "type": "sms_list",
                    "sms": sms_list
                }
            }) + "\n"
            
            yield json.dumps({"type": "text", "content": "Here are the recent SMS messages from your passive collector stream. Click **Analyze** to run the forensic scanner."}) + "\n"
        except Exception as err:
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "SMS Agent",
                "action": "Fetch Collected SMS",
                "status": "Failed",
                "latency_ms": latency
            }) + "\n"
            yield json.dumps({"type": "text", "content": f"Failed to retrieve SMS: {str(err)}"}) + "\n"
            
    elif intent == "analyze_sms":
        index = parameters.get("index")
        target_id = None
        
        # Search history for previous sms list
        for hist_msg in reversed(history_list):
            payload = hist_msg.get("payload")
            if payload and payload.get("type") == "sms_list":
                sms = payload.get("sms", [])
                if index and 1 <= index <= len(sms):
                    target_id = sms[index - 1]["investigation_id"]
                    break
                    
        # Fallback to the latest SMS in database
        if not target_id:
            db = get_db()
            if db is not None:
                latest = db["investigations"].find_one({"agent_type": "sms"}, sort=[("timestamp", -1)])
                if latest:
                    target_id = latest["investigation_id"]
                    
        if not target_id:
            yield json.dumps({"type": "text", "content": "Could not identify which SMS to analyze."}) + "\n"
            return
            
        yield json.dumps({"type": "status", "content": "Calling SMS Agent..."}) + "\n"
        await asyncio.sleep(0.3)
        yield json.dumps({"type": "status", "content": "Auditing SMS Content..."}) + "\n"
        
        start_time = time.time()
        try:
            report = await run_sms_investigation_audit(target_id)
            latency = int((time.time() - start_time) * 1000)
            
            yield json.dumps({
                "type": "log",
                "agent": "SMS Agent",
                "action": "Analyze SMS Forensics",
                "status": "Success",
                "latency_ms": latency
            }) + "\n"
            
            yield json.dumps({
                "type": "data",
                "payload": {
                    "type": "sms_analysis",
                    "report": report
                }
            }) + "\n"
            
            full_rep = report.get("full_report") or {}
            analysis = full_rep.get("analysis") or {}
            explanation = f"SMS scan complete. Risk Score: **{report.get('risk_score')}/100** ({report.get('threat_level')}).\n\nReasoning: {analysis.get('summary') or report.get('summary')}"
            yield json.dumps({"type": "text", "content": explanation}) + "\n"
        except Exception as err:
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "SMS Agent",
                "action": "Analyze SMS Forensics",
                "status": "Failed",
                "latency_ms": latency
            }) + "\n"
            yield json.dumps({"type": "text", "content": f"Failed to analyze SMS: {str(err)}"}) + "\n"
            
    elif intent == "analyze_website":
        url = parameters.get("url")
        if not url:
            yield json.dumps({"type": "text", "content": "Please specify a URL or domain name to scan."}) + "\n"
            return
            
        yield json.dumps({"type": "status", "content": "Calling Website Agent..."}) + "\n"
        await asyncio.sleep(0.2)
        yield json.dumps({"type": "status", "content": "Running DNS WHOIS & SSL checks..."}) + "\n"
        
        start_time = time.time()
        try:
            res = await analyze_website(url=url, qr_image=None, scan_anyway=False)
            latency = int((time.time() - start_time) * 1000)
            
            yield json.dumps({
                "type": "log",
                "agent": "Website Agent",
                "action": f"Scan Domain Forensics ({url})",
                "status": "Success",
                "latency_ms": latency
            }) + "\n"
            
            res_dict = res.dict() if hasattr(res, "dict") else dict(res)
            yield json.dumps({
                "type": "data",
                "payload": {
                    "type": "website_analysis",
                    "report": res_dict
                }
            }) + "\n"
            
            ai_reason = res_dict.get("ai_reasoning") or {}
            verdict_text = f"Website scan complete. Risk Score: **{res_dict.get('risk_score')}/100** ({ai_reason.get('final_decision') or 'UNKNOWN'}).\n\nReasoning: {ai_reason.get('summary') or 'No details available.'}"
            yield json.dumps({"type": "text", "content": verdict_text}) + "\n"
        except Exception as err:
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "Website Agent",
                "action": "Scan Domain Forensics",
                "status": "Failed",
                "latency_ms": latency
            }) + "\n"
            yield json.dumps({"type": "text", "content": f"Failed to analyze website: {str(err)}"}) + "\n"
            
    elif intent == "explain_threat":
        yield json.dumps({"type": "status", "content": "Calling Explainability Agent..."}) + "\n"
        await asyncio.sleep(0.3)
        yield json.dumps({"type": "status", "content": "Synthesizing XAI reasoner..."}) + "\n"
        
        db = get_db()
        resolved_case_id = case_id
        if (not resolved_case_id or resolved_case_id == "null") and db is not None:
            active_case = db["cases"].find_one({"status": {"$ne": "Closed"}}, sort=[("updated_at", -1)])
            if active_case:
                resolved_case_id = active_case["case_id"]
                
        if not resolved_case_id or resolved_case_id == "null":
            yield json.dumps({"type": "text", "content": "No active case folder identified to generate explanation details."}) + "\n"
            return
            
        start_time = time.time()
        try:
            report = await generate_xai_explanation({"case_id": resolved_case_id, "language": "English"})
            latency = int((time.time() - start_time) * 1000)
            
            yield json.dumps({
                "type": "log",
                "agent": "XAI Agent",
                "action": f"Generate XAI Summary (Case: {resolved_case_id})",
                "status": "Success",
                "latency_ms": latency
            }) + "\n"
            
            yield json.dumps({
                "type": "data",
                "payload": {
                    "type": "xai_explanation",
                    "report": report
                }
            }) + "\n"
            
            summary = report.get("overall_summary") or "Explanation successfully compiled."
            yield json.dumps({"type": "text", "content": summary}) + "\n"
        except Exception as err:
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "XAI Agent",
                "action": "Generate XAI Summary",
                "status": "Failed",
                "latency_ms": latency
            }) + "\n"
            yield json.dumps({"type": "text", "content": f"Failed to generate explanation: {str(err)}"}) + "\n"
            
    elif intent == "generate_complaint":
        yield json.dumps({"type": "status", "content": "Calling Complaint Agent..."}) + "\n"
        await asyncio.sleep(0.3)
        yield json.dumps({"type": "status", "content": "Generating Cybercrime legal package..."}) + "\n"
        
        db = get_db()
        resolved_case_id = case_id
        if (not resolved_case_id or resolved_case_id == "null") and db is not None:
            active_case = db["cases"].find_one({"status": {"$ne": "Closed"}}, sort=[("updated_at", -1)])
            if active_case:
                resolved_case_id = active_case["case_id"]
                
        if not resolved_case_id or resolved_case_id == "null":
            yield json.dumps({"type": "text", "content": "No active case folder identified to generate a complaint document."}) + "\n"
            return
            
        start_time = time.time()
        try:
            req = ComplaintGenerateRequest(case_id=resolved_case_id)
            res = await api_generate_complaint(req)
            latency = int((time.time() - start_time) * 1000)
            
            yield json.dumps({
                "type": "log",
                "agent": "Complaint Agent",
                "action": f"Build Complaint Package (Case: {resolved_case_id})",
                "status": "Success",
                "latency_ms": latency
            }) + "\n"
            
            yield json.dumps({
                "type": "data",
                "payload": {
                    "type": "complaint_generation",
                    "report": res
                }
            }) + "\n"
            
            yield json.dumps({"type": "text", "content": f"Legal cybercrime complaint forms have been successfully drafted and compiled for Case ID **{resolved_case_id}**! Direct download links are available below."}) + "\n"
        except Exception as err:
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "Complaint Agent",
                "action": "Build Complaint Package",
                "status": "Failed",
                "latency_ms": latency
            }) + "\n"
            yield json.dumps({"type": "text", "content": f"Failed to generate complaint package: {str(err)}"}) + "\n"
            
    elif intent == "view_history":
        yield json.dumps({"type": "status", "content": "Calling History Agent..."}) + "\n"
        await asyncio.sleep(0.2)
        yield json.dumps({"type": "status", "content": "Loading unified SOC scans..."}) + "\n"
        
        start_time = time.time()
        try:
            history_res = await get_unified_history(limit=5)
            latency = int((time.time() - start_time) * 1000)
            
            yield json.dumps({
                "type": "log",
                "agent": "History Agent",
                "action": "Query History Log",
                "status": "Success",
                "latency_ms": latency
            }) + "\n"
            
            yield json.dumps({
                "type": "data",
                "payload": {
                    "type": "history",
                    "report": history_res
                }
            }) + "\n"
            
            yield json.dumps({"type": "text", "content": "Here is a list of the 5 most recent threat investigations conducted on the ScamON SOC platform."}) + "\n"
        except Exception as err:
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "History Agent",
                "action": "Query History Log",
                "status": "Failed",
                "latency_ms": latency
            }) + "\n"
            yield json.dumps({"type": "text", "content": f"Failed to fetch history logs: {str(err)}"}) + "\n"
            
    elif intent == "view_vault":
        yield json.dumps({"type": "status", "content": "Calling Evidence Vault Agent..."}) + "\n"
        await asyncio.sleep(0.2)
        yield json.dumps({"type": "status", "content": "Accessing case vaults..."}) + "\n"
        
        start_time = time.time()
        try:
            db = get_db()
            if db is None:
                raise RuntimeError("Database offline.")
            
            cases = list(db["cases"].find().sort("updated_at", -1).limit(5))
            for c in cases:
                c["_id"] = str(c["_id"])
                
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "Evidence Vault",
                "action": "Query Active Case Folders",
                "status": "Success",
                "latency_ms": latency
            }) + "\n"
            
            yield json.dumps({
                "type": "data",
                "payload": {
                    "type": "vault_cases",
                    "cases": cases
                }
            }) + "\n"
            
            yield json.dumps({"type": "text", "content": "Evidence Vault verified. Here are the active case directories and their overall risk levels."}) + "\n"
        except Exception as err:
            latency = int((time.time() - start_time) * 1000)
            yield json.dumps({
                "type": "log",
                "agent": "Evidence Vault",
                "action": "Query Active Case Folders",
                "status": "Failed",
                "latency_ms": latency
            }) + "\n"
            yield json.dumps({"type": "text", "content": f"Failed to access Evidence Vault: {str(err)}"}) + "\n"
            
    else: # general_chat
        yield json.dumps({"type": "status", "content": "Thinking..."}) + "\n"
        
        if GROQ_API_KEY:
            try:
                headers = {
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                }
                
                system_instructions = """You are the ScamON AI Security Copilot, an expert virtual cybersecurity advisor and assistant.
You assist SOC analysts in identifying scams, explaining threats (phishing, smishing, BEC, spoofing, etc.), and routing telemetry.
Answer user questions concisely, professionally, and in clean markdown formatting.
If the user asks to analyze emails, websites, or SMS, guide them on how to request it (e.g., "Analyze email 2", "Scan youtube.com").
"""
                messages = [{"role": "system", "content": system_instructions}]
                for msg in history_list[-10:]:
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
                messages.append({"role": "user", "content": message})
                
                body = {
                    "model": "llama-3.1-8b-instant",
                    "messages": messages,
                    "temperature": 0.3,
                    "stream": True,
                    "max_tokens": 800
                }
                
                res = requests.post(GROQ_API_URL, headers=headers, json=body, stream=True, timeout=10)
                res.raise_for_status()
                
                for line in res.iter_lines():
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
                                    yield json.dumps({"type": "text", "content": content}) + "\n"
                            except Exception:
                                pass
            except Exception as e:
                logger.error(f"Error in general chat: {e}")
                yield json.dumps({"type": "text", "content": f"I encountered an error trying to process your request: {str(e)}"}) + "\n"
        else:
            yield json.dumps({"type": "text", "content": "Llama AI model API key is not configured. Please add GROQ_API_KEY in your env settings."}) + "\n"


@router.post("/api/copilot/chat")
async def copilot_chat(
    message: Optional[str] = Form(None),
    history: str = Form("[]"),
    file: Optional[UploadFile] = File(None),
    x_case_id: Optional[str] = Header(None, alias="X-Case-ID")
):
    """Unified conversational interface endpoint for the AI Security Copilot."""
    try:
        history_list = json.loads(history)
    except Exception:
        history_list = []
        
    return StreamingResponse(
        generate_copilot_stream(message, history_list, file, x_case_id),
        media_type="text/event-stream"
    )
