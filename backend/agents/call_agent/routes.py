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
    except Exception as db_err:
        logger.warning(f"Failed to log Call analysis results to MongoDB: {db_err}")

    return response_payload


