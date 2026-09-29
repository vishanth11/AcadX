"""Train an optional reference-distribution model from verified source records.

This model identifies unusual feature vectors; it is not a fraud classifier.
No example documents or model weights are bundled with the repository.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest

from app.ml_features import MODEL_FEATURES


def load_verified_rows(csv_path: Path) -> np.ndarray:
    with csv_path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = set(MODEL_FEATURES) | {"reference_verified"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")
        rows = []
        for line, row in enumerate(reader, start=2):
            if (row.get("reference_verified") or "").strip().casefold() not in {"true", "1", "yes"}:
                raise ValueError(f"Row {line} is not marked reference_verified")
            values = [float(row[name]) for name in MODEL_FEATURES]
            if not np.isfinite(values).all():
                raise ValueError(f"Row {line} contains a non-finite feature")
            rows.append(values)
    if len(rows) < 30:
        raise ValueError("At least 30 independently source-verified reference records are required")
    return np.asarray(rows, dtype=np.float64)


def train(input_csv: Path, output_path: Path, random_state: int = 42) -> dict:
    matrix = load_verified_rows(input_csv)
    model = IsolationForest(n_estimators=300, contamination="auto", random_state=random_state)
    model.fit(matrix)
    scores = model.score_samples(matrix)
    artifact = {
        "model": model,
        "featureNames": list(MODEL_FEATURES),
        "referenceScoreFloor": float(np.quantile(scores, 0.01)),
        "trainingRows": int(matrix.shape[0]),
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "modelType": "IsolationForest_reference_distribution",
        "meaning": "Out-of-reference-distribution signal only; not a fraud probability or authenticity result",
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, output_path)
    return {key: value for key, value in artifact.items() if key != "model"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="CSV of source-verified reference feature rows")
    parser.add_argument("--output", required=True, type=Path, help="Trusted local path for the model artifact")
    parser.add_argument("--random-state", type=int, default=42)
    args = parser.parse_args()
    print(json.dumps(train(args.input, args.output, args.random_state), indent=2))


if __name__ == "__main__":
    main()
