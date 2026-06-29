



"""OpenCV + PIL helpers for decoding, drawing, and encoding frames."""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from inference.detector import CLASS_COLORS, THREAT_CLASSES
from inference.types import DetectionDict


def decode_jpeg(blob: bytes) -> np.ndarray | None:
    """Decode a JPEG byte payload into a BGR ``np.ndarray`` or ``None``."""
    arr = np.frombuffer(blob, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return frame if frame is not None else None


def bgr_to_pil(frame_bgr: np.ndarray) -> Image.Image:
    """Convert a BGR OpenCV frame to a PIL ``Image`` (RGB)."""
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb)


def open_video_writer(
    path: Path, fps: float, frame_size: tuple[int, int]
) -> tuple[cv2.VideoWriter, Path]:
    """Open a video writer, falling back to ``.avi`` + ``MJPG`` if mp4v fails.

    Returns ``(writer, final_path)`` — the path may differ from the input
    when the fallback is taken.
    """
    w, h = frame_size
    writer = cv2.VideoWriter(
        str(path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h)
    )
    if writer.isOpened():
        return writer, path
    writer.release()
    fallback = path.with_suffix(".avi")
    writer = cv2.VideoWriter(
        str(fallback), cv2.VideoWriter_fourcc(*"MJPG"), fps, (w, h)
    )
    return writer, fallback


def annotate(pil_image: Image.Image, detections: DetectionDict) -> np.ndarray:
    """Draw bounding boxes and labels on a PIL image, returning a BGR array."""
    img_bgr = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    h, w = img_bgr.shape[:2]
    xyxy = detections["xyxy"]
    if len(xyxy) == 0:
        return img_bgr

    for box, class_id, conf in zip(
        xyxy, detections["class_id"], detections["confidence"]
    ):
        x1, y1, x2, y2 = map(int, box)
        label_name = THREAT_CLASSES.get(int(class_id), f"Class {class_id}")
        color = CLASS_COLORS.get(label_name, (255, 255, 255))
        text = f"{label_name} {conf:.0%}"

        thickness = max(2, int(min(w, h) / 300))
        cv2.rectangle(img_bgr, (x1, y1), (x2, y2), color, thickness)

        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = max(0.5, min(w, h) / 1000)
        (tw, th), baseline = cv2.getTextSize(text, font, font_scale, 2)
        cv2.rectangle(
            img_bgr,
            (x1, max(y1 - th - baseline - 6, 0)),
            (x1 + tw + 4, y1),
            color,
            -1,
        )
        cv2.putText(
            img_bgr,
            text,
            (x1 + 2, max(y1 - baseline - 4, baseline + 4)),
            font,
            font_scale,
            (0, 0, 0),
            2,
            cv2.LINE_AA,
        )

    return img_bgr


def encode_jpeg(frame_bgr: np.ndarray, quality: int = 80) -> bytes:
    """Encode a BGR frame as JPEG bytes (empty bytes on failure)."""
    ok, buf = cv2.imencode(
        ".jpg", frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    )
    return buf.tobytes() if ok else b""
