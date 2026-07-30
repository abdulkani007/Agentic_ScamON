import os
import logging
from dotenv import load_dotenv
from pymongo import MongoClient

logger = logging.getLogger(__name__)

# Load environment variables from .env (forcing override of process environment)
load_dotenv(override=True)

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "scamon_ai")

_client = None

def get_db_client():
    """Retrieves or initializes the MongoDB Atlas client."""
    global _client
    if _client is not None:
        return _client

    if not MONGO_URI:
        logger.warning(
            "MONGODB_URI/MONGO_URI is not set. Database persistence will be disabled (operating in mock-offline mode)."
        )
        return None

    try:
        logger.info("Initializing MongoDB Atlas connection...")
        # 5-second timeout to prevent stalling startup if connection fails
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Test connection by pinging server
        _client.admin.command("ping")
        print("Connected to MongoDB Atlas")
        logger.info("Connected to MongoDB Atlas")

        # Automatically create required collections if they do not exist
        db = _client[DATABASE_NAME]
        existing_collections = db.list_collection_names()
        required_collections = [
            "website_scans",
            "blocked_websites",
            "call_scans",
            "sms_scans",
            "email_scans",
            "investigation_reports",
            "users",
            "agent_logs",
            "investigations",
            "cases"
        ]
        for col in required_collections:
            if col not in existing_collections:
                db.create_collection(col)
                logger.info(f"Created collection: {col}")
            # Insert a seed document if the collection is empty to materialize it in Atlas UI
            try:
                if db[col].count_documents({}) == 0:
                    db[col].insert_one({
                        "initialized": True,
                        "description": f"ScamON AI - {col.replace('_', ' ').title()} storage node",
                        "system_status": "ONLINE"
                    })
                    logger.info(f"Initialized collection seed: {col}")
            except Exception as seed_err:
                logger.warning(f"Failed to seed collection {col}: {seed_err}")
        try:
            seed_mock_data(db)
            seed_investigations_history(db)
            seed_cases_history(db)
        except Exception as seed_err:
            logger.warning(f"Failed mock data seeding: {seed_err}")

        return _client
    except Exception as err:
        logger.error(
            f"Failed to connect to MongoDB Atlas: {err}. Continuing in offline mock mode."
        )
        _client = InMemoryMockClient()
        db = _client[DATABASE_NAME]
        try:
            seed_mock_data(db)
            seed_investigations_history(db)
            seed_cases_history(db)
        except Exception as seed_err:
            logger.warning(f"Failed mock data seeding in mock database: {seed_err}")
        return _client


def seed_mock_data(db) -> None:
    """Seeds the database with realistic sample scan entries if empty."""
    # Seed website scans
    try:
        # Check if actual user scans exist (excluding initial seed documents)
        if db["website_scans"].count_documents({"url": {"$exists": True}, "initialized": {"$exists": False}}) == 0:
            db["website_scans"].insert_many([
                {
                    "url": "https://secure-login-bank.com",
                    "domain": {
                        "name": "secure-login-bank.com"
                    },
                    "risk_score": 96,
                    "verdict": "PHISHING",
                    "threat_type": "Phishing Link",
                    "recommendation": "This website is highly likely to be phishing. Blocking is strongly recommended.",
                    "timestamp": "2026-07-28 12:45:00 UTC",
                    "screenshot_url": "",
                    "ai_reasoning": {
                        "recommended_action": "BLOCK WEBSITE"
                    }
                },
                {
                    "url": "https://google.com",
                    "domain": {
                        "name": "google.com"
                    },
                    "risk_score": 12,
                    "verdict": "SAFE",
                    "threat_type": "Safe Link",
                    "recommendation": "This website appears safe. Blocking is NOT recommended.",
                    "timestamp": "2026-07-28 13:20:00 UTC",
                    "screenshot_url": "",
                    "ai_reasoning": {
                        "recommended_action": "OPEN WEBSITE"
                    }
                }
            ])
            logger.info("Seeded website scans collection with sample records.")
    except Exception as e:
        logger.warning(f"Failed to seed website scans mock records: {e}")

    # Seed call scans
    try:
        if db["call_scans"].count_documents({"caller": {"$exists": True}, "initialized": {"$exists": False}}) == 0:
            db["call_scans"].insert_many([
                {
                    "caller": "+1-800-123-4567",
                    "risk_score": 88,
                    "threat_category": "Financial Scam",
                    "transcript": "Hello, I am calling from your bank. We detected a suspicious transfer of $5,000 from your account. Please verify your OTP to cancel the transfer...",
                    "timestamp": "2026-07-28 14:10:00 UTC",
                    "ai_analysis": {
                        "threat_category": "Financial Scam"
                    }
                }
            ])
            logger.info("Seeded call scans collection with sample records.")
    except Exception as e:
        logger.warning(f"Failed to seed call scans mock records: {e}")



