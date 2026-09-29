import hashlib

from fastapi.testclient import TestClient

from app import main

client = TestClient(main.app)


def test_health_does_not_claim_an_analysis_model():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"


def test_analysis_fails_closed_when_service_key_is_not_configured(monkeypatch):
    monkeypatch.delenv("AI_SERVICE_API_KEY", raising=False)
    response = client.post("/api/v1/analyze-document", files={"file": ("sample.pdf", b"%PDF-1.7\n", "application/pdf")})
    assert response.status_code == 503


def test_analysis_rejects_file_type_from_mime_header_only(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_API_KEY", "test-secret")
    response = client.post(
        "/api/v1/analyze-document",
        headers={"X-API-Key": "test-secret"},
        files={"file": ("fake.pdf", b"not a PDF", "application/pdf")},
    )
    assert response.status_code == 415


def test_analysis_hashes_original_bytes_and_keeps_decision_review_required(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_API_KEY", "test-secret")
    monkeypatch.setattr(main, "_ocr", lambda _data, _mime: {"status": "AVAILABLE", "pages": [{"page": 1, "text": "Bachelor of Science degree"}]})
    monkeypatch.setattr(main, "_metadata", lambda _data, _mime: {"status": "AVAILABLE", "metadataRisk": "LOW", "evidence": []})
    body = b"%PDF-1.7\nexample bytes"
    response = client.post(
        "/api/v1/analyze-document",
        headers={"X-API-Key": "test-secret"},
        files={"file": ("sample.pdf", body, "application/pdf")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["file"]["sha256"] == hashlib.sha256(body).hexdigest()
    assert payload["decision"] == "REVIEW_REQUIRED"
    assert payload["classification"]["status"] == "HEURISTIC_ONLY"
    assert payload["sourceVerification"]["status"] == "NOT_CONFIGURED"


def test_template_rules_are_reported_as_review_signals(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_API_KEY", "test-secret")
    monkeypatch.setattr(main, "_ocr", lambda _data, _mime: {"status": "AVAILABLE", "pages": [{"page": 1, "text": "Bachelor degree", "textBlocks": []}]})
    monkeypatch.setattr(main, "_metadata", lambda _data, _mime: {"status": "AVAILABLE", "metadataRisk": "LOW", "pageCount": 1, "evidence": []})
    response = client.post(
        "/api/v1/analyze-document",
        headers={"X-API-Key": "test-secret"},
        data={"template_json": '{"id":"template-1","templateName":"Degree v1","documentType":"DEGREE_CERTIFICATE","expectedFields":["studentName","registerNumber"],"expectedRegions":{"minPages":2}}'},
        files={"file": ("sample.pdf", b"%PDF-1.7\\nexample", "application/pdf")},
    )
    assert response.status_code == 200
    template = response.json()["templateAnalysis"]
    assert template["status"] == "SIGNALS_REPORTED"
    assert "EXPECTED_FIELDS_NOT_EXTRACTED" in [signal["type"] for signal in template["signals"]]
    assert response.json()["decision"] == "REVIEW_REQUIRED"


def test_cross_document_endpoint_flags_identity_differences_for_review(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_API_KEY", "test-secret")
    response = client.post(
        "/api/v1/analyze-cross-document",
        headers={"X-API-Key": "test-secret"},
        json={"documents": [
            {"documentId": "one", "fields": {"studentName": {"value": "Asha Nair"}}},
            {"documentId": "two", "fields": {"studentName": {"value": "Asha Rao"}}},
        ]},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "REVIEW_REQUIRED"
    assert response.json()["decision"] == "REVIEW_REQUIRED"


def test_risk_aggregation_does_not_call_absence_of_signals_low_risk(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_API_KEY", "test-secret")
    response = client.post(
        "/api/v1/risk-score",
        headers={"X-API-Key": "test-secret"},
        json={"signals": [], "source_status": "VERIFIED", "credential_status": "VERIFIED"},
    )
    assert response.status_code == 200
    assert response.json()["decision"] == "NO_MODEL_FINDING"
    assert response.json()["riskLevel"] == "NOT_ASSESSED"


def test_content_fingerprint_uses_normalized_structured_candidates():
    left = main._content_fingerprint({"fields": {"studentName": {"value": "Asha  Nair"}, "registerNumber": {"value": "AB-123"}}}, "")
    right = main._content_fingerprint({"fields": {"registerNumber": {"value": "AB-123"}, "studentName": {"value": "ASHA NAIR"}}}, "")
    assert left["value"] == right["value"]
    assert "structured field candidates" in left["basis"]
