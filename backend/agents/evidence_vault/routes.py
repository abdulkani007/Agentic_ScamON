import io
import logging
import zipfile
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from bson import ObjectId

from database import get_db
from .agent import add_evidence_to_vault, generate_case_id, calculate_integrity_hash

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/evidence", tags=["Evidence Vault"])

def clean_mongodb_doc(doc: Any) -> Any:
    if isinstance(doc, dict):
        return {k: clean_mongodb_doc(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [clean_mongodb_doc(x) for x in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc

# Pydantic Schemas
class EvidencePayload(BaseModel):
    case_id: Optional[str] = None
    agent_source: str
    evidence_data: Dict[str, Any]

class StatusUpdatePayload(BaseModel):
    status: str

# ----------------- FastAPI Endpoints -----------------

@router.post("/cases", status_code=201)
async def create_case_folder():
    """Initializes a brand new Case Folder with a sequential Case ID."""
    db = get_db()
    if db is None:
        # Fallback offline mode ID
        fallback_id = f"SCAMON-2026-{int(datetime.utcnow().timestamp()) % 1000000:06d}"
        return {"case_id": fallback_id, "status": "Open", "offline": True}
        
    try:
        case_id = generate_case_id(db)
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        
        new_case = {
            "case_id": case_id,
            "user_id": "default_user",
            "created_at": timestamp,
            "updated_at": timestamp,
            "status": "Open",
            "overall_risk_score": 0,
            "overall_threat_level": "SAFE",
            "agents_used": [],
            "evidence": {},
            "reports": {}
        }
        db["cases"].insert_one(new_case)
        return {"case_id": case_id, "status": "Open"}
    except Exception as e:
        logger.error(f"Failed to create new case folder: {e}")
        raise HTTPException(status_code=500, detail="Database write error.")

@router.get("/cases/active")
async def get_active_case():
    """Retrieves the active (most recently updated and non-Closed) Case Folder."""
    db = get_db()
    if db is None:
        return {"case_id": "SCAMON-2026-000001", "status": "Open", "offline": True}
    try:
        active_case = db["cases"].find_one({"status": {"$ne": "Closed"}}, sort=[("updated_at", -1)])
        if active_case:
            return {"case_id": active_case["case_id"], "status": active_case.get("status", "Open")}
        fallback_id = "SCAMON-2026-000001"
        return {"case_id": fallback_id, "status": "Open"}
    except Exception as e:
        logger.error(f"Failed to fetch active case folder: {e}")
        return {"case_id": "SCAMON-2026-000001", "status": "Open"}

@router.get("/cases")
async def list_cases(
    status: Optional[str] = Query(None, description="Filter cases by status"),
    threat_level: Optional[str] = Query(None, description="Filter cases by overall threat level"),
    search: Optional[str] = Query(None, description="Filter cases by Case ID or content"),
    sort_by: str = Query("newest", description="Sort by: newest, oldest, highest_risk, lowest_risk")
):
    """Retrieves all Case Folders matching filter criteria."""
    db = get_db()
    if db is None:
        return []
        
    try:
        query = {}
        if status and status != "All":
            query["status"] = status
        if threat_level and threat_level != "All":
            query["overall_threat_level"] = threat_level.upper()
        if search:
            query["$or"] = [
                {"case_id": {"$regex": search, "$options": "i"}},
                {"agents_used": {"$regex": search, "$options": "i"}},
                {"status": {"$regex": search, "$options": "i"}}
            ]
            
        cursor = db["cases"].find(query)
        
        # Sort logic
        if sort_by == "newest":
            cursor = cursor.sort("created_at", -1)
        elif sort_by == "oldest":
            cursor = cursor.sort("created_at", 1)
        elif sort_by == "highest_risk":
            cursor = cursor.sort("overall_risk_score", -1)
        elif sort_by == "lowest_risk":
            cursor = cursor.sort("overall_risk_score", 1)
            
        cases = []
        for doc in cursor:
            cases.append(clean_mongodb_doc(doc))
        return cases
    except Exception as e:
        logger.error(f"Failed to list Case Folders: {e}")
        return []

@router.get("/cases/{id}")
async def get_case_details(id: str):
    """Retrieves a single Case Folder."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline.")
        
    doc = db["cases"].find_one({"case_id": id})
    if not doc:
        raise HTTPException(status_code=404, detail="Case Folder not found.")
        
    return clean_mongodb_doc(doc)

@router.delete("/cases/{id}")
async def delete_case_folder(id: str):
    """Deletes a Case Folder."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline.")
        
    res = db["cases"].delete_one({"case_id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found.")
    return {"message": "Case deleted successfully."}

@router.post("/cases/{id}/status")
async def update_case_status(id: str, payload: StatusUpdatePayload):
    """Updates the status of a Case Folder."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline.")
        
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    res = db["cases"].update_one(
        {"case_id": id},
        {"$set": {"status": payload.status, "updated_at": timestamp}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case Folder not found.")
    return {"message": f"Case status updated to {payload.status}."}

@router.post("/add")
async def add_evidence(payload: EvidencePayload):
    """Endpoint for finished agents to push evidence to the vault."""
    db = get_db()
    if db is None:
        # Fallback offline mock response
        return {"message": "Saved (Offline Fallback)", "case_id": payload.case_id or "SCAMON-2026-000001"}
        
    try:
        updated_case = add_evidence_to_vault(
            db=db,
            case_id=payload.case_id,
            agent_source=payload.agent_source,
            evidence_data=payload.evidence_data
        )
        return clean_mongodb_doc(updated_case)
    except Exception as e:
        logger.error(f"Failed to add evidence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- Document Exporters Helpers -----------------

def generate_pdf_stream(case_id: str, case_data: Dict[str, Any]) -> io.BytesIO:
    """Helper to generate a ReportLab PDF document for a Case Folder."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'VaultTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#00E676'),
        spaceAfter=10
    )
    section_style = ParagraphStyle(
        'VaultSection',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#00E676'),
        spaceBefore=15,
        spaceAfter=6,
        borderPadding=2
    )
    body_style = ParagraphStyle(
        'VaultBody',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#e2e8f0')
    )
    code_style = ParagraphStyle(
        'VaultCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#a7f3d0')
    )

    story.append(Paragraph("ScamON AI Digital Forensics Evidence Case", title_style))
    story.append(Paragraph(f"Case ID: {case_id} // Registry Status: {case_data.get('status', 'Open')}", body_style))
    story.append(Spacer(1, 10))

    # Meta Info table
    meta_data = [
        [Paragraph("<b>Risk Score</b>", body_style), Paragraph(str(case_data.get('overall_risk_score', 0)), body_style)],
        [Paragraph("<b>Threat Level</b>", body_style), Paragraph(case_data.get('overall_threat_level', 'SAFE'), body_style)],
        [Paragraph("<b>Investigation Date</b>", body_style), Paragraph(case_data.get('created_at', ''), body_style)],
        [Paragraph("<b>Last Modified</b>", body_style), Paragraph(case_data.get('updated_at', ''), body_style)]
    ]
    t = Table(meta_data, colWidths=[150, 350])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0a192f')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#00E676')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#1e293b'))
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # Evidence details
    story.append(Paragraph("Verifiable Forensics Evidence Logs", section_style))
    evidence = case_data.get("evidence", {})
    if not evidence:
        story.append(Paragraph("No evidence items cataloged yet.", body_style))
    else:
        for source, ev in evidence.items():
            story.append(Paragraph(f"▶ {ev.get('generated_by', source.upper())}", section_style))
            story.append(Paragraph(f"Timestamp: {ev.get('creation_time', '')} | Integrity Hash: {ev.get('integrity_hash', '')}", body_style))
            story.append(Spacer(1, 4))
            
            raw_data = ev.get("data") or {}
            dumped = json.dumps(raw_data, indent=2)
            story.append(Paragraph(dumped.replace('\n', '<br/>').replace(' ', '&nbsp;'), code_style))
            story.append(Spacer(1, 10))

    pdf.build(story)
    buffer.seek(0)
    return buffer

