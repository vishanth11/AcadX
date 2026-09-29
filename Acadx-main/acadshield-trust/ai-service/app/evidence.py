"""Local, explainable document signals. None of these functions decides authenticity."""

from __future__ import annotations

import io
import re
import unicodedata
from typing import Any


IDENTITY_FIELDS = ("studentName", "registerNumber", "dateOfBirth")


def normalize_value(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(character for character in text if not unicodedata.combining(character)).casefold()
    return re.sub(r"[^a-z0-9]+", "", text)


def compare_document_fields(documents: list[dict[str, Any]]) -> dict[str, Any]:
    """Compare identity candidates across a single holder's documents."""
    comparisons: list[dict[str, Any]] = []
    insufficient: list[str] = []
    for field in IDENTITY_FIELDS:
        values: list[dict[str, Any]] = []
        for document in documents:
            fields = document.get("fields") or {}
            candidate = fields.get(field)
            value = candidate.get("value") if isinstance(candidate, dict) else candidate
            if value is not None and str(value).strip():
                values.append({"documentId": str(document.get("documentId", "")), "value": str(value).strip()})
        distinct = {normalize_value(item["value"]) for item in values}
        if len(values) < 2:
            if values:
                insufficient.append(field)
            continue
        comparisons.append({"field": field, "status": "MATCH" if len(distinct) == 1 else "REVIEW_REQUIRED", "values": values})
    mismatches = [item for item in comparisons if item["status"] != "MATCH"]
    if mismatches:
        status = "REVIEW_REQUIRED"
    elif comparisons:
        status = "CONSISTENT"
    else:
        status = "INSUFFICIENT_EVIDENCE"
    return {
        "status": status,
        "decision": "REVIEW_REQUIRED" if status != "CONSISTENT" else "NO_IDENTITY_MISMATCH_DETECTED",
        "documentsCompared": len(documents),
        "comparisons": comparisons,
        "fieldsWithInsufficientRecords": insufficient,
        "evidence": ["Only OCR-derived identity candidates were compared", "A mismatch requires human review and is not a fraud finding"],
    }


def analyze_template(template: dict[str, Any] | None, classification: dict[str, Any], fields: dict[str, Any], metadata: dict[str, Any]) -> dict[str, Any]:
    if not template:
        return {"status": "NOT_CONFIGURED", "signals": [], "evidence": ["No institution template was supplied"]}
    expected = template.get("expectedFields", [])
    if isinstance(expected, dict):
        expected = expected.get("required", [])
    if not isinstance(expected, list) or not all(isinstance(item, str) for item in expected):
        return {"status": "INVALID_TEMPLATE", "signals": [], "evidence": ["Template expectedFields must be a list of field names"]}
    extracted = fields.get("fields", {})
    missing = [name for name in expected if not (isinstance(extracted.get(name), dict) and extracted[name].get("value"))]
    signals = []
    if missing:
        signals.append({"type": "EXPECTED_FIELDS_NOT_EXTRACTED", "severity": "LOW", "fields": missing})
    expected_type = re.sub(r"[^A-Z0-9]+", "_", str(template.get("documentType", "")).upper()).strip("_")
    actual_type = re.sub(r"[^A-Z0-9]+", "_", str(classification.get("documentType", "")).upper()).strip("_")
    if expected_type and actual_type and expected_type != actual_type:
        signals.append({"type": "DOCUMENT_TYPE_TEMPLATE_MISMATCH", "severity": "LOW", "expected": expected_type, "observed": actual_type})
    page_count = metadata.get("pageCount")
    regions = template.get("expectedRegions")
    if isinstance(regions, dict) and isinstance(page_count, int):
        min_pages, max_pages = regions.get("minPages"), regions.get("maxPages")
        if isinstance(min_pages, int) and page_count < min_pages or isinstance(max_pages, int) and page_count > max_pages:
            signals.append({"type": "PAGE_COUNT_OUTSIDE_TEMPLATE_RANGE", "severity": "LOW", "observed": page_count})
    return {
        "status": "SIGNALS_REPORTED" if signals else "NO_CONFIGURED_RULE_MISMATCH",
        "templateId": template.get("id"),
        "templateName": template.get("templateName"),
        "signals": signals,
        "evidence": ["Template checks cover configured fields, document type, and page-count rules only", "Template differences are review signals, not authenticity findings"],
    }


def analyze_raster_forensics(data: bytes, mime_type: str) -> dict[str, Any]:
    try:
        from PIL import Image, ImageChops, ImageStat
        Image.MAX_IMAGE_PIXELS = 40_000_000
        image = Image.open(io.BytesIO(data))
        dimensions = {"width": image.width, "height": image.height}
        exif = image.getexif()
        if mime_type != "image/jpeg":
            return {"status": "PARTIAL", "method": "image_metadata_only", "dimensions": dimensions, "exifTagCount": len(exif), "signals": [], "evidence": ["ELA is only calculated for JPEG inputs; metadata and dimensions do not establish authenticity"]}
        original = image.convert("RGB")
        recompressed = io.BytesIO()
        original.save(recompressed, format="JPEG", quality=90)
        recompressed.seek(0)
        difference = ImageChops.difference(original, Image.open(recompressed).convert("RGB"))
        mean_difference = sum(ImageStat.Stat(difference).mean) / 3
        return {
            "status": "HEURISTIC_SIGNAL",
            "method": "single_quality_90_recompression_difference",
            "dimensions": dimensions,
            "exifTagCount": len(exif),
            "recompressionDifferenceMean": round(mean_difference, 3),
            "signals": [],
            "evidence": ["ELA-style recompression difference is a weak visual clue and is not a tamper classifier", "Re-exports and scans naturally change compression patterns"],
        }
    except Exception as exc:
        return {"status": "UNAVAILABLE", "signals": [], "evidence": [f"Raster analysis unavailable ({type(exc).__name__})"]}


def summarize_layout(ocr: dict[str, Any]) -> dict[str, Any]:
    pages = ocr.get("pages") or []
    summaries = []
    for page in pages:
        blocks = page.get("textBlocks") or []
        summaries.append({"page": page.get("page"), "textBlockCount": len(blocks), "textLength": len(page.get("text", "")), "likelyContinuation": page.get("page", 1) > 1})
    all_text = "\n".join(str(page.get("text", "")) for page in pages).casefold()
    boundaries = len(re.findall(r"(?:degree certificate|marks statement|transcript)", all_text))
    return {"status": "HEURISTIC_ONLY" if pages else "UNAVAILABLE", "pages": summaries, "possibleMultipleDocuments": boundaries > 1, "evidence": ["Page and text-block counts come from OCR output; no trained layout model is configured"]}
