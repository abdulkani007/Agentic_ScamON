import os
import time
import hashlib
import logging
import requests
import subprocess
import json
from datetime import datetime
from typing import Set

from playwright.sync_api import sync_playwright, BrowserContext, Page

from services.sms_collector.config import (
    GOOGLE_MESSAGES_URL,
    USER_DATA_DIR,
    API_ENDPOINT,
    CHECK_INTERVAL,
    SELECTORS
)

# Setup Logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(os.path.abspath(__file__)), "collector.log"), encoding="utf-8")
    ]
)
logger = logging.getLogger("SMSCollector")

class SMSCollector:
    def __init__(self, headful: bool = True):
        self.headful = headful
        self.playwright = None
        self.context: BrowserContext = None
        self.page: Page = None
        self.running = False
        self.processed_signatures: Set[str] = set()
        self.active_case_id = ""
        self.is_first_scan = True

    def _kill_existing_chrome_sessions(self):
        """Kills any chrome.exe processes locking the collector user data directory on Windows."""
        if os.name == "nt":
            try:
                # Target processes that contain our user-data-dir in command line args
                # Normalize user-data-dir path backslashes for exact cmd line match
                normalized_dir = USER_DATA_DIR.replace("\\", "\\\\")
                cmd = (
                    f'Get-WmiObject Win32_Process -Filter "Name = \'chrome.exe\'" | '
                    f'Where-Object {{ $_.CommandLine -like "*{normalized_dir}*" }} | '
                    f'ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force }}'
                )
                subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
                logger.info("Checked and terminated any existing chrome sessions using the collector profile.")
            except Exception as e:
                logger.warning(f"Error checking/killing locked chrome processes: {e}")

    def _update_status_json(self, running: bool, paired: bool, error_message: str = ""):
        """Writes current running telemetry status to a shared status.json file."""
        status_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "status.json")
        try:
            status_data = {
                "running": running,
                "paired": paired,
                "error_message": error_message,
                "last_check_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            with open(status_path, "w", encoding="utf-8") as f:
                json.dump(status_data, f, indent=2)
        except Exception as err:
            logger.error(f"Failed to write status.json: {err}")

    def start(self):
        """Starts the browser automation and begins monitoring."""
        try:
            self._update_status_json(running=True, paired=False, error_message="Initializing Playwright browser context...")
            self._kill_existing_chrome_sessions()
            logger.info("Initializing Playwright browser context...")
            logger.info(f"Persistent User Data directory: {USER_DATA_DIR}")
            os.makedirs(USER_DATA_DIR, exist_ok=True)
            
            self.playwright = sync_playwright().start()
            
            # Launch Chromium with persistent user profile to retain QR pairing state
            self.context = self.playwright.chromium.launch_persistent_context(
                user_data_dir=USER_DATA_DIR,
                headless=not self.headful,
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage"
                ],
                viewport={"width": 1280, "height": 800}
            )
            
            self.page = self.context.new_page()
            self.running = True
            
            self._run_loop()
        except KeyboardInterrupt:
            logger.info("SMS Collector stopped by user interrupt.")
            self._update_status_json(running=False, paired=False, error_message="")
        except Exception as e:
            logger.error(f"Collector initialization/run crash: {e}", exc_info=True)
            self._update_status_json(running=False, paired=False, error_message=f"Crash: {str(e)}")
        finally:
            self.stop()

    def stop(self):
        """Clean shutdown of browser contexts."""
        logger.info("Shutting down Playwright collector...")
        self.running = False
        try:
            if self.context:
                self.context.close()
            if self.playwright:
                self.playwright.stop()
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
        self._update_status_json(running=False, paired=False, error_message="")
        logger.info("Collector shutdown complete.")

    def _run_loop(self):
        """Navigates to portal, handles QR pairing, and executes check loop."""
        logger.info(f"Navigating to Google Messages Web: {GOOGLE_MESSAGES_URL}")
        self.page.goto(GOOGLE_MESSAGES_URL)
        
        # Check for initial pairing page
        self._wait_for_pairing()
        
        logger.info("Inbox successfully loaded. Starting monitoring loop...")
        
        while self.running:
            try:
                # Retrieve active Case ID from ScamON backend if available
                self._fetch_active_case_id()
                
                # Check for new unread messages
                self._scan_unread_messages()
            except Exception as loop_err:
                logger.error(f"Error scanning inbox: {loop_err}")
                
            time.sleep(CHECK_INTERVAL)

    def _wait_for_pairing(self):
        """Prompts user to scan QR code if canvas is visible on portal."""
        logger.info("Checking for pairing status...")
        pairing_check_count = 0
        
        while self.running:
            # Check first if conversation list has rendered (definitely paired)
            list_selector = SELECTORS["conversation_item"]
            conversation_items = self.page.query_selector_all(list_selector)
            if conversation_items:
                logger.info("Google Messages paired session detected.")
                self._update_status_json(running=True, paired=True, error_message="")
                break

            # Check for any button to switch to QR pairing (Google Messages sometimes defaults to Google Account pairing)
            try:
                buttons = self.page.query_selector_all("button, a, div[role='button']")
                for btn in buttons:
                    text = (btn.inner_text() or "").lower()
                    if "qr code" in text or "pair with qr" in text or "qr pairing" in text or "use qr" in text:
                        logger.info(f"Found and clicking pairing button: '{btn.inner_text().strip()}'")
                        btn.click()
                        time.sleep(3)
                        break
            except Exception:
                pass

            # Check for QR canvas element
            canvas_selector = SELECTORS["qr_code_canvas"]
            canvas = self.page.query_selector(canvas_selector)
            
            if canvas:
                pairing_check_count += 1
                self._update_status_json(running=True, paired=False, error_message="Google Messages is not paired.")
                if pairing_check_count % 3 == 1:
                    logger.warning("==========================================================================")
                    logger.warning("[!] ACTION REQUIRED: Google Messages Web QR Code detected.")
                    logger.warning("[!] Please scan the QR code shown in the browser using your mobile device.")
                    logger.warning("==========================================================================")
                time.sleep(4)
            else:
                # Handle loading screen or intermediate states
                time.sleep(2)

    def _fetch_active_case_id(self):
        """Fetch active Case ID from backend to ensure correct vault routing."""
        try:
            # Query backend to retrieve the active Case ID
            res = requests.get("http://127.0.0.1:8001/api/evidence/cases/active", timeout=3)
            if res.status_code == 200:
                data = res.json()
                self.active_case_id = data.get("case_id", "")
        except Exception:
            pass

    def _scan_unread_messages(self):
        """Scans the DOM for unread conversation items and forwards new SMS."""
        # Ensure we check that list items still exist to catch disconnection events
        list_selector = SELECTORS["conversation_item"]
        conversation_items = self.page.query_selector_all(list_selector)
        if not conversation_items:
            # If no items are found after synchronization, verify if the session has logged out
            canvas_selector = SELECTORS["qr_code_canvas"]
            if self.page.query_selector(canvas_selector):
                logger.warning("Google Messages pairing session lost during execution.")
                self._update_status_json(running=True, paired=False, error_message="Google Messages is not paired.")
                return

        unread_selector = SELECTORS["unread_conversation_item"]
        unread_items = self.page.query_selector_all(unread_selector)
        
        if not unread_items:
            self.is_first_scan = False
            return
            
        logger.info(f"Found {len(unread_items)} unread conversation threads.")
        
        for item in unread_items:
            try:
                # Extract Sender Name
                name_elem = item.query_selector(SELECTORS["sender_name"])
                sender = name_elem.inner_text().strip() if name_elem else "Unknown Sender"
                
                # Extract Message Snippet
                snippet_elem = item.query_selector(SELECTORS["message_snippet"])
                message = snippet_elem.inner_text().strip() if snippet_elem else ""
                
                # Extract Timestamp
                time_elem = item.query_selector(SELECTORS["timestamp"])
                timestamp = time_elem.inner_text().strip() if time_elem else datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                if not message:
                    continue

                # Extract conversation ID from a tag href if present
                conversation_id = "unknown"
                try:
                    link_elem = item.query_selector("a")
                    if link_elem:
                        href = link_elem.get_attribute("href") or ""
                        if "conversations/" in href:
                            conversation_id = href.split("conversations/")[-1].split("?")[0]
                except Exception:
                    pass
                
                # Generate unique message_id from content hash
                message_id = f"msg_{hashlib.md5(f'{sender}:{message}:{timestamp}'.encode('utf-8')).hexdigest()[:12]}"

                # Generate deduplication signature
                sig = hashlib.md5(f"{sender}:{message}".encode("utf-8")).hexdigest()
                
                # If this is the first scan on startup, suppress old unread messages from being forwarded
                if self.is_first_scan:
                    self.processed_signatures.add(sig)
                    continue
                
                if sig in self.processed_signatures:
                    continue
                    
                logger.info(f"[+] NEW MESSAGE DETECTED from [{sender}] in conversation {conversation_id}: '{message}'")
                
                # Forward to Backend API
                success = self._forward_to_backend(
                    sender=sender, 
                    message=message, 
                    timestamp=timestamp, 
                    conversation_id=conversation_id, 
                    message_id=message_id
                )
                
                if success:
                    # Click on the item to open thread and mark as read
                    item.click()
                    time.sleep(1)
                    # Add to memory cache
                    self.processed_signatures.add(sig)
                    # Cap cache size to avoid memory growth
                    if len(self.processed_signatures) > 500:
                        self.processed_signatures.pop()
                        
            except Exception as item_err:
                logger.error(f"Error parsing conversation thread item: {item_err}")
                
        # First scan iteration is completed
        self.is_first_scan = False

    def _forward_to_backend(self, sender: str, message: str, timestamp: str, conversation_id: str, message_id: str) -> bool:
        """Sends POST payload to ScamON backend endpoint."""
        payload = {
            "sender": sender,
            "message": message,
            "timestamp": timestamp,
            "conversation_id": conversation_id,
            "message_id": message_id,
            "source": "live_collector",
            "skip_analysis": True
        }
        
        headers = {}
        active_case = ""
        try:
            from database import get_db
            db = get_db()
            if db is not None:
                case_doc = db["cases"].find_one({"status": {"$ne": "Closed"}}, sort=[("updated_at", -1)])
                if case_doc:
                    active_case = case_doc["case_id"]
        except Exception:
            pass
            
        if active_case:
            headers["X-Case-ID"] = active_case
            
        logger.info(f"Posting SMS data to backend API {API_ENDPOINT} (Case: {active_case or 'None'})...")
        
        # Retry loop if backend is temporarily down
        retries = 3
        for attempt in range(retries):
            try:
                res = requests.post(API_ENDPOINT, json=payload, headers=headers, timeout=10)
                if res.status_code == 200:
                    logger.info("[✓] SMS forwarded successfully and analyzed by ScamON AI.")
                    return True
                else:
                    logger.error(f"[X] Backend API returned HTTP {res.status_code}: {res.text}")
            except Exception as api_err:
                logger.error(f"[X] Failed to connect to ScamON backend (Attempt {attempt+1}/{retries}): {api_err}")
            time.sleep(2)
        return False
