"""YOLOv8 threat detector wrapper and weights management."""

import logging
import os
from pathlib import Path

from PIL import Image

from inference.types import DetectionDict

logger = logging.getLogger(__name__)

THREAT_CLASSES: dict[int, str] = {
    0: "Gun",
    1: "Explosive",
    2: "Grenade",
    3: "Knife",
}

CLASS_COLORS: dict[str, tuple[int, int, int]] = {
    "Gun": (0, 0, 255),
    "Explosive": (0, 165, 255),
    "Grenade": (0, 255, 255),
    "Knife": (0, 255, 0),
}

LABEL_TO_ENUM: dict[str, str] = {
    "Gun": "Gun",
    "Explosive": "Explosives",
    "Grenade": "Grenade",
    "Knife": "Knife",
}


def download_weights(weights_path: str | os.PathLike[str] = "models/best.pt") -> str:
    """Download YOLOv8 model from HuggingFace if needed.
    
    If weights_path is a local file, use it directly.
    Otherwise, download from HuggingFace repo.
    
    Returns the local path to the weights file.
    """
    from huggingface_hub import hf_hub_download

    weights_path = Path(weights_path)
    
    # If local file exists, return it
    if weights_path.exists():
        return str(weights_path)
    
    # Download from HuggingFace
    logger.info("downloading YOLOv8 weights from HuggingFace")
    model_path = hf_hub_download(
        repo_id="Subh775/Threat-Detection-YOLOv8n",
        filename="best.pt"
    )
    logger.info("weights saved to %s", model_path)
    return str(model_path)



class ThreatDetector:
    """Loaded YOLOv8 model with class-id → threat-enum mapping."""

    def __init__(
        self,
        weights: str,
        resolution: int = 576,
        threshold: float = 0.5,
    ) -> None:
        from ultralytics import YOLO

        weights_path = download_weights(weights)
        self.threshold = threshold
        self.resolution = resolution
        
        # Load YOLOv8 model
        self.model = YOLO(weights_path)
        
        logger.info(
            "threat detector ready weights=%s resolution=%d threshold=%.2f",
            weights_path,
            resolution,
            threshold,
        )

    def predict(self, pil_image: Image.Image) -> DetectionDict:
        """Run YOLOv8 inference on a PIL image and return typed detections."""
        # Run inference
        results = self.model(pil_image, conf=self.threshold, imgsz=self.resolution)
        result = results[0]
        
        threat_types: list[str | None] = []
        xyxy_list = []
        class_id_list = []
        confidence_list = []
        
        # Extract detections
        if result.boxes is not None:
            for box in result.boxes:
                cls_id = int(box.cls)
                conf = float(box.conf)
                
                # Get threat type
                label = THREAT_CLASSES.get(cls_id)
                threat_type = LABEL_TO_ENUM.get(label) if label else None
                threat_types.append(threat_type)
                
                # Get bounding box (xyxy format)
                xyxy = box.xyxy[0].tolist()
                xyxy_list.append(xyxy)
                
                confidence_list.append(conf)
                class_id_list.append(cls_id)
        
        
        return {
            "xyxy": xyxy_list,
            "class_id": class_id_list,
            "confidence": confidence_list,
            "threat_types": threat_types,
        }
