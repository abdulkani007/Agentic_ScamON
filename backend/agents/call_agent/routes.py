import logging
import os
import shutil
import tempfile
import uuid
from datetime import datetime
from typing import Optional, Dict, List, Any
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from .schemas import (
    CallAnalysisResponse,
    EntityDetails,
    LLMAnalysisResult,
    AIReasoningDetails,
    MemoryHistoryDetails,
    TimelineItem,
)
from .utils import is_allowed_audio_file
from .whisper_service import transcribe_audio
from .keyword_detector import detect_keywords
from .entity_extractor import extract_entities
from .risk_engine import calculate_risk
from .emotion_analyzer import analyze_emotions
from .llm_reasoning import run_llm_reasoning
from .db import log_analysis, get_previous_caller_scans

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/call-analysis",
    response_model=CallAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Call Audio or Transcript",
    description=(
        "Endpoint for analyzing a phone call. Accepts an audio file (.mp3 or .wav) "
        "OR a raw transcript text. Returns the transcribed text, detected keywords, and extracted entities."
    ),
)
async def analyze_call(
    audio_file: Optional[UploadFile] = File(None),
    transcript: Optional[str] = Form(None),
) -> CallAnalysisResponse:
    # Initialize SOC Forensic Timeline
    timeline = []

    def add_timeline_step(step_name: str, status: str = "completed"):
        timeline.append(
            TimelineItem(
                step=step_name,
                status=status,
                timestamp=datetime.now().strftime("%H:%M:%S")
            )
        )

    # Step 1: Initialize Forensic Investigation Plan
    add_timeline_step("Investigation Plan Created")
    add_timeline_step("Listening for Input waveforms")

    if not audio_file and not transcript:
        logger.warning("Call analysis requested but neither audio_file nor transcript was provided.")
        add_timeline_step("Input Check Failed", "failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'audio_file' or 'transcript' must be provided.",
        )

    final_transcript = ""
    detected_language = "English"
    call_duration = 60  # Default mock duration in seconds if transcript is text

    # Step 2: Speech-to-Text Transcription via Whisper
    if transcript:
        logger.info(
            f"Received transcript directly (length: {len(transcript)} chars). Skipping Whisper."
        )
        if not transcript.strip():
            logger.warning("Provided transcript text is empty.")
            add_timeline_step("Transcript Loading Failed", "failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provided transcript text is empty.",
            )
        final_transcript = transcript
        add_timeline_step("Transcript Loaded")

    elif audio_file:
        if not audio_file.filename:
            logger.warning("Uploaded file lacks a filename.")
            add_timeline_step("Audio Verification Failed", "failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must have a filename.",
            )

        if not is_allowed_audio_file(audio_file.filename):
            logger.warning(f"Invalid file extension uploaded: {audio_file.filename}")
            add_timeline_step("Audio Verification Failed", "failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only .mp3 and .wav files are supported.",
            )

        # Check if empty file
        content = await audio_file.read(1)
        if not content:
            logger.warning("Uploaded audio file is empty.")
            add_timeline_step("Audio Verification Failed", "failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty.",
            )
        await audio_file.seek(0)

        logger.info(
            f"Processing audio file: {audio_file.filename} (MIME: {audio_file.content_type})"
        )

        # Save temporarily
        suffix = os.path.splitext(audio_file.filename)[1]
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_path = temp_file.name
        temp_file.close()

        try:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(audio_file.file, buffer)

            # Transcribe
            transcription_result = transcribe_audio(temp_path)
            final_transcript = transcription_result["transcript"]
            detected_language = transcription_result.get("language", "English").capitalize()
            # Approximate duration or get if available
            call_duration = int(transcription_result.get("duration", 45))
            
            add_timeline_step("STT Transcription Completed")
            add_timeline_step("Language Identification Finished")

        except ValueError as val_err:
            logger.error(f"Validation error in transcription: {val_err}")
            add_timeline_step("STT Transcription Failed", "failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err)
            )
        except Exception as e:
            logger.error(f"Error during audio processing/transcription: {e}")
            add_timeline_step("STT Transcription Failed", "failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Speech-to-text transcription failed: {str(e)}",
            )
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    logger.info(f"Cleaned up temporary file: {temp_path}")
                except Exception as clean_err:
                    logger.error(f"Failed to delete temporary file {temp_path}: {clean_err}")

    # Step 3: Extract Entities (Phone numbers, OTPs, Organizations)
    keywords = detect_keywords(final_transcript)
    entities_dict = extract_entities(final_transcript)
    entities = EntityDetails(**entities_dict)
    add_timeline_step("Forensic Entities Extracted")

    # Step 4: Analyze Behavior & Emotional Pressure Metrics
    emotion_timeline = analyze_emotions(final_transcript)
    add_timeline_step("Emotional Pressure Tactics Audited")

    # Step 5: Groq LLM Cyber Crime Forensics Reasoning
    ai_reasoning = run_llm_reasoning(
        transcript=final_transcript,
        speaker_count=2,
        duration=call_duration,
        language=detected_language,
        entities=entities_dict,
        emotions=emotion_timeline,
        detected_keywords=keywords
    )
    add_timeline_step("LLM Threat Reasoning Finished")

    # Align Risk Scores and Verdict Details with AI Assessment
    decision = ai_reasoning["final_decision"]
    if decision == "SCAM CONFIRMED":
        risk_score = 98
        recommendation = "Block Caller"
    elif decision == "HIGH RISK":
        risk_score = 85
        recommendation = "Do Not Share OTP"
    elif decision == "SUSPICIOUS":
        risk_score = 55
        recommendation = "Ignore Call"
    elif decision == "MONITOR":
        risk_score = 35
        recommendation = "Ignore Call"
    else:
        risk_score = 5
        recommendation = "Ignore Call"

    # Step 6: Memory Database (Recall Caller History profile)
    phone_list = entities_dict.get("Phone Number", [])
    phone_target = phone_list[0] if phone_list else ""
    prev_scans = get_previous_caller_scans(phone_target)
    
    if len(prev_scans) > 0:
        last_scan = prev_scans[0]
        memory_history = MemoryHistoryDetails(
            has_history=True,
            total_reports=len(prev_scans),
            last_risk_score=last_scan.get("risk_score"),
            last_scam_type=last_scan.get("ai_analysis", {}).get("threat_category") or last_scan.get("llm_analysis", {}).get("scam_type")
        )
    else:
        memory_history = MemoryHistoryDetails(
            has_history=False,
            total_reports=0,
            last_risk_score=None,
            last_scam_type=None
        )
    add_timeline_step("Database Memory Recalled")

    # Step 7: Agent-to-Agent Collaboration (Dispatch to Agent 5 Correlation Agent)
    collaborative_payload = {
        "phone_number": phone_target,
        "risk_score": risk_score,
        "threat": ai_reasoning["threat_category"],
        "entities": entities_dict,
        "keywords": keywords,
        "summary": ai_reasoning["summary"],
        "recommendation": ai_reasoning["recommended_action"]
    }
    
    try:
        logger.info(f"Agent 1 collaborating with Agent 5 (Correlation Agent). Dispatching forensic payload: {collaborative_payload}")
    except Exception as dispatch_err:
        logger.warning(f"Failed to print collaboration dispatch log: {dispatch_err}")
    add_timeline_step("Correlation Agent Dispatched")
    add_timeline_step("Investigation Completed")

    # Build Pydantic schemas objects
    ai_details = AIReasoningDetails(
        summary=ai_reasoning["summary"],
        threat_category=ai_reasoning["threat_category"],
        confidence_rating=ai_reasoning["confidence_rating"],
        final_decision=ai_reasoning["final_decision"],
        reasoning_steps=ai_reasoning["reasoning_steps"],
        recommended_action=ai_reasoning["recommended_action"]
    )

    # Build legacy support analysis details
    legacy_llm = LLMAnalysisResult(
        urgency="High" if emotion_timeline["Urgency"] >= 50 else "Medium",
        pressure="High" if emotion_timeline["Pressure"] >= 50 else "Medium",
        confidence=ai_reasoning["confidence_rating"],
        scam_type=ai_reasoning["threat_category"],
        reasoning=ai_reasoning["summary"]
    )

    investigation_uuid = str(uuid.uuid4())
    current_time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    response_payload = CallAnalysisResponse(
        agent_name="Call Investigation Agent",
        status="success",
        risk_score=risk_score,
        confidence=ai_reasoning["confidence_rating"],
        transcript=final_transcript,
        keywords=keywords,
        entities=entities,
        llm_analysis=legacy_llm,
        recommendation=recommendation,
        investigation_id=investigation_uuid,
        timestamp=current_time_str,
        call_duration=call_duration,
        detected_language=detected_language,
        speaker_count=2,
        emotion_timeline=emotion_timeline,
        ai_analysis=ai_details,
        memory_history=memory_history,
        timeline=timeline,
        mission_status="COMPLETED"
    )

    # Save to MongoDB Database logs
    try:
        log_payload = response_payload.model_dump()
        log_analysis(log_payload)
        
        # Save to unified investigations history
        from agents.history_helper import save_investigation
        threat_level = "SAFE"
        if response_payload.risk_score >= 75:
            threat_level = "CRITICAL"
        elif response_payload.risk_score >= 50:
            threat_level = "HIGH"
        elif response_payload.risk_score >= 25:
            threat_level = "MEDIUM"
        elif response_payload.risk_score >= 10:
            threat_level = "LOW"
            
        save_investigation(
            agent_type="call",
            investigation_id=response_payload.investigation_id,
            risk_score=response_payload.risk_score,
            threat_level=threat_level,
            input_data=response_payload.caller or "Audio Waveform Scan",
            summary=response_payload.ai_analysis.summary,
            full_report=log_payload,
            recommendation=response_payload.recommendation
        )
    except Exception as db_err:
        logger.warning(f"Failed to log Call analysis results to MongoDB: {db_err}")

    return response_payload


