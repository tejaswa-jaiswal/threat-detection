"""Plain-text uvicorn-style logging configured once at app startup."""

import logging


_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
_DATEFMT = "%Y-%m-%d %H:%M:%S"

_QUIET_LOGGERS = ("ultralytics", "rfdetr", "PIL", "asyncio")


def configure_logging(level: str = "INFO") -> None:
    """Initialize root logger with a plain-text formatter.

    Idempotent: re-configuring has no effect if a handler is already attached,
    which keeps uvicorn's reload from double-logging.
    """
    root = logging.getLogger()
    if root.handlers:
        return

    logging.basicConfig(level=level, format=_FORMAT, datefmt=_DATEFMT)
    for name in _QUIET_LOGGERS:
        logging.getLogger(name).setLevel(logging.WARNING)