def seed_investigations_history(db) -> None:
    """Seeds the unified investigations collection with realistic threat history logs if empty."""
    try:
        # Check if actual user scans exist (excluding initial seed documents)
        if db["investigations"].count_documents({"investigation_id": {"$exists": True}}) == 0:
            db["investigations"].insert_many([
                {
                    "user_id": "default_user",
                    "agent_type": "website",
                    "investigation_id": "inv_web_1",
                    "timestamp": "2026-07-29 14:15:32 UTC",
                    "status": "completed",
                    "risk_score": 96,
                    "threat_level": "CRITICAL",
                    "input": "https://secure-login-bank.com",
                    "summary": "Detected credential harvesting phishing page using typosquatted domain.",
                    "recommendation": "Block domain immediately in local hosts file and report to registrar.",
                    "full_report": {
                        "url": "https://secure-login-bank.com",
                        "domain": "secure-login-bank.com",
                        "risk_score": 96,
                        "verdict": "PHISHING",
                        "threat_type": "Phishing Link",
                        "recommendation": "This website is highly likely to be phishing.",
                        "ssl": {"valid": False, "issuer": "Let's Encrypt"},
                        "domain_age": 12,
                        "phishtank": {"blocked": True},
                        "typosquat": {"matches": True}
                    }
                },
                {
                    "user_id": "default_user",
                    "agent_type": "email",
                    "investigation_id": "inv_mail_1",
                    "timestamp": "2026-07-29 13:45:10 UTC",
                    "status": "completed",
                    "risk_score": 85,
                    "threat_level": "HIGH",
                    "input": "Urgent Action Required: Security Alert",
                    "summary": "Phishing email masquerading as account security alert. SPF alignment failed.",
                    "recommendation": "Do not click embedded links. Flag as spam and delete.",
                    "full_report": {
                        "subject": "Urgent Action Required: Security Alert",
                        "sender": "security-alert@paypal-update.com",
                        "receiver": "abbu007jd@gmail.com",
                        "risk_score": 85,
                        "threat_level": "HIGH",
                        "headers_analysis": {"spf": "FAIL", "dkim": "PASS", "dmarc": "FAIL"},
                        "snippet": "We noticed a suspicious transaction on your account. Please log in to confirm your identity."
                    }
                },
                {
                    "user_id": "default_user",
                    "agent_type": "call",
                    "investigation_id": "inv_call_1",
                    "timestamp": "2026-07-29 11:20:45 UTC",
                    "status": "completed",
                    "risk_score": 90,
                    "threat_level": "CRITICAL",
                    "input": "+1-800-455-2287",
                    "summary": "IRS tax debt collection impersonation. Used high pressure and urgency indicators.",
                    "recommendation": "Hang up immediately. Do not share payment details.",
                    "full_report": {
                        "caller": "+1-800-455-2287",
                        "transcript": "Hello, I am Agent Williams calling from the Internal Revenue Service. A lawsuit has been filed against you for unpaid taxes. If you do not pay $5,000 immediately, local police will issue a warrant for your arrest.",
                        "risk_score": 90,
                        "threat_category": "Financial Scam",
                        "confidence": "HIGH"
                    }
                },
                {
                    "user_id": "default_user",
                    "agent_type": "live_call",
                    "investigation_id": "inv_live_1",
                    "timestamp": "2026-07-29 10:12:15 UTC",
                    "status": "completed",
                    "risk_score": 55,
                    "threat_level": "MEDIUM",
                    "input": "Live Session (35s)",
                    "summary": "Detected suspect verification code/OTP request. Recommended verification.",
                    "recommendation": "Be cautious. Verify caller identity using official channels.",
                    "full_report": {
                        "duration": "00:35",
                        "transcript": "Hey, I am from support. I sent a verification code to your phone. Can you read it to me?",
                        "risk_score": 55,
                        "category": "Verification Scam",
                        "confidence": "MEDIUM"
                    }
                },
                {
                    "user_id": "default_user",
                    "agent_type": "complaint",
                    "investigation_id": "inv_comp_1",
                    "timestamp": "2026-07-29 09:05:00 UTC",
                    "status": "completed",
                    "risk_score": 0,
                    "threat_level": "SAFE",
                    "input": "FTC Report: secure-login-bank.com",
                    "summary": "Generated and sent official cybercrime complaint package to FTC.",
                    "recommendation": "Report successfully completed and archived.",
                    "full_report": {
                        "complaint_id": "comp-77d-81",
                        "recipient": "complaints@ftc.gov",
                        "cc": "compliance@cybercrime.gov",
                        "subject": "Official Cybercrime Complaint: secure-login-bank.com",
                        "attachments": ["/static/complaints/comp-77d-81/Complaint.pdf", "/static/complaints/comp-77d-81/Evidence_Report.pdf"],
                        "status": "DELIVERED"
                    }
                },
                {
                    "user_id": "default_user",
                    "agent_type": "xai",
                    "investigation_id": "inv_xai_1",
                    "timestamp": "2026-07-28 17:30:00 UTC",
                    "status": "completed",
                    "risk_score": 75,
                    "threat_level": "HIGH",
                    "input": "AI Explainability Audit",
                    "summary": "XAI forensic summary detailing correlation of domain registry age and SPF failures.",
                    "recommendation": "System audited for compliance checks.",
                    "full_report": {
                        "summary": "Overall investigation report indicates a high-threat alignment mismatch. SPF records failed validation, combined with a domain age of less than 30 days, suggesting a highly targeted spear-phishing run.",
                        "risk": "HIGH",
                        "agents_involved": ["Email Agent", "Website Agent", "Threat Intelligence Agent"],
                        "language": "English",
                        "voice_generated": False
                    }
                },
                {
                    "user_id": "default_user",
                    "agent_type": "threat_correlation",
                    "investigation_id": "inv_corr_1",
                    "timestamp": "2026-07-28 16:15:00 UTC",
                    "status": "completed",
                    "risk_score": 82,
                    "threat_level": "HIGH",
                    "input": "Correlation Scan",
                    "summary": "Threat correlation identified domain registry overlap with known phishing campaign.",
                    "recommendation": "Quarantine all inbound traffic from this domain block.",
                    "full_report": {
                        "campaign_name": "Targeted Bank Spoofing",
                        "correlated_domains": ["paypal-update.com", "secure-login-bank.com"],
                        "shared_registrar": "NameCheap",
                        "ip_subnet": "192.168.4.0/24"
                    }
                }
            ])
            logger.info("Seeded unified investigations history collection.")
    except Exception as e:
        logger.warning(f"Failed to seed investigations mock records: {e}")