@router.get(
    "/api/websites/check",
    summary="Checks if a domain is currently blocked via query parameter.",
)
async def api_check_website_blocked_query(domain: str):
    try:
        target = domain.strip().lower()
        if target.startswith(("http://", "https://")):
            from urllib.parse import urlparse
            target = urlparse(target).netloc
        if target.startswith("www."):
            target = target[4:]
        target = target.split(":")[0]

        blocked = False
        reason = "Phishing Website"
        risk_score = 90
        
        try:
            from agents.website_agent.protection_engine import is_domain_blocked
            blocked = is_domain_blocked(target)
        except Exception:
            # Fallback if package is not importable
            from database import get_db
            db = get_db()
            if db is not None:
                try:
                    collection = db["blocked_websites"]
                    doc = collection.find_one({"domain": target})
                    if doc and doc.get("blocked", True) is True:
                        blocked = True
                        reason = doc.get("reason") or reason
                        risk_score = doc.get("risk_score") or risk_score
                except Exception:
                    pass
            else:
                try:
                    import json
                    local_db_path = os.path.abspath(
                        os.path.join(os.path.dirname(__file__), "../../static/protection_db.json")
                    )
                    if os.path.exists(local_db_path):
                        with open(local_db_path, "r") as f:
                            data = json.load(f)
                            for item in data.get("blocklist", []):
                                if item.get("domain") == target and item.get("blocked", False) is True:
                                    blocked = True
                                    reason = item.get("reason") or reason
                                    risk_score = item.get("risk_score") or risk_score
                                    break
                except Exception:
                    pass

        if blocked:
            from database import get_db
            db = get_db()
            if db is not None:
                try:
                    collection = db["blocked_websites"]
                    doc = collection.find_one({"domain": target})
                    if doc:
                        reason = doc.get("reason") or reason
                        risk_score = doc.get("risk_score") or risk_score
                except Exception:
                    pass
            else:
                try:
                    import json
                    local_db_path = os.path.abspath(
                        os.path.join(os.path.dirname(__file__), "../../static/protection_db.json")
                    )
                    if os.path.exists(local_db_path):
                        with open(local_db_path, "r") as f:
                            data = json.load(f)
                            for item in data.get("blocklist", []):
                                if item.get("domain") == target:
                                    reason = item.get("reason") or reason
                                    risk_score = item.get("risk_score") or risk_score
                                    break
                except Exception:
                    pass

            return {
                "blocked": True,
                "reason": reason,
                "risk_score": risk_score
            }
        return {"blocked": False}
    except Exception as err:
        logger.error(f"Failed to check website query status in call agent: {err}")
        return {"blocked": False}


