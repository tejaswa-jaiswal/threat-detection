"""Centralized configuration sourced from environment variables (via .env)."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# --- Database -----------------------------------------------------------
DATABASE_URL: str = os.environ["DATABASE_URL"]

# --- Auth ---------------------------------------------------------------
SECRET_KEY: str = os.environ["SECRET_KEY"]
ALGORITHM: str = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

# --- Logging ------------------------------------------------------------
LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")

# --- Model --------------------------------------------------------------
MODEL_WEIGHTS: str = os.environ.get("MODEL_WEIGHTS", "checkpoint_best_total.pth")
MODEL_RESOLUTION: int = int(os.environ.get("MODEL_RESOLUTION", "576"))
MODEL_THRESHOLD: float = float(os.environ.get("MODEL_THRESHOLD", "0.5"))

# --- Storage ------------------------------------------------------------
VIDEO_DIR: Path = Path(os.environ.get("VIDEO_DIR", "data/videos"))
DETECTION_DIR: Path = Path(os.environ.get("DETECTION_DIR", "data/detections"))
VIDEO_FPS: float = float(os.environ.get("VIDEO_FPS", "15"))
JPEG_QUALITY: int = int(os.environ.get("JPEG_QUALITY", "80"))

# --- Detection persistence ---------------------------------------------
PERSIST_CONFIDENCE: float = float(os.environ.get("PERSIST_CONFIDENCE", "0.5"))
