"""FastAPI app entrypoint.

Lifespan loads the RF-DETR detector once, mounts the Prometheus /metrics
ASGI app, configures CORS for the frontend dev server, and exposes the auth,
detection, history, analytics, chat, and system routers.
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from api.analytics import router as analytics_router
from api.auth import router as auth_router
from api.chat import router as chat_router
from api.system import router as system_router
from api.videos import router as videos_router
from api.ws import router as ws_router
from core.config import (
    DETECTION_DIR,
    LOG_LEVEL,
    MODEL_RESOLUTION,
    MODEL_THRESHOLD,
    MODEL_WEIGHTS,
    VIDEO_DIR,
)
from core.logging import configure_logging
from core.metrics import APP_INFO
from inference.detector import ThreatDetector, download_weights

configure_logging(LOG_LEVEL)
logger = logging.getLogger(__name__)
APP_INFO.info({"model": MODEL_WEIGHTS})


@asynccontextmanager
async def lifespan(app: FastAPI):
    weights_path = Path(MODEL_WEIGHTS)
    if not weights_path.exists():
        weights_path = Path(download_weights(MODEL_WEIGHTS))

    app.state.detector = ThreatDetector(
        weights=str(weights_path),
        resolution=MODEL_RESOLUTION,
        threshold=MODEL_THRESHOLD,
    )
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    DETECTION_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(
        "startup complete video_dir=%s detection_dir=%s",
        VIDEO_DIR,
        DETECTION_DIR,
    )
    yield


app = FastAPI(title="Threat Detection API", lifespan=lifespan)

# --- CORS ----------------------------------------------------------------
# Allow the Vite dev server (5173) and any production origin passed via env.
# Comma-separated. Defaults to localhost dev origins only.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
_origins_env = os.environ.get("FRONTEND_ORIGINS", _default_origins)
allow_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers -------------------------------------------------------------
app.include_router(auth_router)
app.include_router(ws_router)
app.include_router(videos_router)
app.include_router(analytics_router)
app.include_router(chat_router)
app.include_router(system_router)
app.mount("/metrics", make_asgi_app())


@app.get("/health", tags=["meta"])
async def health() -> dict:
    """Lightweight liveness probe."""
    return {"status": "ok"}