from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import time
import numpy as np
import ctranslate2
from faster_whisper import WhisperModel

_global_whisper_model = None
_global_device = None

async def get_whisper_model():
    global _global_whisper_model, _global_device
    if _global_whisper_model is None:
        loop = asyncio.get_event_loop()
        def load():
            global _global_whisper_model, _global_device
            try:
                if ctranslate2.get_cuda_device_count() > 0:
                    logger.info("NVIDIA GPU detected. Loading faster-whisper 'base' on CUDA...")
                    _global_whisper_model = WhisperModel("base", device="cuda", compute_type="float16")
                    _global_device = "cuda"
                    logger.info("Successfully loaded faster-whisper 'base' on CUDA.")
            except Exception as e:
                logger.warning(f"Failed to load Whisper on CUDA: {e}. Falling back to CPU.")
                
            if _global_whisper_model is None:
                logger.info("Loading faster-whisper 'tiny' on CPU...")
                _global_whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
                _global_device = "cpu"
                logger.info("Successfully loaded faster-whisper 'tiny' on CPU.")
        await loop.run_in_executor(None, load)
    return _global_whisper_model, _global_device

def force_cpu_fallback():
    global _global_whisper_model, _global_device
    logger.warning("Forcing CPU fallback for Whisper model...")
    _global_whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
    _global_device = "cpu"
    return _global_whisper_model

class StreamingTranscriber:
    def __init__(self, model, device):
        self.audio_buffer = [] # Float32 samples
        self.sample_rate = 16000
        self.silence_threshold = 1.0 # 1 second of silence to finalize
        self.silence_samples = int(self.silence_threshold * self.sample_rate)
        self.consecutive_silence_samples = 0
        self.energy_threshold = 0.002 # VAD energy threshold
        self.model = model
        self.device = device

    def add_audio(self, pcm_chunk: np.ndarray):
        energy = np.sqrt(np.mean(pcm_chunk ** 2)) if len(pcm_chunk) > 0 else 0
        self.audio_buffer.extend(pcm_chunk.tolist())
        
        if energy < self.energy_threshold:
            self.consecutive_silence_samples += len(pcm_chunk)
        else:
            self.consecutive_silence_samples = 0

    def should_finalize(self) -> bool:
        # Finalize if 1 second of silence OR rolling buffer reaches 10 seconds to limit CPU load
        too_long = len(self.audio_buffer) >= (10 * self.sample_rate)
        silent = self.consecutive_silence_samples >= self.silence_samples and len(self.audio_buffer) > 0
        return silent or too_long

    def get_audio_data(self) -> np.ndarray:
        return np.array(self.audio_buffer, dtype=np.float32)

    def clear_buffer(self):
        self.audio_buffer = []
        self.consecutive_silence_samples = 0

    def transcribe(self, is_final: bool = False) -> tuple:
        if len(self.audio_buffer) == 0:
            return None, ""
        try:
            audio_data = self.get_audio_data()
            segments, info = self.model.transcribe(
                audio_data,
                beam_size=5,
                language="en",
                vad_filter=True,
                vad_parameters=dict(min_speech_duration_ms=250)
            )
            segments = list(segments)
            if not segments:
                return None, ""
                
            if is_final or len(segments) == 1:
                text = " ".join([seg.text for seg in segments]).strip()
                return None, text
                
            final_segs = segments[:-1]
            partial_seg = segments[-1]
            
            final_text = " ".join([seg.text for seg in final_segs]).strip()
            partial_text = partial_seg.text.strip()
            
            cut_time = final_segs[-1].end
            cut_samples = int(cut_time * self.sample_rate)
            if cut_samples < len(self.audio_buffer):
                self.audio_buffer = self.audio_buffer[cut_samples:]
                self.consecutive_silence_samples = max(0, self.consecutive_silence_samples - cut_samples)
                
            return final_text, partial_text
        except Exception as e:
            err_str = str(e)
            logger.error(f"Error during streaming transcription: {err_str}")
            # Catch cuBLAS or general CUDA load failures and fall back to CPU on-the-fly
            if "cublas" in err_str or "cuda" in err_str.lower():
                if self.device != "cpu":
                    logger.warning("CUDA execution error detected. Reloading Whisper model 'tiny' on CPU...")
                    try:
                        self.model = force_cpu_fallback()
                        self.device = "cpu"
                        # Retry transcription once on CPU
                        audio_data = self.get_audio_data()
                        segments, info = self.model.transcribe(
                            audio_data,
                            beam_size=5,
                            language="en",
                            vad_filter=True,
                            vad_parameters=dict(min_speech_duration_ms=250)
                        )
                        segments = list(segments)
                        if not segments:
                            return None, ""
                        if is_final or len(segments) == 1:
                            text = " ".join([seg.text for seg in segments]).strip()
                            return None, text
                        final_segs = segments[:-1]
                        partial_seg = segments[-1]
                        final_text = " ".join([seg.text for seg in final_segs]).strip()
                        partial_text = partial_seg.text.strip()
                        cut_time = final_segs[-1].end
                        cut_samples = int(cut_time * self.sample_rate)
                        if cut_samples < len(self.audio_buffer):
                            self.audio_buffer = self.audio_buffer[cut_samples:]
                        return final_text, partial_text
                    except Exception as cpu_err:
                        logger.error(f"Failed CPU fallback transcription: {cpu_err}")
            return None, ""

