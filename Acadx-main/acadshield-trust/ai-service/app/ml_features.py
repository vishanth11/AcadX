"""Versioned numeric features shared by optional training and inference."""

MODEL_FEATURES = (
    "page_count",
    "ocr_mean_confidence",
    "text_block_count",
    "ocr_character_count",
    "field_candidate_count",
    "metadata_timestamp_delta",
    "recompression_difference_mean",
    "page_aspect_ratio",
)


def build_features(ocr: dict, metadata: dict, fields: dict, forensics: dict) -> dict[str, float]:
    pages = ocr.get("pages") or []
    confidences = [
        float(block["confidence"])
        for page in pages
        for block in page.get("textBlocks", [])
        if isinstance(block, dict) and isinstance(block.get("confidence"), (int, float))
    ]
    width = forensics.get("dimensions", {}).get("width", metadata.get("width", 0))
    height = forensics.get("dimensions", {}).get("height", metadata.get("height", 0))
    creation, modification = metadata.get("creationDate"), metadata.get("modificationDate")
    return {
        "page_count": float(metadata.get("pageCount") or len(pages)),
        "ocr_mean_confidence": sum(confidences) / len(confidences) if confidences else 0.0,
        "text_block_count": float(sum(len(page.get("textBlocks") or []) for page in pages)),
        "ocr_character_count": float(sum(len(str(page.get("text", ""))) for page in pages)),
        "field_candidate_count": float(len(fields.get("fields", {}))),
        "metadata_timestamp_delta": float(bool(creation and modification and creation != modification)),
        "recompression_difference_mean": float(forensics.get("recompressionDifferenceMean") or 0.0),
        "page_aspect_ratio": float(width) / float(height) if width and height else 0.0,
    }
