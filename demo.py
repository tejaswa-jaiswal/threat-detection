"""Live webcam threat detection using RF-DETR.

Run with:
    python demo.py
    python demo.py --camera 0 --threshold 0.4

This script is kept for ad-hoc local testing. The shared inference code
lives in the ``inference`` package and is what the FastAPI app uses.
"""

import argparse
import sys

import cv2
import numpy as np
from PIL import Image

from inference.detector import (
    CLASS_COLORS,
    DEFAULT_WEIGHTS_FILE,
    THREAT_CLASSES,
    download_weights,
)
from inference.frames import annotate, bgr_to_pil
from inference.types import DetectionDict

WEIGHTS_FILE = DEFAULT_WEIGHTS_FILE


def draw_detections(pil_image: Image.Image, detections: DetectionDict) -> np.ndarray:
    img_bgr = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    h, w = img_bgr.shape[:2]

    if len(detections["xyxy"]) == 0:
        return img_bgr

    for box, class_id, conf in zip(
        detections["xyxy"], detections["class_id"], detections["confidence"]
    ):
        x1, y1, x2, y2 = map(int, box)
        label_name = THREAT_CLASSES.get(int(class_id), f"Class {class_id}")
        color = CLASS_COLORS.get(label_name, (255, 255, 255))
        label_text = f"{label_name} {conf:.0%}"

        thickness = max(2, int(min(w, h) / 300))
        cv2.rectangle(img_bgr, (x1, y1), (x2, y2), color, thickness)

        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = max(0.5, min(w, h) / 1000)
        (tw, th), baseline = cv2.getTextSize(label_text, font, font_scale, 2)
        cv2.rectangle(img_bgr, (x1, y1 - th - baseline - 6), (x1 + tw + 4, y1), color, -1)
        cv2.putText(
            img_bgr,
            label_text,
            (x1 + 2, y1 - baseline - 4),
            font,
            font_scale,
            (0, 0, 0),
            2,
            cv2.LINE_AA,
        )

    return img_bgr


def main() -> None:
    parser = argparse.ArgumentParser(description="Run threat detection on a webcam stream")
    parser.add_argument("--camera", type=int, default=0, help="Camera device index (default: 0)")
    parser.add_argument("--threshold", type=float, default=0.7, help="Detection confidence threshold")
    parser.add_argument("--resolution", type=int, default=576, help="Model input resolution")
    parser.add_argument("--output", type=str, default=None, help="Optional output video path")
    args = parser.parse_args()

    download_weights(WEIGHTS_FILE)

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print(f"[✗] Could not open camera {args.camera}", file=sys.stderr)
        sys.exit(1)

    writer = None
    if args.output:
        fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(args.output, fourcc, fps, (width, height))
        if not writer.isOpened():
            print(f"[✗] Could not create output video: {args.output}", file=sys.stderr)
            sys.exit(1)

    detector = ThreatDetector(
        weights=WEIGHTS_FILE,
        resolution=args.resolution,
        threshold=args.threshold,
    )

    print("[▶] Press 'q' to quit")
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        pil = bgr_to_pil(frame)
        dets = detector.predict(pil)
        annotated_frame = draw_detections(pil, dets)

        if writer is not None:
            writer.write(annotated_frame)

        cv2.imshow("Threat Detection - Live", annotated_frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    if writer is not None:
        writer.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