def generate_docx_stream(case_id: str, case_data: Dict[str, Any]) -> io.BytesIO:
    """Helper to generate a Word DOCX document for a Case Folder."""
    import docx
    doc = docx.Document()
    
    doc.add_heading("ScamON AI - Digital Forensics Vault Case File", 0)
    doc.add_heading(f"Case Folder: {case_id}", level=1)
    
    p = doc.add_paragraph()
    p.add_run(f"Status: {case_data.get('status', 'Open')}\n").bold = True
    p.add_run(f"Risk Score: {case_data.get('overall_risk_score', 0)}/100 ({case_data.get('overall_threat_level', 'SAFE')})\n")
    p.add_run(f"Created At: {case_data.get('created_at', '')}\n")
    p.add_run(f"Last Modified: {case_data.get('updated_at', '')}\n")
    
    doc.add_heading("Evidence Vault Registry Logs", level=2)
    evidence = case_data.get("evidence", {})
    if not evidence:
        doc.add_paragraph("No evidence logs collected yet.")
    else:
        for source, ev in evidence.items():
            doc.add_heading(ev.get("generated_by", source.upper()), level=3)
            doc.add_paragraph(f"Timestamp: {ev.get('creation_time', '')}\nIntegrity Hash: {ev.get('integrity_hash', '')}")
            
            # Add raw data dump
            raw_data = ev.get("data") or {}
            doc.add_paragraph(json.dumps(raw_data, indent=2))
            
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer

# ----------------- Exporter Routes -----------------

@router.get("/cases/{id}/export/pdf")
async def export_case_pdf(id: str):
    """Streams case report PDF."""
    db = get_db()
    case_data = {}
    if db is not None:
        case_data = db["cases"].find_one({"case_id": id}) or {}
        case_data = clean_mongodb_doc(case_data)
        
    if not case_data:
        case_data = {
            "case_id": id,
            "status": "Offline / Not Found",
            "overall_risk_score": 0,
            "overall_threat_level": "UNKNOWN",
            "evidence": {}
        }
        
    pdf_stream = generate_pdf_stream(id, case_data)
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=case_{id}.pdf"}
    )

@router.get("/cases/{id}/export/docx")
async def export_case_docx(id: str):
    """Streams case report Word DOCX document."""
    db = get_db()
    case_data = {}
    if db is not None:
        case_data = db["cases"].find_one({"case_id": id}) or {}
        case_data = clean_mongodb_doc(case_data)
        
    if not case_data:
        case_data = {
            "case_id": id,
            "status": "Offline / Not Found",
            "overall_risk_score": 0,
            "overall_threat_level": "UNKNOWN",
            "evidence": {}
        }
        
    docx_stream = generate_docx_stream(id, case_data)
    return StreamingResponse(
        docx_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=case_{id}.docx"}
    )

@router.get("/cases/{id}/export/json")
async def export_case_json(id: str):
    """Downloads Case Folder raw JSON data."""
    db = get_db()
    case_data = {}
    if db is not None:
        case_data = db["cases"].find_one({"case_id": id}) or {}
        
    if not case_data:
        raise HTTPException(status_code=404, detail="Case Folder not found.")
        
    if "_id" in case_data:
        case_data["_id"] = str(case_data["_id"])
        
    return JSONResponse(content=case_data)

@router.get("/cases/{id}/export/zip")
async def export_case_zip(id: str):
    """Streams a compiled .zip folder containing PDF, DOCX, and raw JSON logs."""
    db = get_db()
    case_data = {}
    if db is not None:
        case_data = db["cases"].find_one({"case_id": id}) or {}
        case_data = clean_mongodb_doc(case_data)
        
    if not case_data:
        raise HTTPException(status_code=404, detail="Case Folder not found.")
        
    if "_id" in case_data:
        case_data["_id"] = str(case_data["_id"])

    # Create zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        # Write raw JSON details
        json_data = json.dumps(case_data, indent=2, default=str)
        zip_file.writestr("case_details.json", json_data)
        
        # Write PDF report
        pdf_stream = generate_pdf_stream(id, case_data)
        zip_file.writestr("case_report.pdf", pdf_stream.getvalue())
        
        # Write DOCX report
        docx_stream = generate_docx_stream(id, case_data)
        zip_file.writestr("case_report.docx", docx_stream.getvalue())
        
        # Write individual agent json payloads
        evidence = case_data.get("evidence") or {}
        for source, ev in evidence.items():
            ev_data = ev.get("data") or {}
            zip_file.writestr(f"evidence_{source}.json", json.dumps(ev_data, indent=2, default=str))

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment; filename=case_{id}.zip"}
    )
