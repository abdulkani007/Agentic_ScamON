import pytest
from unittest.mock import MagicMock, patch
from agents.call_agent.whisper_service import transcribe_audio


def test_transcribe_audio_file_not_found():
    """Verify that FileNotFoundError is raised when transcribing a missing file."""
    with pytest.raises(FileNotFoundError):
        transcribe_audio("non_existent_file_xyz.wav")


def test_transcribe_audio_empty_file(tmp_path):
    """Verify that ValueError is raised when transcribing an empty 0-byte file."""
    empty_file = tmp_path / "empty.wav"
    empty_file.touch()  # Creates 0-byte file

    with pytest.raises(ValueError, match="Audio file is empty."):
        transcribe_audio(str(empty_file))


@patch("agents.call_agent.whisper_service.get_whisper_model")
def test_transcribe_audio_success(mock_get_model, tmp_path):
    """Verify transcription success using a mocked Whisper model execution."""
    dummy_file = tmp_path / "dummy.wav"
    dummy_file.write_bytes(b"some audio data")

    # Mock Whisper model
    mock_model = MagicMock()
    mock_model.transcribe.return_value = {"text": "   Verify credit card status.  "}
    mock_get_model.return_value = mock_model

    result = transcribe_audio(str(dummy_file))
    assert result == {"transcript": "Verify credit card status."}
    mock_model.transcribe.assert_called_once_with(str(dummy_file))
