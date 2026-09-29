"""Load an administrator-provisioned local model and report only anomaly evidence."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from app.ml_features import MODEL_FEATURES


def score_with_configured_model(features: dict[str, float]) -> dict[str, Any]:
    model_path = os.getenv("ANOMALY_MODEL_PATH")
    if not model_path:
        return {"status": "NOT_CONFIGURED", "modelType": None, "signals": [], "evidence": ["No locally trained anomaly model was configured"]}
    path = Path(model_path)
    if not path.is_file():
        return {"status": "UNAVAILABLE", "modelType": None, "signals": [], "evidence": ["Configured model artifact is not present"]}
    try:
        import joblib
        artifact = joblib.load(path)
        if artifact.get("featureNames") != list(MODEL_FEATURES) or "model" not in artifact:
            return {"status": "INVALID_ARTIFACT", "modelType": None, "signals": [], "evidence": ["Model feature schema does not match this service version"]}
        vector = [[features[name] for name in MODEL_FEATURES]]
        score = float(artifact["model"].score_samples(vector)[0])
        outlier = score < float(artifact["referenceScoreFloor"])
        return {
            "status": "AVAILABLE",
            "modelType": artifact.get("modelType"),
            "referenceRows": artifact.get("trainingRows"),
            "anomalyScore": round(score, 6),
            "scoreMeaning": "Isolation Forest reference-distribution score; not a probability",
            "signals": [{"type": "OUTSIDE_REFERENCE_DISTRIBUTION", "severity": "MEDIUM", "score": round(score, 6)}] if outlier else [],
            "evidence": ["Model was trained on an institution-approved reference set", "Outlier status requires human review and does not establish tampering"],
        }
    except Exception as exc:
        return {"status": "UNAVAILABLE", "modelType": None, "signals": [], "evidence": [f"Model inference failed ({type(exc).__name__})"]}
