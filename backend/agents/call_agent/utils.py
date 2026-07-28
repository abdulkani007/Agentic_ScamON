import logging
import os
from typing import Set
from .config import settings

# Supported audio file extensions
ALLOWED_EXTENSIONS: Set[str] = {".mp3", ".wav"}


def setup_logging() -> None:
    """Configures logging for the FastAPI application using the log level from settings."""
    log_level_str = settings.LOG_LEVEL.upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized with level: {log_level_str}")


def is_allowed_audio_file(filename: str) -> bool:
    """Checks if the uploaded file has a supported audio extension (.mp3, .wav)."""
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS
