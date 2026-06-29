# 🔒 Camera-Based Threat Detection System

> Real-time weapon detection from live camera feeds — powered by deep learning, streamed over WebSocket, and built for production-grade surveillance.

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

---

## 📖 Overview

Physical security environments — airports, banks, public venues, and critical infrastructure — face a growing need for automated, real-time threat monitoring that reduces reliance on manual camera surveillance. Human operators cannot reliably watch dozens of camera feeds simultaneously, and delayed threat identification can have serious consequences.

This system addresses that gap by deploying a fine-tuned YOLOv8n deep learning model directly into a live camera pipeline. Video frames are captured in the browser and streamed to the backend over WebSocket, where the ML inference engine annotates each frame with bounding boxes and confidence scores before returning the result in real time. Detected threats are persisted to a PostgreSQL database, enabling historical review, trend analysis, and audit trails.

The architecture is designed for practical deployment: a React frontend handles the operator interface with live detection, dashboards, history, and analytics; a FastAPI backend manages inference, authentication, and data persistence; and a Prometheus metrics endpoint enables integration with standard observability stacks. Role-based access control (admin / operator / viewer) ensures that access to live feeds, history, and configuration is governed per user role.

---

## 🏗 Architecture

### System Architecture

The diagram below shows the full technical architecture — frontend, backend API services, AI inference pipeline, storage layer, authentication, and observability stack.

<p align="center">
  <img src="architecture_technical.png" alt="AI Surveillance System – Technical Architecture" width="100%"/>
</p>

### Data Flow Diagram

This diagram illustrates the end-to-end request/response flow — from user access through WebSocket streaming, ML inference, and real-time detection delivery.

<p align="center">
  <img src="architecture_flow.png" alt="System Data Flow – WebSocket & Inference Pipeline" width="100%"/>
</p>

---

## ✨ Features

- **Live Camera Detection** — Streams webcam frames to the backend over WebSocket and receives annotated frames with bounding boxes and confidence scores in real time
- **Multi-Class Threat Detection** — Identifies four threat categories: Gun, Knife, Explosive, and Grenade
- **Dashboard** — Overview of detection statistics, active sessions, and 24-hour activity trends
- **Detection History** — Searchable, filterable log of all detections with thumbnails, threat type filters, and pagination
- **Analytics** — Time-series charts (hourly/daily buckets), threat distribution breakdowns, and trend analysis via Recharts
- **Insights Chat Panel** — Heuristic rule-based chat interface for querying detection summaries without requiring an LLM
- **JWT Authentication** — Secure login with HS256-signed tokens and role-based access control (admin / operator / viewer)
- **Prometheus Metrics** — Operational metrics exposed at `/metrics` for integration with Grafana or similar stacks
- **Async Database Layer** — SQLAlchemy with asyncpg for non-blocking PostgreSQL access; Alembic for schema migrations
- **Settings Page** — Displays model configuration, system uptime, and current user information

---

## 🛠 Tech Stack

### Backend
| Component | Technology |
|---|---|
| Web Framework | FastAPI + Uvicorn |
| Real-time Transport | WebSocket (frame streaming) |
| ORM & Migrations | SQLAlchemy (async) + asyncpg + Alembic |
| Authentication | bcrypt password hashing + JWT (HS256) |
| Frame Processing | OpenCV, Pillow |
| Observability | Prometheus (`/metrics`) |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | TailwindCSS v4 |
| State Management | Zustand |
| Data Fetching | TanStack React Query |
| Charts | Recharts |
| Animations | Framer Motion |
| UI Components | Radix UI |
| Routing | React Router |

