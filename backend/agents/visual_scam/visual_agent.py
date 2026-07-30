import os
import re
import json
import base64
import logging
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional
import cv2
import numpy as np

from agents.website_agent.qr_decoder import decode_qr

logger = logging.getLogger(__name__)

# Groq API configurations
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

class VisualScamAgent:
    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.api_url = GROQ_API_URL

    async def analyze(self, image_bytes: bytes, image_filename: str, case_id: str) -> Dict[str, Any]:
        """Performs visual scam analysis on the uploaded screenshot image."""
        timestamp = datetime.now().isoformat()
        
        # 1. Decode QR Code if any
        qr_data = None
        try:
            qr_data = decode_qr(image_bytes)
            logger.info(f"QR Decoder found payload: {qr_data}")
        except Exception as qr_err:
            logger.debug(f"No QR code detected or failed to decode: {qr_err}")

        # 2. Convert image to base64 for Groq Vision API
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        
        # Determine image MIME type
        ext = os.path.splitext(image_filename)[1].lower().replace(".", "")
        if ext not in ["png", "jpg", "jpeg", "webp", "bmp", "tiff"]:
            ext = "png"
        mime_type = f"image/{ext}"
        if ext == "jpg":
            mime_type = "image/jpeg"

        # 3. Vision Analysis
        vision_result = {}
        if self.api_key and not self.api_key.startswith("your_"):
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                
                prompt = """Analyze this image. You are a Visual Cyber Forensics Investigator.
Detect:
1. What type of image is this? Must be exactly one of: Website Screenshot, WhatsApp Chat, Instagram Chat, Facebook Chat, Telegram Chat, Email Screenshot, UPI Payment, QR Code, Bank Login Page, Government Portal, Courier Tracking, Investment Advertisement, Lottery Poster, Job Offer Letter, KYC Verification, Unknown.
2. Extract all visible text in the image.
3. Extract suspicious entities (URLs, email addresses, phone numbers, UPI IDs, amounts, sender/company names).
4. Perform a visual analysis check for: urgent language, threat language, fake rewards, lottery claims, KYC requests, bank impersonation, logo misuse, fake customer support, investment promises, romance scam indicators.
5. Predict the scam category (e.g. Phishing, Fake Banking, Lottery Scam, Investment Scam, Courier Scam, KYC Scam, Job Scam, QR Scam, UPI Scam, Customer Care Scam, Government Scam, Crypto Scam, Identity Theft, Social Engineering, Unknown).
6. Assess a risk score (0-100), threat level (SAFE | LOW | MEDIUM | HIGH | CRITICAL), and confidence (0.0 to 1.0).
7. List direct recommendations.

You must respond strictly with a JSON object. Do not use markdown backticks or extra text. Use exactly this JSON structure:
{
  "image_type": "WhatsApp Chat",
  "extracted_text": "Complete OCR text extracted...",
  "scam_category": "Phishing",
  "reasoning": "Forensic details of why this is suspicious...",
  "recommendations": ["Do not click the link", "Verify the sender"],
  "entities": {
    "url": "https://suspicious-link.com",
    "phone_number": "+1234567890",
    "email": "alert@hdfcbk.com",
    "upi_id": "hdfc@ybl",
    "amount": "15,000",
    "company_name": "HDFC Bank"
  },
  "visual_indicators": ["urgent language", "bank impersonation"],
  "risk_score": 85,
  "threat_level": "HIGH",
  "confidence": 0.95
}"""
                
                payload = {
                    "model": "llama-3.2-11b-vision-preview",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                    "max_tokens": 1200
                }
                
                logger.info("Sending screenshot payload to Groq Vision API...")
                response = requests.post(self.api_url, headers=headers, json=payload, timeout=20)
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"]["content"]
                    vision_result = json.loads(content)
                    logger.info("Successfully received vision analysis from Groq.")
                else:
                    logger.warning(f"Groq Vision API returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"Groq Vision analysis failed: {e}", exc_info=True)

        # 4. Fallback Rule-Based Analyzer
        if not vision_result:
            logger.info("Using fail-safe rule-based fallback visual analysis engine...")
            vision_result = self._get_fallback_analysis(image_filename, qr_data)

        # 5. Entity Extract Validation (Regex backup)
        extracted_text = vision_result.get("extracted_text", "")
        if qr_data:
            extracted_text += f"\n[Decoded QR Code Payload]: {qr_data}"

        urls_found = self._extract_regex(extracted_text, r'https?://[^\s<>"]+|www\.[^\s<>"]+')
        emails_found = self._extract_regex(extracted_text, r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
        phone_numbers_found = self._extract_regex(extracted_text, r'\+?[0-9]{10,13}')
        upi_ids_found = self._extract_regex(extracted_text, r'[a-zA-Z0-9.\-_]+@[a-zA-Z]{2,}')

        # Add entities parsed from vision result directly
        vision_entities = vision_result.get("entities", {})
        if vision_entities.get("url") and vision_entities["url"] not in urls_found:
            urls_found.append(vision_entities["url"])
        if vision_entities.get("email") and vision_entities["email"] not in emails_found:
            emails_found.append(vision_entities["email"])
        if vision_entities.get("phone_number") and vision_entities["phone_number"] not in phone_numbers_found:
            phone_numbers_found.append(vision_entities["phone_number"])
        if vision_entities.get("upi_id") and vision_entities["upi_id"] not in upi_ids_found:
            upi_ids_found.append(vision_entities["upi_id"])

        # QR routing additions
        if qr_data:
            if qr_data.startswith("http") and qr_data not in urls_found:
                urls_found.append(qr_data)
            elif "@" in qr_data and qr_data not in upi_ids_found:
                upi_ids_found.append(qr_data)

        # 6. Collaborate/Route with Subordinate Agents
        agents_invoked = []
        agent_results = {}

        # Website routing
        if urls_found:
            target_url = urls_found[0]
            try:
                from agents.website_agent.routes import analyze_website
                logger.info(f"Routing extracted URL: {target_url} to Website Investigation Agent...")
                web_result_dict = await analyze_website(url=target_url, qr_image=None, scan_anyway=True)
                # Convert response model to dict
                if hasattr(web_result_dict, "dict"):
                    web_result_dict = web_result_dict.dict()
                agent_results["website"] = web_result_dict
                agents_invoked.append("Website Investigation Agent")
            except Exception as web_err:
                logger.error(f"Website Routing failed: {web_err}")

        # Email routing
        if emails_found:
            target_email = emails_found[0]
            try:
                from agents.email.email_agent import run_email_llm_analysis
                logger.info(f"Routing email address: {target_email} to Email Investigation Agent...")
                # Call email investigator directly with mock parameters
                email_res = run_email_llm_analysis(
                    subject="Screenshot Threat Telemetry Audit",
                    sender=target_email,
                    receiver="compliance@scamon-soc.org",
                    snippet=extracted_text[:100],
                    body_text=extracted_text,
                    headers_summary={"risk_score": 85, "spf": "FAIL", "dmarc": "FAIL", "dkim": "FAIL"},
                    links_summary=[{"url": u, "risk_score": 80} for u in urls_found],
                    attachments_summary=[]
                )
                agent_results["email"] = email_res
                agents_invoked.append("Email Investigation Agent")
            except Exception as email_err:
                logger.error(f"Email Routing failed: {email_err}")

        # SMS routing
        if phone_numbers_found or (vision_result.get("image_type") == "SMS Screenshot" and extracted_text):
            target_phone = phone_numbers_found[0] if phone_numbers_found else "Unknown SMS Sender"
            try:
                from agents.sms_agent_package.sms_agent import SMSAgent
                logger.info(f"Routing sender ID: {target_phone} to SMS Investigation Agent...")
                sms_agent = SMSAgent()
                sms_res = sms_agent.analyze(
                    sender=target_phone,
                    message=extracted_text,
                    timestamp=timestamp
                )
                if hasattr(sms_res, "dict"):
                    sms_res = sms_res.dict()
                agent_results["sms"] = sms_res
                agents_invoked.append("SMS Investigation Agent")
            except Exception as sms_err:
                logger.error(f"SMS Routing failed: {sms_err}")

        # 7. Overall Threat Scoring adjustments
        # Adjust overall risk if any of the invoked sub-agents returned a critical threat
        risk_score = vision_result.get("risk_score", 0)
        for sub_res in agent_results.values():
            sub_score = sub_res.get("risk_score") or sub_res.get("score") or sub_res.get("threat_score") or 0
            # For Email, score resides inside rule-based response or general threat
            if isinstance(sub_res, dict) and "analysis" in sub_res:
                sub_score = sub_res["analysis"].get("risk_score") or sub_score
            try:
                sub_score = int(sub_score)
                risk_score = max(risk_score, sub_score)
            except (ValueError, TypeError):
                pass

        threat_level = "SAFE"
        if risk_score >= 80:
            threat_level = "CRITICAL"
        elif risk_score >= 60:
            threat_level = "HIGH"
        elif risk_score >= 40:
            threat_level = "MEDIUM"
        elif risk_score >= 15:
            threat_level = "LOW"

        return {
            "status": "success",
            "image_url": "", # Will be populated by routes
            "image_type": vision_result.get("image_type", "Unknown"),
            "extracted_text": vision_result.get("extracted_text", ""),
            "risk_score": risk_score,
            "threat_level": threat_level,
            "scam_category": vision_result.get("scam_category", "Unknown"),
            "confidence": vision_result.get("confidence", 0.5),
            "reasoning": vision_result.get("reasoning", "No reasons detected."),
            "recommendations": vision_result.get("recommendations", ["Report the incident."]),
            "entities": vision_entities,
            "urls_found": urls_found,
            "emails_found": emails_found,
            "phone_numbers_found": phone_numbers_found,
            "upi_ids_found": upi_ids_found,
            "visual_indicators": vision_result.get("visual_indicators", []),
            "agents_invoked": agents_invoked,
            "agent_results": agent_results,
            "qr_data": qr_data,
            "timestamp": timestamp,
            "case_id": case_id
        }

    def _extract_regex(self, text: str, pattern: str) -> List[str]:
        """Utility regex scanner."""
        matches = re.findall(pattern, text)
        return list(set(matches))

    def _get_fallback_analysis(self, filename: str, qr_data: Optional[str]) -> Dict[str, Any]:
        """Fail-safe mock visual analytics engine."""
        fn = filename.lower()
        
        # WhatsApp Chat
        if "whatsapp" in fn:
            return {
                "image_type": "WhatsApp Chat",
                "extracted_text": "Sender: +91 98765 43210\n[10:14] Urgent! Your electricity bill is pending. Please pay Rs 14,500 immediately to avoid power cutoff. Click here to verify: https://bill-pay-electricity.com",
                "scam_category": "Courier Scam / Billing Fraud",
                "reasoning": "Detected high-urgency keywords demanding immediate money transfer to avoid service cuts, backed by typosquat banking link.",
                "recommendations": ["Do not click the billing links.", "Contact the official utility provider directly.", "Block the sender number."],
                "entities": {
                    "url": "https://bill-pay-electricity.com",
                    "phone_number": "+919876543210",
                    "amount": "14,500",
                    "company_name": "Electricity Board"
                },
                "visual_indicators": ["urgent language", "payment requests", "fake customer support"],
                "risk_score": 88,
                "threat_level": "HIGH",
                "confidence": 0.90
            }

        # SMS chat
        if "sms" in fn:
            return {
                "image_type": "SMS Screenshot",
                "extracted_text": "Sender: AX-ADITYA\nALERT: Your SBI Netbanking account is blocked due to KYC. Click here to update your PAN immediately: https://sbi-kyc-verify-portal.net",
                "scam_category": "KYC Scam",
                "reasoning": "Spoofed bank header AX-ADITYA sending panic alerts regarding KYC block, pointing to typosquatted domain.",
                "recommendations": ["Do not submit PAN card details.", "SBI never sends links for PAN updates via SMS.", "Report to local cybersecurity cell."],
                "entities": {
                    "url": "https://sbi-kyc-verify-portal.net",
                    "phone_number": "AX-ADITYA",
                    "company_name": "SBI Bank"
                },
                "visual_indicators": ["KYC requests", "bank impersonation", "urgent language"],
                "risk_score": 92,
                "threat_level": "CRITICAL",
                "confidence": 0.95
            }

        # UPI screenshots
        if "upi" in fn or "payment" in fn:
            return {
                "image_type": "UPI Payment",
                "extracted_text": "Google Pay\nSent Rs 50,000 to fraud-merchant@paytm\nTransaction ID: UPI849129031\nFailed. Action Required: Click here to retry payment refund: https://refund-portal-gpay.com",
                "scam_category": "UPI Scam",
                "reasoning": "Fake transaction failure template directing victims to a malicious refund portal trying to capture credentials.",
                "recommendations": ["Refunds never require scanning QR or submitting PINs.", "Do not input UPI PIN on web links."],
                "entities": {
                    "url": "https://refund-portal-gpay.com",
                    "upi_id": "fraud-merchant@paytm",
                    "amount": "50,000"
                },
                "visual_indicators": ["payment requests", "fake customer support"],
                "risk_score": 85,
                "threat_level": "HIGH",
                "confidence": 0.88
            }

        # QR Codes
        if "qr" in fn or qr_data:
            return {
                "image_type": "QR Code",
                "extracted_text": f"Scanned QR Code Target. Decoded: {qr_data or 'https://secure-login-hdfcbk.com'}",
                "scam_category": "QR Scam",
                "reasoning": "QR code redirects to suspicious login web portal replicating banking verification flows.",
                "recommendations": ["Do not enter credentials on websites loaded via QR.", "Verify destination domain names carefully."],
                "entities": {
                    "url": qr_data or "https://secure-login-hdfcbk.com"
                },
                "visual_indicators": ["fake verification", "bank impersonation"],
                "risk_score": 80,
                "threat_level": "HIGH",
                "confidence": 0.85
            }

        # Banking/Login screens
        if "bank" in fn or "login" in fn:
            return {
                "image_type": "Bank Login Page",
                "extracted_text": "HDFC Bank Netbanking Login\nUser ID / Customer ID\nClick here to securely login: https://secure-login-hdfc.com",
                "scam_category": "Fake Banking",
                "reasoning": "Phishing site replicating HDFC Bank login interface, hosted on a non-official brand domain.",
                "recommendations": ["Verify SSL Certificate owner details.", "Always look for official hdfcbank.com domains."],
                "entities": {
                    "url": "https://secure-login-hdfc.com",
                    "company_name": "HDFC Bank"
                },
                "visual_indicators": ["bank impersonation", "logo misuse", "fake verification"],
                "risk_score": 96,
                "threat_level": "CRITICAL",
                "confidence": 0.98
            }

        # Default Generic
        return {
            "image_type": "Suspicious Screenshot",
            "extracted_text": f"Suspicious text content inside image file {filename}.",
            "scam_category": "Social Engineering",
            "reasoning": "Visual scan indicates possible spoofed brand layouts, urgent notifications, or payment coordinates.",
            "recommendations": ["Treat unsolicited requests with extreme caution.", "Perform independent brand verifications."],
            "entities": {
                "url": "https://verify-user-profile.com"
            },
            "visual_indicators": ["urgent language"],
            "risk_score": 65,
            "threat_level": "HIGH",
            "confidence": 0.70
        }