def seed_cases_history(db) -> None:
    """Seeds the cases collection with realistic Case Folder history logs if empty."""
    try:
        if db["cases"].count_documents({"case_id": {"$exists": True}}) == 0:
            db["cases"].insert_many([
                {
                    "case_id": "SCAMON-2026-000001",
                    "user_id": "default_user",
                    "created_at": "2026-07-28 12:45:00 UTC",
                    "updated_at": "2026-07-28 16:15:00 UTC",
                    "status": "Closed",
                    "overall_risk_score": 82,
                    "overall_threat_level": "HIGH",
                    "agents_used": ["website", "threat_correlation"],
                    "evidence": {
                        "website": {
                            "agent_source": "website",
                            "generated_by": "Website Investigation Agent",
                            "creation_time": "2026-07-28 12:45:00 UTC",
                            "last_modified_time": "2026-07-28 12:45:00 UTC",
                            "integrity_hash": "2024ff001c29bb201f8d485747063de2",
                            "data": {
                                "url": "https://secure-login-bank.com",
                                "domain": "secure-login-bank.com",
                                "risk_score": 82,
                                "verdict": "SUSPICIOUS",
                                "ssl": {"valid": True, "issuer": "Let's Encrypt"},
                                "domain_age": 12
                            }
                        },
                        "threat_correlation": {
                            "agent_source": "threat_correlation",
                            "generated_by": "Threat Correlation Agent",
                            "creation_time": "2026-07-28 16:15:00 UTC",
                            "last_modified_time": "2026-07-28 16:15:00 UTC",
                            "integrity_hash": "993deff8812c29bc119b48574a0088cc",
                            "data": {
                                "campaign_name": "Targeted Bank Spoofing",
                                "correlated_domains": ["paypal-update.com", "secure-login-bank.com"],
                                "shared_registrar": "NameCheap",
                                "ip_subnet": "192.168.4.0/24"
                            }
                        }
                    },
                    "reports": {}
                },
                {
                    "case_id": "SCAMON-2026-000002",
                    "user_id": "default_user",
                    "created_at": "2026-07-29 13:45:00 UTC",
                    "updated_at": "2026-07-29 14:15:32 UTC",
                    "status": "Analysis Completed",
                    "overall_risk_score": 96,
                    "overall_threat_level": "CRITICAL",
                    "agents_used": ["website", "email"],
                    "evidence": {
                        "website": {
                            "agent_source": "website",
                            "generated_by": "Website Investigation Agent",
                            "creation_time": "2026-07-29 14:15:32 UTC",
                            "last_modified_time": "2026-07-29 14:15:32 UTC",
                            "integrity_hash": "1111ff001c29bb201f8d485747063de2",
                            "data": {
                                "url": "https://secure-login-bank.com",
                                "domain": "secure-login-bank.com",
                                "risk_score": 96,
                                "verdict": "PHISHING",
                                "ssl": {"valid": False, "issuer": "Let's Encrypt"},
                                "domain_age": 12
                            }
                        },
                        "email": {
                            "agent_source": "email",
                            "generated_by": "Email Investigation Agent",
                            "creation_time": "2026-07-29 13:45:10 UTC",
                            "last_modified_time": "2026-07-29 13:45:10 UTC",
                            "integrity_hash": "8888deff8812c29bc119b48574a0088cc",
                            "data": {
                                "subject": "Urgent Action Required",
                                "sender": "security-alert@paypal-update.com",
                                "headers_analysis": {"spf": "FAIL", "dkim": "PASS", "dmarc": "FAIL"}
                            }
                        }
                    },
                    "reports": {
                        "xai_summary": {
                            "overall_summary": "Synthesized critical security alert on credential harvesting vectors.",
                            "overall_risk": {"risk_score": 96, "threat_level": "CRITICAL", "confidence": 95},
                            "findings": {"website": ["Newly registered typosquatted domain."], "email": ["SPF configuration failed."]}
                        }
                    }
                },
                {
                    "case_id": "SCAMON-2026-000003",
                    "user_id": "default_user",
                    "created_at": "2026-07-29 14:30:00 UTC",
                    "updated_at": "2026-07-29 14:30:00 UTC",
                    "status": "Investigating",
                    "overall_risk_score": 12,
                    "overall_threat_level": "SAFE",
                    "agents_used": ["website"],
                    "evidence": {
                        "website": {
                            "agent_source": "website",
                            "generated_by": "Website Investigation Agent",
                            "creation_time": "2026-07-29 14:30:00 UTC",
                            "last_modified_time": "2026-07-29 14:30:00 UTC",
                            "integrity_hash": "2222ff001c29bb201f8d485747063de2",
                            "data": {
                                "url": "https://google.com",
                                "domain": "google.com",
                                "risk_score": 12,
                                "verdict": "SAFE",
                                "ssl": {"valid": True, "issuer": "Google Trust Services"},
                                "domain_age": 10250
                            }
                        }
                    },
                    "reports": {}
                }
            ])
            logger.info("Seeded cases history collection.")
    except Exception as e:
        logger.warning(f"Failed to seed cases history mock records: {e}")


