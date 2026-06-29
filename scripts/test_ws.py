"""Smoke-test the /ws/detect endpoint.

Logs in as the seed user, opens the WebSocket, sends one synthetic JPEG
frame, and verifies:
  * an annotated JPEG comes back over the socket
  * an annotated MP4 exists at VIDEO_DIR/<video_id>/
  * DETECTION_DIR/<video_id>/ is empty (synthetic frame has no threat)

Usage:
    uv run python -m scripts.test_ws
    uv run python -m scripts.test_ws --email test@example.com --password hunter2hunter2
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from io import BytesIO
from pathlib import Path

import httpx
import websockets
from PIL import Image

from inference.frames import decode_jpeg

logger = logging.getLogger(__name__)

API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:8000")
WS_BASE = os.environ.get("WS_BASE", "ws://127.0.0.1:8000")
VIDEO_DIR = Path(os.environ.get("VIDEO_DIR", "data/videos"))
DETECTION_DIR = Path(os.environ.get("DETECTION_DIR", "data/detections"))


def make_synthetic_jpeg() -> bytes:
    img = Image.new("RGB", (640, 480), color=(40, 80, 160))
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return buf.getvalue()


async def login(email: str, password: str) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{API_BASE}/auth/login",
            json={"email": email, "password": password},
            timeout=10,
        )
        r.raise_for_status()
        return r.json()["access_token"]


async def run(email: str, password: str) -> int:
    token = await login(email, password)
    logger.info("logged in as %s", email)

    frame_bytes = make_synthetic_jpeg()
    logger.info("built synthetic frame: %d bytes", len(frame_bytes))

    url = f"{WS_BASE}/ws/detect?token={token}"
    async with websockets.connect(url, max_size=8 * 1024 * 1024) as ws:
        await ws.send(json.dumps({"type": "start", "video_name": "test_ws_synthetic"}))
        ack = json.loads(await ws.recv())
        if ack.get("type") != "started":
            logger.error("unexpected ack: %s", ack)
            return 1
        video_id = ack["video_id"]
        logger.info("video started: %s", video_id)

        await ws.send(frame_bytes)
        annotated = await asyncio.wait_for(ws.recv(), timeout=120)

        if isinstance(annotated, str):
            logger.error("expected binary, got text: %s", annotated[:200])
            return 1

        out = decode_jpeg(annotated)
        if out is None:
            logger.error("returned %d bytes but cv2 could not decode", len(annotated))
            return 1

        h, w = out.shape[:2]
        logger.info("received annotated frame: %d bytes shape=%dx%d", len(annotated), w, h)

    logger.info("ws closed cleanly")

    video_dir = VIDEO_DIR / video_id
    mp4_candidates = list(video_dir.glob("annotated.*"))
    if not mp4_candidates or mp4_candidates[0].stat().st_size == 0:
        logger.error("expected non-empty video at %s/annotated.*, got %s", video_dir, mp4_candidates)
        return 1
    logger.info("annotated video: %s (%d bytes)", mp4_candidates[0], mp4_candidates[0].stat().st_size)

    det_dir = DETECTION_DIR / video_id
    det_files = list(det_dir.glob("*")) if det_dir.exists() else []
    if det_files:
        logger.error("expected empty %s, got %s", det_dir, det_files)
        return 1
    logger.info("no detection frames (no threats in synthetic input)")

    return 0


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--email", default="test@example.com")
    p.add_argument("--password", default="hunter2hunter2")
    args = p.parse_args()
    sys.exit(asyncio.run(run(args.email, args.password)))


if __name__ == "__main__":
    main()