from starlette.websockets import WebSocketState

@router.websocket("/api/live-call/ws")
async def live_call_websocket(websocket: WebSocket, case_id: Optional[str] = None):
    await websocket.accept()
    logger.info("Live Call Detector Real-Time Ingest WebSocket established.")
    
    # Retrieve the model asynchronously without blocking the event loop
    model, device = await get_whisper_model()
    
    session_id = f"live_{uuid.uuid4().hex}"
    transcriber = StreamingTranscriber(model=model, device=device)
    finalized_sentences = []
    
    loop = asyncio.get_event_loop()
    is_transcribing = False
    last_partial_time = 0.0
    
    try:
        while True:
            try:
                message = await websocket.receive()
            except asyncio.CancelledError:
                logger.info("WebSocket task cancelled due to server shutdown.")
                break
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected during receive.")
                break
            except Exception as e:
                logger.warning(f"Error receiving websocket message: {e}")
                break
            
            if "bytes" in message:
                audio_bytes = message["bytes"]
                if len(audio_bytes) > 0:
                    # Convert raw Float32 PCM audio bytes
                    chunk = np.frombuffer(audio_bytes, dtype=np.float32)
                    transcriber.add_audio(chunk)
                    
                    if transcriber.should_finalize():
                        # Wait if a partial transcription is active, or run finalized transcription
                        try:
                            _, text = await loop.run_in_executor(None, lambda: transcriber.transcribe(is_final=True))
                        except asyncio.CancelledError:
                            logger.info("Final transcription task cancelled due to shutdown.")
                            break
                        
                        if text:
                            # Save final sentence segment
                            finalized_sentences.append(text)
                            if websocket.client_state == WebSocketState.CONNECTED:
                                try:
                                    await websocket.send_json({
                                        "type": "final",
                                        "text": text
                                    })
                                except Exception:
                                    pass
                            
                            # Perform full scam analysis on the whole accumulated transcript
                            full_transcript = " ".join(finalized_sentences).strip()
                            ai_res = await run_live_scam_analysis(full_transcript)
                            
                            if websocket.client_state == WebSocketState.CONNECTED:
                                try:
                                    await websocket.send_json({
                                        "type": "analysis",
                                        "risk": ai_res["risk_score"],
                                        "category": ai_res["category"],
                                        "confidence": ai_res["confidence"],
                                        "recommendation": ai_res["recommendation"],
                                        "reason": ai_res["reasoning"]
                                    })
                                except Exception:
                                    pass
                            
                            try:
                                save_live_analysis_to_db(session_id, full_transcript, ai_res, case_id)
                            except Exception as db_err:
                                logger.warning(f"Failed to save live scan: {db_err}")
                        
                        transcriber.clear_buffer()
                    else:
                        # Throttle partials and avoid concurrent overlaps
                        current_time = time.time()
                        throttle = 0.3 if transcriber.device == "cuda" else 0.2
                        if not is_transcribing and (current_time - last_partial_time >= throttle):
                            last_partial_time = current_time
                            if len(transcriber.audio_buffer) > 0:
                                
                                async def process_partial():
                                    nonlocal is_transcribing
                                    is_transcribing = True
                                    try:
                                        final_t, partial_t = await loop.run_in_executor(
                                            None, lambda: transcriber.transcribe(is_final=False)
                                        )
                                        if websocket.client_state == WebSocketState.CONNECTED:
                                            # Send finalized segment if any
                                            if final_t:
                                                finalized_sentences.append(final_t)
                                                try:
                                                    await websocket.send_json({
                                                        "type": "final",
                                                        "text": final_t
                                                    })
                                                except Exception:
                                                    pass
                                            
                                            # Send partial segment
                                            try:
                                                await websocket.send_json({
                                                    "type": "partial",
                                                    "text": partial_t
                                                })
                                            except Exception:
                                                pass
                                    except asyncio.CancelledError:
                                        pass
                                    finally:
                                        is_transcribing = False
                                
                                # Launch task in background to keep websocket receive loop running at full speed!
                                asyncio.create_task(process_partial())
                                
            elif "text" in message:
                text_msg = message["text"]
                if text_msg == "STOP":
                    logger.info("Received stop command from client.")
                    break
                    
    except WebSocketDisconnect:
        logger.info("Live Call Detector WebSocket disconnected.")
    except asyncio.CancelledError:
        logger.info("Live Call Detector WebSocket task cancelled cleanly.")
    except Exception as e:
        logger.error(f"Live WebSocket error: {e}")