### ML Model
| Component | Technology |
|---|---|
| Architecture | YOLOv8n (Nano) via Ultralytics |
| Weights Source | [`Subh775/Threat-Detection-YOLOv8n`](https://huggingface.co/Subh775/Threat-Detection-YOLOv8n) on HuggingFace |
| Model Size | ~6 MB |
| Parameters | ~3 Million (3,006,428 fused) |
| Compute | ~8.1 GFLOPs |
| Input Resolution | 576px (configurable) |
| Confidence Threshold | 0.5 (configurable) |
| Classes | Gun · Explosive · Grenade · Knife |

#### 📊 Model Performance

Training ran for **50 epochs** on a custom threat detection dataset with AdamW optimizer (lr=0.00125), transfer learning from COCO pretrained weights, and dynamic mosaic augmentation for the first 40 epochs.

**Validation Results**

| Metric | Gun | Explosive | Grenade | Knife | **Overall** |
|---|---|---|---|---|---|
| mAP@50 | 78.3% | 74.1% | 92.1% | 80.9% | **81.3%** |
| mAP@50:95 | 47.8% | 48.5% | 76.6% | 48.2% | **55.3%** |
| Precision | 83.3% | 77.8% | 96.5% | 79.7% | **84.3%** |
| Recall | 69.0% | 68.2% | 89.9% | 78.1% | **76.3%** |

**Test Results**

| Metric | Gun | Explosive | Grenade | Knife | **Overall** |
|---|---|---|---|---|---|
| mAP@50 | 93.1% | 60.5% | 91.1% | 79.7% | **81.1%** |
| mAP@50:95 | 65.3% | 35.7% | 83.2% | 49.8% | **58.5%** |
| Precision | 96.7% | 49.7% | 93.1% | 86.5% | **81.5%** |
| Recall | 83.0% | 83.0% | 83.0% | 83.0% | **83.0%** |

> **Highlights:** Gun precision reaches **96.7%** and Grenade precision **93.1%** on the test set — both classes show very low false positive rates. The model generalises well from validation to test, indicating stable learning with no significant overfitting across 50 epochs.

### Database
| Component | Technology |
|---|---|
| Database | PostgreSQL 16 |
| Async Driver | asyncpg |
| Migration Tool | Alembic |

### Database Schema (ER Diagram)

Three core tables — `Users`, `Videos`, and `Detections` — with one-to-many relationships. Each user owns multiple video sessions; each video session records multiple detection events.

<p align="center">
  <img src="er_diagram.png" alt="Entity Relationship Diagram – Users, Videos, Detections" width="75%"/>
</p>

---

## 📁 Project Structure

```
camera-threat-detection/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint, lifespan, CORS, routers
│   ├── api/
│   │   ├── auth.py              # Login, token issuance, user management
│   │   ├── ws.py                # WebSocket endpoint — frame receive → infer → send
│   │   ├── videos.py            # Detection history REST endpoints
│   │   ├── analytics.py         # Time-series and distribution endpoints
│   │   ├── chat.py              # Heuristic insights chat panel
│   │   └── system.py            # Uptime, model config, health check
│   ├── core/
│   │   ├── config.py            # Environment variable loading (Pydantic Settings)
│   │   ├── security.py          # JWT creation/validation, bcrypt helpers
│   │   ├── logging.py           # Structured logging configuration
│   │   └── metrics.py           # Prometheus counters and histograms
│   ├── inference/
│   │   ├── detector.py          # YOLOv8 model wrapper — load, predict, annotate
│   │   ├── frames.py            # OpenCV helpers — decode JPEG, encode, draw boxes
│   │   └── types.py             # Detection result dataclasses
│   ├── db/
│   │   ├── database.py          # Async SQLAlchemy engine + session factory
│   │   └── schemas.py           # ORM models (User, Video, Detection) + Pydantic schemas
│   ├── models/
│   │   └── best.pt              # YOLOv8n fine-tuned weights (downloaded from HuggingFace)
│   ├── alembic/                 # Database migration scripts
│   │   └── versions/
│   └── data/
│       ├── videos/              # Runtime video storage
│       └── detections/          # Detection thumbnail storage
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── LiveDetection.tsx
│       │   ├── History.tsx
│       │   ├── Analytics.tsx
│       │   ├── Settings.tsx
│       │   └── Login.tsx
│       ├── components/
│       │   ├── analytics/       # Chart components
│       │   ├── chat/            # Insights chat panel
│       │   ├── detection/       # Bounding box overlays, detection cards
│       │   ├── history/         # Detection log table, filters
│       │   ├── video/           # WebSocket video stream component
│       │   ├── layout/          # Sidebar, navbar, layout shell
│       │   └── ui/              # Shared Radix UI wrappers
│       ├── stores/              # Zustand state slices
│       ├── services/            # Axios API service layer
│       └── hooks/               # Custom React hooks (useWebSocket, useDetections, etc.)
│
├── docs/
│   ├── SECURITY.md              # Production security design document
│   └── MODEL_SELECTION.md       # ML model selection rationale
│
├── .env.example                 # Environment variable template
├── alembic.ini
└── README.md
```

---

## ✅ Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher (with npm or pnpm)
- **PostgreSQL** 14 or higher
- A webcam or RTSP-compatible camera source
- GPU optional — YOLOv8n runs on CPU; GPU significantly improves throughput

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/camera-threat-detection.git
cd camera-threat-detection
```

### 2. Backend Setup

**Install dependencies** (using `uv` — recommended — or `pip`):

```bash
cd backend

# With uv (fast)
pip install uv
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt

# Or with pip
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

**Download model weights:**

```bash
# Weights are auto-downloaded on first run, or manually:
from huggingface_hub import hf_hub_download
hf_hub_download(repo_id="Subh775/Threat-Detection-YOLOv8n", filename="best.pt", local_dir="models/")
```

**Configure environment:**

```bash
cp ../.env.example .env
# Edit .env with your database URL, secret key, and other settings
```

**Run database migrations:**

```bash
alembic upgrade head
```

**Start the backend server:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000` and interactive docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

```bash
cd frontend
npm install        # or: pnpm install
```

**Start the development server:**

```bash
npm run dev        # or: pnpm dev
```

The frontend will be available at `http://localhost:5173`.

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` in the `backend/` directory and configure the following:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg format) | `postgresql+asyncpg://user:pass@localhost/threatdb` |
| `SECRET_KEY` | Secret key for JWT signing (use a long random string) | — |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiry duration in minutes | `60` |
| `MODEL_WEIGHTS` | Path to YOLOv8 `.pt` weights file | `models/best.pt` |
| `MODEL_RESOLUTION` | Input resolution for inference (pixels) | `576` |
| `MODEL_THRESHOLD` | Minimum confidence score for detections | `0.5` |
| `VIDEO_DIR` | Directory for runtime video storage | `data/videos` |
| `DETECTION_DIR` | Directory for detection thumbnail storage | `data/detections` |
| `VIDEO_FPS` | Target frame rate for WebSocket stream | `15` |
| `JPEG_QUALITY` | JPEG compression quality for streamed frames (1–100) | `80` |
| `PERSIST_CONFIDENCE` | Minimum confidence required to persist a detection to DB | `0.6` |
| `FRONTEND_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:5173` |
| `LOG_LEVEL` | Application log level | `INFO` |

---

## 🔌 API Endpoints

### REST Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate and receive a JWT token |
| `GET` | `/api/auth/me` | JWT | Get current authenticated user info |
| `GET` | `/api/videos/` | JWT | List detection history with filters and pagination |
| `GET` | `/api/videos/{id}` | JWT | Get a single detection record with thumbnail |
| `GET` | `/api/analytics/timeseries` | JWT | Hourly/daily detection counts over a date range |
| `GET` | `/api/analytics/distribution` | JWT | Threat class distribution breakdown |
| `POST` | `/api/chat/query` | JWT | Query the heuristic insights panel |
| `GET` | `/api/system/info` | JWT (admin) | Model config, uptime, and system metadata |
| `GET` | `/metrics` | Internal | Prometheus metrics endpoint |

### WebSocket Endpoint

| Path | Auth | Description |
|---|---|---|
| `ws://host/ws/stream` | JWT (query param) | Bidirectional stream — send raw JPEG frames, receive annotated JPEG frames with detection metadata |

**WebSocket message flow:**
```
Client → Server : Raw JPEG frame (binary)
Server → Client : Annotated JPEG frame + JSON detection payload
```

---

## 🔐 Security

For a full breakdown of the production security architecture — including input validation, authentication, data privacy, model security, and monitoring — see [`docs/SECURITY.md`](docs/SECURITY.md).

---

## 🤖 Model Selection

For the rationale behind choosing YOLOv8n for this system — including comparisons with alternative architectures, trade-offs between speed and accuracy, and deployment considerations — see [`docs/MODEL_SELECTION.md`](docs/MODEL_SELECTION.md).

---
Challenges Faced
Setting up the real-time WebSocket pipeline was tricky — getting the camera frames to flow smoothly from browser → backend → YOLO model → annotated response required careful coordination between OpenCV, PIL, and async Python.
The model's confidence threshold needed tuning — too low and it flagged false positives on everyday objects, too high and it missed actual threats. Finding the right balance (0.5) took trial and error.
Keeping the database schema in sync with the application code was a recurring pain point — schema changes in Python didn't automatically reflect in PostgreSQL, causing silent insert failures that were hard to debug.

Production Improvements
Use GPU acceleration (CUDA/TensorRT) and a larger YOLOv8 variant for faster, more accurate inference across multiple concurrent camera streams.
Move from local file storage to cloud object storage (S3/GCS) with signed URLs, proper auth on all file endpoints, and automated retention policies.
Add real-time alerting (push/email/SMS) on high-confidence threats, structured error handling with retry queues, and robust multi-camera support with per-stream dashboards.


## 📄 License

This project is licensed under the MIT License. The ML model weights are sourced from [`Subh775/Threat-Detection-YOLOv8n`](https://huggingface.co/Subh775/Threat-Detection-YOLOv8n) on HuggingFace, also MIT licensed.