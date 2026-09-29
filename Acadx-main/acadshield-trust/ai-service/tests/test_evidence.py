from app.evidence import analyze_raster_forensics, analyze_template, compare_document_fields, summarize_layout
from app.ml_features import MODEL_FEATURES, build_features


def test_cross_document_differences_are_review_signals_only():
    result = compare_document_fields([
        {"documentId": "a", "fields": {"studentName": {"value": "Asha Nair"}, "registerNumber": {"value": "AB-12"}}},
        {"documentId": "b", "fields": {"studentName": {"value": "Asha Rao"}, "registerNumber": {"value": "AB12"}}},
    ])
    assert result["status"] == "REVIEW_REQUIRED"
    assert result["comparisons"][1]["status"] == "MATCH"
    assert "fraud" in result["evidence"][1].lower()


def test_template_missing_fields_do_not_change_authenticity():
    result = analyze_template(
        {"id": "t1", "documentType": "Degree Certificate", "expectedFields": ["studentName"]},
        {"documentType": "DEGREE_CERTIFICATE"},
        {"fields": {}},
        {"pageCount": 1},
    )
    assert result["status"] == "SIGNALS_REPORTED"
    assert result["signals"][0]["type"] == "EXPECTED_FIELDS_NOT_EXTRACTED"


def test_layout_summary_reports_only_observed_ocr_counts():
    result = summarize_layout({"pages": [{"page": 1, "text": "degree", "textBlocks": [{"text": "degree"}]}]})
    assert result["pages"] == [{"page": 1, "textBlockCount": 1, "textLength": 6, "likelyContinuation": False}]
    assert result["status"] == "HEURISTIC_ONLY"


def test_ml_features_are_versioned_and_numeric():
    features = build_features(
        {"pages": [{"text": "degree", "textBlocks": [{"confidence": 0.91}]}]},
        {"pageCount": 1, "width": 800, "height": 1000},
        {"fields": {"studentName": {"value": "Asha"}}},
        {"dimensions": {"width": 800, "height": 1000}, "recompressionDifferenceMean": 2.5},
    )
    assert tuple(features) == MODEL_FEATURES
    assert features["ocr_mean_confidence"] == 0.91
    assert all(isinstance(value, float) for value in features.values())


def test_raster_forensics_does_not_call_images_authentic():
    from io import BytesIO
    from PIL import Image

    output = BytesIO()
    Image.new("RGB", (40, 30), color="white").save(output, format="JPEG")
    result = analyze_raster_forensics(output.getvalue(), "image/jpeg")
    assert result["status"] == "HEURISTIC_SIGNAL"
    assert result["dimensions"] == {"width": 40, "height": 30}
    assert any("not a tamper classifier" in item for item in result["evidence"])
