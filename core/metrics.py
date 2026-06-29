"""Prometheus metric singletons shared across the app.

Importing this module has the side effect of declaring the metric families
in the default registry, which is what `prometheus_client.make_asgi_app()`
exposes at /metrics.
"""

from prometheus_client import Counter, Gauge, Histogram, Info

APP_INFO = Info("app", "Static build info")
APP_INFO.info({"name": "threat-detection-backend"})

WS_FRAMES = Counter(
    "ws_frames_total",
    "Frames successfully processed over the /ws/detect WebSocket.",
)
WS_DETECTIONS = Counter(
    "ws_detections_total",
    "Threat detections persisted to Postgres.",
    ["threat_type"],
)
WS_INFERENCE = Histogram(
    "ws_inference_seconds",
    "Time spent in predict + annotate per frame.",
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5),
)
WS_CONNECTIONS = Gauge(
    "ws_active_connections",
    "Currently open /ws/detect connections.",
)
WS_DECODE_ERRORS = Counter(
    "ws_decode_errors_total",
    "Inbound JPEG frames that failed to decode.",
)
WS_AUTH_FAILURES = Counter(
    "ws_auth_failures_total",
    "WebSocket connections rejected for invalid or missing JWTs.",
)
WS_ERRORS = Counter(
    "ws_errors_total",
    "Unhandled errors raised inside the WebSocket handler.",
    ["kind"],
)

AUTH_LOGINS = Counter(
    "auth_logins_total",
    "Successful /auth/login responses.",
)
AUTH_LOGIN_FAILURES = Counter(
    "auth_login_failures_total",
    "Failed /auth/login attempts (bad email or password).",
)