def get_db():
    """Retrieves the active database instance."""
    client = get_db_client()
    if client is None:
        return None
    return client[DATABASE_NAME]


class MockCursor:
    def __init__(self, items):
        self.items = items

    def sort(self, key, direction=-1):
        # Sort in memory
        try:
            self.items.sort(key=lambda x: x.get(key) or "", reverse=(direction == -1))
        except Exception:
            pass
        return self

    def limit(self, count):
        self.items = self.items[:count]
        return self

    def __iter__(self):
        return iter(self.items)

    def __next__(self):
        if not hasattr(self, "_iter_obj"):
            self._iter_obj = iter(self.items)
        try:
            return next(self._iter_obj)
        except StopIteration:
            raise StopIteration


class MockCollection:
    def __init__(self, name):
        self.name = name
        self.store = []

    def find_one(self, query, sort=None):
        cursor = self.find(query)
        if sort:
            # sort is a list of tuples like [('case_id', -1)]
            for key, direction in sort:
                cursor.sort(key, direction)
        results = list(cursor)
        return results[0] if results else None

    def insert_one(self, doc):
        from bson import ObjectId
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        self.store.append(doc)
        class InsertResult:
            inserted_id = doc["_id"]
        return InsertResult()

    def insert_many(self, docs):
        from bson import ObjectId
        for doc in docs:
            if "_id" not in doc:
                doc["_id"] = ObjectId()
            self.store.append(doc)
        return True

    def update_one(self, query, update):
        doc = self.find_one(query)
        if doc and "$set" in update:
            doc.update(update["$set"])
        class UpdateResult:
            matched_count = 1 if doc else 0
            modified_count = 1 if doc else 0
        return UpdateResult()

    def delete_one(self, query):
        doc = self.find_one(query)
        if doc:
            self.store.remove(doc)
        class DeleteResult:
            deleted_count = 1 if doc else 0
        return DeleteResult()

    def find(self, query=None):
        query = query or {}
        results = []
        for item in self.store:
            match = True
            for k, v in query.items():
                if k == "$or":
                    or_match = False
                    for subquery in v:
                        sub_match = True
                        for sk, sv in subquery.items():
                            val = item.get(sk)
                            if isinstance(sv, dict) and "$regex" in sv:
                                import re
                                if not re.search(sv["$regex"], str(val or ""), re.IGNORECASE):
                                    sub_match = False
                                    break
                            elif val != sv:
                                sub_match = False
                                break
                        if sub_match:
                            or_match = True
                            break
                    if not or_match:
                        match = False
                        break
                elif k == "status" and isinstance(v, dict) and "$ne" in v:
                    if item.get(k) == v["$ne"]:
                        match = False
                        break
                else:
                    val = item.get(k)
                    if isinstance(v, dict) and "$regex" in v:
                        import re
                        if not re.search(v["$regex"], str(val or ""), re.IGNORECASE):
                            match = False
                            break
                    elif val != v:
                        match = False
                        break
            if match:
                results.append(item)
        return MockCursor(results)

    def count_documents(self, query=None):
        query = query or {}
        return len(list(self.find(query)))


class InMemoryMockDatabase:
    def __init__(self):
        self.collections = {}

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

    def list_collection_names(self):
        return list(self.collections.keys())

    def create_collection(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)


class InMemoryMockClient:
    def __init__(self):
        self.db = InMemoryMockDatabase()

    def __getitem__(self, name):
        return self.db

    def admin(self):
        class AdminMock:
            def command(self, cmd):
                return True
        return AdminMock()