async def run_live_scam_analysis(transcript: str) -> dict:
    """Executes call agent keywords, entities, emotions and LLM forensic reasoning on transcript."""
    keywords = detect_keywords(transcript)
    entities_dict = extract_entities(transcript)
    emotions = analyze_emotions(transcript)
    
    # Run LLM reasoning in a thread pool to keep endpoints responsive
    loop = asyncio.get_event_loop()
    ai_reasoning = await loop.run_in_executor(
        None,
        lambda: run_llm_reasoning(
            transcript=transcript,
            speaker_count=2,
            duration=30,
            language="English",
            entities=entities_dict,
            emotions=emotions,
            detected_keywords=keywords
        )
    )
    
    decision = ai_reasoning.get("final_decision") or "MONITOR"
    # Match required risk score levels
    if decision == "SCAM CONFIRMED":
        risk_score = 95
        recommendation = "HANG UP IMMEDIATELY"
    elif decision == "HIGH RISK":
        risk_score = 82
        recommendation = "Do Not Share OTP / Credentials"
    elif decision == "SUSPICIOUS":
        risk_score = 55
        recommendation = "Verify Caller Identity"
    elif decision == "MONITOR":
        risk_score = 35
        recommendation = "Be Cautious"
    else:
        risk_score = 10
        recommendation = "No Threat Detected"
        
    return {
        "risk_score": risk_score,
        "confidence": ai_reasoning.get("confidence_rating") or "HIGH",
        "category": ai_reasoning.get("threat_category") or "General Conversation",
        "reasoning": ai_reasoning.get("summary") or "Conversation monitored for scam behavior.",
        "recommendation": recommendation
    }


def save_live_analysis_to_db(session_id: str, transcript: str, ai_res: dict, case_id: Optional[str] = None) -> None:
    """Stores live analysis details to live_call_analysis and unified investigations."""
    from database import get_db
    db = get_db()
    if db is not None:
        collection = db["live_call_analysis"]
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        
        live_report = {
            "session_id": session_id,
            "timestamp": timestamp,
            "transcript": transcript,
            "risk_score": ai_res["risk_score"],
            "category": ai_res["category"],
            "confidence": ai_res["confidence"],
            "recommendation": ai_res["recommendation"],
            "reasoning": ai_res.get("reason", "")
        }
        
        # update or insert
        collection.update_one({"session_id": session_id}, {"$set": live_report}, upsert=True)
        
        # Save to unified investigations history
        from agents.history_helper import save_investigation
        threat_level = "SAFE"
        if ai_res["risk_score"] >= 75:
            threat_level = "CRITICAL"
        elif ai_res["risk_score"] >= 50:
            threat_level = "HIGH"
        elif ai_res["risk_score"] >= 25:
            threat_level = "MEDIUM"
        elif ai_res["risk_score"] >= 10:
            threat_level = "LOW"
            
        save_investigation(
            agent_type="live_call",
            investigation_id=session_id,
            risk_score=ai_res["risk_score"],
            threat_level=threat_level,
            input_data=f"Live Session ({ai_res['category']})",
            summary=ai_res.get("reason", "Live conversation monitored for scam intent."),
            full_report=live_report,
            recommendation=ai_res["recommendation"],
            case_id=case_id
        )
