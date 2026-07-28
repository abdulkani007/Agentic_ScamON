import logging
import os
import shutil
import sys
from typing import Dict
from unittest.mock import MagicMock

# Dynamically mock numba to bypass Windows Application Control DLL load policy blocking.
# numba is only imported in whisper.timing which is not executed unless word_timestamps=True.
mock_numba = MagicMock()
mock_numba.jit = lambda *a, **k: (
    a[0] if (len(a) == 1 and callable(a[0]) and not k) else (lambda f: f)
)
mock_numba.njit = mock_numba.jit
sys.modules["numba"] = mock_numba

logger = logging.getLogger(__name__)


def _ensure_ffmpeg_on_path() -> None:
    """Ensures that ffmpeg.exe is in the system PATH.

    If not, it attempts to load User PATH from the Windows registry, or searches
    the default winget packages directory to add ffmpeg to the environment.
    """
    if shutil.which("ffmpeg") is not None:
        logger.info("ffmpeg is already available on PATH.")
        return

    logger.warning(
        "ffmpeg not found on PATH. Attempting to locate Gyan.FFmpeg from registry/winget..."
    )

    # 1. Try reading User environment PATH from registry
    try:
        import winreg

        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
            user_path, _ = winreg.QueryValueEx(key, "Path")
        for folder in user_path.split(os.pathsep):
            folder_strip = folder.strip()
            if folder_strip and os.path.exists(
                os.path.join(folder_strip, "ffmpeg.exe")
            ):
                os.environ["PATH"] = (
                    folder_strip + os.pathsep + os.environ["PATH"]
                )
                logger.info(
                    f"Dynamically added ffmpeg path from registry to environment: {folder_strip}"
                )
                return
    except Exception as e:
        logger.debug(f"Could not read User PATH from registry: {e}")

    # 2. Try looking in the default winget packages directory under AppData
    appdata = os.environ.get("LOCALAPPDATA")
    if appdata:
        winget_pkg_dir = os.path.join(
            appdata, "Microsoft", "WinGet", "Packages"
        )
        if os.path.exists(winget_pkg_dir):
            for root, dirs, files in os.walk(winget_pkg_dir):
                if "ffmpeg.exe" in files:
                    bin_dir = root
                    os.environ["PATH"] = (
                        bin_dir + os.pathsep + os.environ["PATH"]
                    )
                    logger.info(
                        f"Dynamically added ffmpeg path from winget dir to environment: {bin_dir}"
                    )
                    return

    logger.error("Failed to locate ffmpeg.exe.")


# Make sure ffmpeg is loaded when the service module is imported
_ensure_ffmpeg_on_path()

# Global model cache to avoid reloading the model on every request
_model = None


def get_whisper_model():
    """Loads and caches the Whisper 'base' model in memory."""
    global _model
    if _model is None:
        # We check if whisper is imported locally or globally
        import whisper

        logger.info("Loading Whisper 'base' model...")
        _model = whisper.load_model("base")
        logger.info("Whisper 'base' model loaded successfully.")
    return _model


def transcribe_audio(audio_path: str) -> Dict[str, str]:
    """Transcribes the audio file at the given path using OpenAI Whisper (base model).

    Args:
        audio_path (str): The absolute path to the audio file.

    Returns:
        Dict[str, str]: A dictionary containing the transcript under the
        "transcript" key.
    """
    if not os.path.exists(audio_path):
        logger.error(f"Audio file not found at path: {audio_path}")
        raise FileNotFoundError(f"Audio file not found at path: {audio_path}")

    # Check for empty file
    if os.path.getsize(audio_path) == 0:
        logger.error("Uploaded audio file is empty.")
        raise ValueError("Audio file is empty.")

    try:
        model = get_whisper_model()
        logger.info(f"Starting transcription of {audio_path}...")
        result = model.transcribe(audio_path)
        transcript = result.get("text", "").strip()
        logger.info("Audio transcription completed successfully.")
        return {"transcript": transcript}
    except Exception as e:
        logger.error(f"Error during audio transcription: {str(e)}")
        raise RuntimeError(f"Transcription failed: {str(e)}")
