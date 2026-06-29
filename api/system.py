"""Public runtime information for the Settings page.

The frontend renders build-time constants (model name, resolution, JPEG quality)
and an uptime ticker from this single endpoint so the UI never needs to know
which config keys the backend uses.
"""

import logging
import time

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from core.config import (
    JPEG_QUALITY,
    MODEL_RESOLUTION,
    MODEL_THRESHOLD,
    MODEL_WEIGHTS,
    VIDEO_FPS,
)
from db.schemas import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/system", tags=["system"])

# Recorded at module import; restart resets it.
_PROCESS_START = time.time()

# Threat metadata mirrors ``inference.detector.THREAT_CLASSES`` so the frontend
# can render threat chips without having to know the class-id mapping.
_THREATS = [
    {"id": 1, "label": "Gun", "enum": "Gun"},
    {"id": 2, "label": "Explosive", "enum": "Explosives"},
    {"id": 3, "label": "Grenade", "enum": "Grenade"},
    {"id": 4, "label": "Knife", "enum": "Knife"},
]


@router.get("/info")
async def info(user: User = Depends(get_current_user)) -> dict:
    """Static build info + live uptime. Auth required for consistency."""
    return {
        "model": {
            "weights": MODEL_WEIGHTS,
            "resolution": MODEL_RESOLUTION,
            "threshold": MODEL_THRESHOLD,
            "video_fps": VIDEO_FPS,
            "jpeg_quality": JPEG_QUALITY,
        },
        "threats": _THREATS,
        "server": {
            "version": "1.0.0",
            "api": "fastapi",
            "uptime_seconds": int(time.time() - _PROCESS_START),
        },
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }
