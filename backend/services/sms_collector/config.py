import os

# API configuration
API_ENDPOINT = os.getenv("SMS_API_ENDPOINT", "http://127.0.0.1:8001/api/sms/analyze")

# Playwright Browser Persistent session storage path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend/
USER_DATA_DIR = os.path.join(BASE_DIR, "profiles", "google_messages")

# Monitoring interval in seconds
CHECK_INTERVAL = 4

# Target Web Portal
GOOGLE_MESSAGES_URL = "https://messages.google.com/web/conversations"

# Resilient DOM selectors for Google Messages for Web
SELECTORS = {
    # Selector to identify unread conversation list items
    "unread_conversation_item": "mws-conversation-list-item:has(.unread), mws-conversation-list-item.unread, [role='listitem']:has(.unread)",
    
    # Selector for general conversation list items
    "conversation_item": "mws-conversation-list-item, [role='listitem']",
    
    # Sub-selectors inside a conversation item
    "sender_name": ".name, .conversation-name, [data-e2e='conversation-name'], .title",
    "message_snippet": ".last-message, .snippet, [data-e2e='last-message-body'], .snippet-text",
    "timestamp": ".timestamp, .time-stamp, [data-e2e='timestamp'], .time",
    
    # QR pairing visible check selector
    "qr_code_canvas": "mw-qr-code canvas, qr-code"
}
