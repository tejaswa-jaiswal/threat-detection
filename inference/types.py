"""Typed payloads shared between detector and frame helpers."""

from typing import TypedDict


class DetectionDict(TypedDict):
    """A single inference result for one frame."""

    xyxy: list[list[float]]
    class_id: list[int]
    confidence: list[float]
    threat_types: list[str | None]
