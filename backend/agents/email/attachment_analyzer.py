import os
import logging
from .schemas import AttachmentInfo, AttachmentAnalysisInfo

logger = logging.getLogger(__name__)

# Dangerous Executable and Script Extensions
DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".vbs", ".scr", ".msi", 
    ".lnk", ".js", ".jar", ".sys", ".dll", ".pif", 
    ".cpl", ".wsf", ".gadget", ".hta", ".reg"
}

# Macro-enabled Document Extensions
MACRO_EXTENSIONS = {
    ".docm", ".xlsm", ".pptm", ".dotm", ".xltm"
}

# Compressed Archive Extensions
ARCHIVE_EXTENSIONS = {
    ".zip", ".rar", ".7z", ".tar", ".gz", ".iso", ".cab"
}

def analyze_attachment(att: AttachmentInfo) -> AttachmentAnalysisInfo:
    """Analyzes attachment info to detect malicious extensions and macro-enabled payloads."""
    filename = att.filename
    _, ext = os.path.splitext(filename.lower())
    
    suspicious = False
    risk_score = 0
    reason = "File extension is classified as safe."

    # 1. Check dangerous executables/scripts
    if ext in DANGEROUS_EXTENSIONS:
        suspicious = True
        risk_score = 95
        reason = f"CRITICAL HAZARD: Dangerous executable or script format detected ({ext}). High risk of malware execution."
        
    # 2. Check macro-enabled documents
    elif ext in MACRO_EXTENSIONS:
        suspicious = True
        risk_score = 85
        reason = f"HIGH HAZARD: Macro-enabled office document detected ({ext}). May execute automated malicious scripts when opened."

    # 3. Check archives
    elif ext in ARCHIVE_EXTENSIONS:
        suspicious = True
        risk_score = 45
        reason = f"POTENTIAL RISK: Compressed archive folder detected ({ext}). Malware payloads are frequently hidden inside zip/rar archives."

    # 4. Check double extension (e.g. invoice.pdf.exe)
    elif filename.count(".") > 1:
        # Check if the secondary extension is suspicious
        parts = filename.lower().split(".")
        if len(parts) >= 3:
            hidden_ext = "." + parts[-1]
            if hidden_ext in DANGEROUS_EXTENSIONS or hidden_ext in MACRO_EXTENSIONS:
                suspicious = True
                risk_score = 95
                reason = f"CRITICAL HAZARD: Spoofed file extension detected ({filename}). Hidden extension is {hidden_ext}."

    # Default low risk formats
    else:
        # Check if size is unusually large or small
        if att.size_bytes == 0:
            suspicious = True
            risk_score = 15
            reason = "Warning: File size is 0 bytes (potential system corruption indicator)."

    logger.info(f"Attachment checked: {filename}, Score: {risk_score}, Suspicious: {suspicious}")

    return AttachmentAnalysisInfo(
        filename=filename,
        extension=ext,
        mime_type=att.mime_type,
        size_bytes=att.size_bytes,
        suspicious=suspicious,
        risk_score=risk_score,
        reason=reason
    )
