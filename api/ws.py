"""Realtime threat-detection WebSocket.

Frontend connects to ``ws://host/ws/detect?token=<jwt>`` and sends binary
JPEG frames. The server runs inference on each frame, draws bounding boxes,
streams the annotated JPEG back, and persists detections to Postgres.
"""

import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

import cv2
import jwt
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import update
from sqlalchemy.exc import SQLAlchemyError

from core.config import (
    DETECTION_DIR,
    JPEG_QUALITY,
    PERSIST_CONFIDENCE,
    VIDEO_DIR,
    VIDEO_FPS,
)
from core.metrics import (
    WS_AUTH_FAILURES,
    WS_CONNECTIONS,
    WS_DECODE_ERRORS,
    WS_DETECTIONS,
    WS_ERRORS,
    WS_FRAMES,
    WS_INFERENCE,
)
from core.security import decode_access_token
from db.database import AsyncSessionLocal
from db.schemas import Detection, User, Video
from inference.frames import (
    annotate,
    bgr_to_pil,
    decode_jpeg,
    encode_jpeg,
    open_video_writer,
)
from inference.types import DetectionDict

logger = logging.getLogger(__name__)

router = APIRouter()


async def _user_from_token(token: str | None, websocket: WebSocket) -> User | None:
    """Resolve the User for a JWT, accepting it via ``Sec-WebSocket-Protocol``
    subprotocol header first (preferred — not logged in proxy URLs) and
    falling back to the ``?token=`` query string for backward compatibility.
    """
    # Prefer the subprotocol header: browsers do not surface it in URLs / logs.
    header_value = websocket.headers.get("sec-websocket-protocol")
    if header_value:
        # Subprotocol may be a comma-separated list. We expect a 2-token
        # marker format: "jwt,<token>" — take the second element if present.
        parts = [p.strip() for p in header_value.split(",")]
        if len(parts) >= 2:
            token = parts[1]
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (KeyError, ValueError, jwt.PyJWTError) as exc:
        logger.warning("ws token decode failed: %s", exc)
        return None
    async with AsyncSessionLocal() as session:
        return await session.get(User, user_id)


async def _create_video(user: User, video_name: str) -> Video:
    """Insert a Video row and ensure its on-disk directory exists."""
    video_id = uuid4()
    video_dir = VIDEO_DIR / str(video_id)
    video_dir.mkdir(parents=True, exist_ok=True)
    async with AsyncSessionLocal() as session:
        video = Video(
            video_id=video_id,
            video_name=video_name,
            video_path=str(video_dir),
            user_id=user.id,
        )
        session.add(video)
        await session.commit()
        await session.refresh(video)
    return video


async def _set_video_end_time(video_id: UUID) -> None:
    """Stamp ``videos.end_time`` when the WS session ends."""
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(Video)
            .where(Video.video_id == video_id)
            .values(end_time=datetime.now(timezone.utc))
        )
        await session.commit()


async def _persist_detections(
    video_id: UUID,
    detections: DetectionDict,
    annotated_jpeg: bytes,
) -> None:
    """Persist a Detection row per threat-enum detection above threshold.

    The annotated JPEG is also written under ``DETECTION_DIR/<video_id>/``
    so it can be reviewed independently of the session MP4.
    """
    persistable: list[tuple[str, float, str]] = []
    for cls_id, conf, threat in zip(
        detections["class_id"],
        detections["confidence"],
        detections["threat_types"],
    ):
        if threat is None or conf < PERSIST_CONFIDENCE:
            continue
        persistable.append((threat, conf, str(cls_id)))

    if not persistable:
        return

    ms = int(time.time() * 1000)
    rel_path = f"{DETECTION_DIR}/{video_id}/{ms}.jpg"
    abs_path = Path(rel_path)
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    abs_path.write_bytes(annotated_jpeg)

    async with AsyncSessionLocal() as session:
        for threat, conf, _cls in persistable:
            session.add(
                Detection(
                    video_id=video_id,
                    threat_type=threat,
                    confidence=conf,
                    path_image=str(rel_path),
                )
            )
            WS_DETECTIONS.labels(threat_type=threat).inc()
        await session.commit()


@router.websocket("/ws/detect")
async def detect(
    websocket: WebSocket,
    token: str | None = Query(default=None),
) -> None:
    """Handle a single realtime detection session over WebSocket."""
    user = await _user_from_token(token, websocket)
    if user is None:
        WS_AUTH_FAILURES.inc()
        logger.warning("ws auth rejected")
        await websocket.close(code=1008, reason="Unauthorized")
        return

    await websocket.accept(subprotocol="jwt")
    WS_CONNECTIONS.inc()
    detector = websocket.app.state.detector
    writer: cv2.VideoWriter | None = None
    video: Video | None = None
    frame_count = 0
    user_id = user.id

    try:
        start_msg = await websocket.receive_json()
        if start_msg.get("type") != "start" or "video_name" not in start_msg:
            logger.warning("ws start missing fields user=%s", user_id)
            await websocket.send_json(
                {"type": "error", "detail": "expected start message"}
            )
            await websocket.close(code=1003)
            return

        video = await _create_video(user=user, video_name=str(start_msg["video_name"]))
        await websocket.send_json(
            {"type": "started", "video_id": str(video.video_id)}
        )
        logger.info(
            "ws session start user=%s video=%s name=%s",
            user_id,
            video.video_id,
            video.video_name,
        )

        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break

            blob = message.get("bytes")
            if not blob:
                continue

            with WS_INFERENCE.time():
                frame = decode_jpeg(blob)
                if frame is None:
                    WS_DECODE_ERRORS.inc()
                    logger.warning(
                        "ws decode failed user=%s video=%s",
                        user_id,
                        video.video_id,
                    )
                    continue

                pil = bgr_to_pil(frame)
                detections = detector.predict(pil)
                annotated = annotate(pil, detections)
                annotated_jpeg = encode_jpeg(annotated, JPEG_QUALITY)

            # Only write to MP4 if there are detections above threshold
            has_detection = any(
                conf >= PERSIST_CONFIDENCE
                for conf in detections["confidence"]
            )
            
            if has_detection:
                if writer is None:
                    mp4_path = VIDEO_DIR / str(video.video_id) / "annotated.mp4"
                    mp4_path.parent.mkdir(parents=True, exist_ok=True)
                    h, w = annotated.shape[:2]
                    writer, _mp4_path = open_video_writer(mp4_path, VIDEO_FPS, (w, h))
                writer.write(annotated)

            await websocket.send_bytes(annotated_jpeg)
            await _persist_detections(video.video_id, detections, annotated_jpeg)
            WS_FRAMES.inc()
            frame_count += 1

    except WebSocketDisconnect:
        logger.info(
            "ws disconnected user=%s video=%s frames=%d",
            user_id,
            getattr(video, "video_id", None),
            frame_count,
        )
    except (RuntimeError, ValueError, OSError, SQLAlchemyError) as exc:
        WS_ERRORS.labels(kind=type(exc).__name__).inc()
        logger.exception(
            "ws error user=%s video=%s",
            user_id,
            getattr(video, "video_id", None),
        )
        import traceback
        with open("error.log", "w") as f:
            f.write(traceback.format_exc())
        try:
            await websocket.send_json({"type": "error", "detail": "internal error"})
        except Exception:
            logger.exception("ws error notify failed")
    finally:
        if writer is not None:
            writer.release()
        if video is not None:
            try:
                await _set_video_end_time(video.video_id)
            except (SQLAlchemyError, OSError) as exc:
                logger.warning(
                    "failed to set end_time for video=%s: %s", video.video_id, exc
                )
        WS_CONNECTIONS.dec()
