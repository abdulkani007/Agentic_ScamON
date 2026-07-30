import os
import glob
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

logger = logging.getLogger(__name__)

# Directory containing this file
EMAIL_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_PATH = os.path.join(EMAIL_DIR, "token.json")

# OAuth Scopes required (read-only access to Gmail inbox)
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

def get_client_secrets_path() -> str:
    """Finds the client secret JSON file in the email agent directory."""
    # First check for client_secret.json exactly
    exact_path = os.path.join(EMAIL_DIR, "client_secret.json")
    if os.path.exists(exact_path):
        return exact_path

    # Fallback to any client_secret*.json file
    patterns = glob.glob(os.path.join(EMAIL_DIR, "client_secret*.json"))
    if patterns:
        # Sort to prioritize files, return the first match
        return patterns[0]

    raise FileNotFoundError(
        "Missing client_secret.json file in backend/agents/email/. Please configure Google OAuth credentials."
    )

def get_gmail_credentials() -> Credentials:
    """Retrieves or refreshes Google OAuth credentials from token.json.
    
    Raises FileNotFoundError or Exception if authentication is required.
    """
    creds = None
    if os.path.exists(TOKEN_PATH):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
        except Exception as err:
            logger.warning(f"Failed to read existing token.json: {err}. Re-authentication required.")
            creds = None

    # If credentials do not exist or are invalid
    if not creds:
        raise FileNotFoundError("Google token.json not found. Authentication required.")

    # If credentials exist but are expired, attempt to refresh
    if creds.expired and creds.refresh_token:
        try:
            logger.info("Gmail credentials expired. Refreshing token...")
            creds.refresh(Request())
            # Save the refreshed credentials
            with open(TOKEN_PATH, "w") as token_file:
                token_file.write(creds.to_json())
            logger.info("Gmail token refreshed successfully.")
        except Exception as err:
            logger.error(f"Failed to refresh Gmail token: {err}. Re-authentication required.")
            # Remove invalid token
            try:
                os.remove(TOKEN_PATH)
            except OSError:
                pass
            raise Exception("Token refresh failed. Re-authentication required.")

    return creds

def get_authorization_url(redirect_uri: str) -> tuple[str, str, str]:
    """Generates the Google OAuth authorization URL, state token, and code verifier."""
    secrets_path = get_client_secrets_path()
    
    flow = Flow.from_client_secrets_file(
        secrets_path,
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    verifier = getattr(flow, "code_verifier", None)
    return auth_url, state, verifier

def exchange_code_for_token(code: str, state: str, redirect_uri: str, code_verifier: str = None) -> Credentials:
    """Exchanges an authorization code for credentials tokens and saves to token.json."""
    secrets_path = get_client_secrets_path()
    
    flow = Flow.from_client_secrets_file(
        secrets_path,
        scopes=SCOPES,
        state=state,
        redirect_uri=redirect_uri
    )
    
    if code_verifier:
        flow.code_verifier = code_verifier
        
    flow.fetch_token(code=code)
    creds = flow.credentials
    
    # Save the token
    with open(TOKEN_PATH, "w") as token_file:
        token_file.write(creds.to_json())
        
    logger.info("Successfully saved user authentication token to token.json.")
    return creds

def is_connected() -> bool:
    """Simple check to verify if Gmail service has active credentials."""
    try:
        get_gmail_credentials()
        return True
    except Exception:
        return False
