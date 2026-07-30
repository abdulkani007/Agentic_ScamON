import base64
import logging
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from .gmail_auth import get_gmail_credentials
from .schemas import EmailSummary, EmailDetails, AttachmentInfo

logger = logging.getLogger(__name__)

def get_gmail_service():
    """Builds and returns the Gmail API service instance."""
    creds = get_gmail_credentials()
    return build("gmail", "v1", credentials=creds)

def get_profile_email() -> str:
    """Retrieves the authenticated user's email address."""
    try:
        service = get_gmail_service()
        profile = service.users().getProfile(userId="me").execute()
        return profile.get("emailAddress", "unknown@gmail.com")
    except Exception as err:
        logger.error(f"Failed to fetch Gmail profile details: {err}")
        return "unknown@gmail.com"

def fetch_latest_emails(filter_type: str = "inbox", limit: int = 10) -> list[EmailSummary]:
    """Fetches list of latest emails according to filtering parameters."""
    try:
        service = get_gmail_service()
        
        # Build query string based on filter type
        q = ""
        if filter_type == "inbox":
            q = "label:INBOX"
        elif filter_type == "unread":
            q = "label:UNREAD"
        else:
            q = ""

        # Fetch messages list
        result = service.users().messages().list(userId="me", q=q, maxResults=limit).execute()
        messages = result.get("messages", [])
        
        summaries = []
        for msg in messages:
            try:
                # Fetch minimal format for listing efficiency
                m_details = service.users().messages().get(userId="me", id=msg["id"], format="metadata", metadataHeaders=["Subject", "From", "To", "Date"]).execute()
                
                headers = m_details.get("payload", {}).get("headers", [])
                
                subject = "No Subject"
                sender = "Unknown Sender"
                receiver = "me"
                date_val = "N/A"
                
                for h in headers:
                    name = h.get("name", "").lower()
                    if name == "subject":
                        subject = h.get("value", subject)
                    elif name == "from":
                        sender = h.get("value", sender)
                    elif name == "to":
                        receiver = h.get("value", receiver)
                    elif name == "date":
                        date_val = h.get("value", date_val)
                
                # Check labels to see if unread
                labels = m_details.get("labelIds", [])
                is_unread = "UNREAD" in labels
                
                summaries.append(
                    EmailSummary(
                        id=msg["id"],
                        threadId=msg["threadId"],
                        subject=subject,
                        sender=sender,
                        receiver=receiver,
                        date=date_val,
                        snippet=m_details.get("snippet", ""),
                        is_unread=is_unread
                    )
                )
            except Exception as inner_err:
                logger.warning(f"Error fetching metadata for message {msg.get('id')}: {inner_err}")
                continue
                
        return summaries

    except HttpError as err:
        logger.error(f"Gmail API HttpError: {err}")
        raise
    except Exception as err:
        logger.error(f"Failed to fetch latest emails: {err}")
        raise

def parse_body_parts(payload: dict) -> tuple[str, str, list[AttachmentInfo]]:
    """Recursively parses email MIME body parts to extract HTML, plain text, and attachment metadata."""
    body_text = ""
    body_html = ""
    attachments = []

    mime_type = payload.get("mimeType", "")
    body_data = payload.get("body", {}).get("data", "")
    
    # 1. Parse body text/html if directly present
    if mime_type == "text/plain" and body_data:
        try:
            body_text = base64.urlsafe_b64decode(body_data.encode("UTF-8")).decode("UTF-8", errors="ignore")
        except Exception:
            pass
    elif mime_type == "text/html" and body_data:
        try:
            body_html = base64.urlsafe_b64decode(body_data.encode("UTF-8")).decode("UTF-8", errors="ignore")
        except Exception:
            pass

    # 2. Parse attachment info if present
    filename = payload.get("filename", "")
    att_id = payload.get("body", {}).get("attachmentId", "")
    if filename and att_id:
        size = payload.get("body", {}).get("size", 0)
        attachments.append(
            AttachmentInfo(
                id=att_id,
                filename=filename,
                mime_type=mime_type,
                size_bytes=size
            )
        )

    # 3. Recursively check subparts (multipart)
    parts = payload.get("parts", [])
    for part in parts:
        part_text, part_html, part_att = parse_body_parts(part)
        if part_text:
            body_text += "\n" + part_text
        if part_html:
            body_html += "\n" + part_html
        attachments.extend(part_att)

    return body_text.strip(), body_html.strip(), attachments

def fetch_email_details(message_id: str) -> EmailDetails:
    """Fetches full email payload and returns structured EmailDetails."""
    try:
        service = get_gmail_service()
        msg = service.users().messages().get(userId="me", id=message_id, format="full").execute()
        
        payload = msg.get("payload", {})
        headers_list = payload.get("headers", [])
        
        # Map headers into flat dict
        headers_dict = {}
        for h in headers_list:
            headers_dict[h.get("name", "")] = h.get("value", "")

        # Read details from headers
        subject = headers_dict.get("Subject", "No Subject")
        sender = headers_dict.get("From", "Unknown Sender")
        receiver = headers_dict.get("To", "me")
        date_val = headers_dict.get("Date", "N/A")
        snippet = msg.get("snippet", "")
        
        # Parse body parts
        body_text, body_html, attachments = parse_body_parts(payload)
        
        # Fallback to snippet if body text is empty
        if not body_text:
            body_text = snippet

        return EmailDetails(
            id=message_id,
            subject=subject,
            sender=sender,
            receiver=receiver,
            date=date_val,
            snippet=snippet,
            body_text=body_text,
            body_html=body_html,
            headers=headers_dict,
            attachments=attachments
        )

    except HttpError as err:
        logger.error(f"Gmail API HttpError while fetching details for message {message_id}: {err}")
        raise
    except Exception as err:
        logger.error(f"Failed to fetch email details for {message_id}: {err}")
        raise
