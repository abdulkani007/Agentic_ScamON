import logging
import cv2
import numpy as np

logger = logging.getLogger(__name__)


def decode_qr(image_bytes: bytes) -> str:
    """Decodes a QR Code image from bytes and extracts the embedded URL string.

    Uses a dual-path fallback strategy: tries PyZbar first, then falls back to
    OpenCV's native QRCodeDetector.
    """
    if not image_bytes:
        raise ValueError("Image payload is empty.")

    # Decode bytes to OpenCV image format
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(
            "Invalid image file. Failed to parse image bytes into a valid pixel matrix."
        )

    # Path 1: Attempt using PyZbar
    try:
        from pyzbar.pyzbar import decode

        logger.debug("Attempting QR decoding via PyZbar...")
        decoded_objs = decode(img)
        if decoded_objs:
            url_str = decoded_objs[0].data.decode("utf-8").strip()
            logger.info(f"Successfully decoded QR via PyZbar: {url_str}")
            return url_str
    except Exception as err:
        logger.warning(
            f"PyZbar execution failed (possibly missing native zbar dynamic libraries): {err}. "
            "Falling back to OpenCV native QRCodeDetector..."
        )

    # Path 2: Fallback to OpenCV Native QRCodeDetector
    try:
        logger.debug("Attempting QR decoding via OpenCV Native QRCodeDetector...")
        detector = cv2.QRCodeDetector()
        url_str, _, _ = detector.detectAndDecode(img)
        url_str = url_str.strip()
        if url_str:
            logger.info(
                f"Successfully decoded QR via OpenCV QRCodeDetector: {url_str}"
            )
            return url_str
    except Exception as err:
        logger.error(f"OpenCV Native QRCodeDetector failed: {err}")

    # If both paths fail
    raise ValueError(
        "No QR code could be detected or decoded from the uploaded image. "
        "Please ensure the image contains a clear, un-distorted QR code."
    )
