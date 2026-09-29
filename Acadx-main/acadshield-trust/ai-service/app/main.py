"""Evidence-producing document analysis API.

This service does not make authenticity decisions. It reports observable
signals and explicitly identifies integrations that are not configured.
"""

from __future__ import annotations

import hashlib
import hmac
import io
import json
import os
import re
import time
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.evidence import analyze_raster_forensics, analyze_template, compare_document_fields, summarize_layout
from app.ml.inference import score_with_configured_model
from app.ml_features import build_features

MAX_UPLOAD_BYTES = int(os.getenv("MAX_DOCUMENT_BYTES", str(15 * 1024 * 1024)))
MAX_PDF_PAGES = int(os.getenv("MAX_PDF_PAGES", "20"))
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("AI_CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app = FastAPI(
    title="AcadShield Trust AI Service",
    description="Document OCR and explainable analysis signals; not an authenticity authority.",
    version="1.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class RiskRequest(BaseModel):
    signals: list[dict[str, Any]] = Field(default_factory=list)
    source_status: str = "NOT_CHECKED"
    credential_status: str = "NOT_CHECKED"


class CrossDocumentRequest(BaseModel):
    documents: list[dict[str, Any]] = Field(min_length=1, max_length=100)


def _file_type(data: bytes) -> str | None:
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    return None


def _ocr(data: bytes, mime_type: str) -> dict[str, Any]:
    """Run PaddleOCR when installed; never substitute a fabricated OCR result."""
    try:
        from paddleocr import PaddleOCR  # type: ignore[import-not-found]
    except Exception as exc:  # optional ML runtime / model availability
        return {"status": "UNAVAILABLE", "reason": f"PaddleOCR unavailable: {type(exc).__name__}", "pages": []}

    try:
        import numpy as np
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = 40_000_000

        images = []
        if mime_type == "application/pdf":
            try:
                import pypdfium2 as pdfium  # type: ignore[import-not-found]
            except Exception:
                return {"status": "UNAVAILABLE", "reason": "PDF rasterizer pypdfium2 is not installed", "pages": []}
            pdf = pdfium.PdfDocument(data)
            page_count = len(pdf)
            if page_count > MAX_PDF_PAGES:
                return {"status": "PARTIAL", "reason": f"PDF has {page_count} pages; analysis limit is {MAX_PDF_PAGES}", "pages": []}
            images = [page.render(scale=1.5).to_pil() for page in pdf]
        else:
            images = [Image.open(io.BytesIO(data)).convert("RGB")]

        engine = _get_ocr_engine(PaddleOCR)
        pages = []
        for page_no, image in enumerate(images, start=1):
            raw = engine.ocr(np.asarray(image), cls=True) or []
            blocks = []
            for line in raw[0] if raw else []:
                box, result = line
                blocks.append({"text": result[0], "confidence": float(result[1]), "boundingBox": box})
            pages.append({"page": page_no, "textBlocks": blocks, "text": "\n".join(b["text"] for b in blocks)})
        return {"status": "AVAILABLE", "pages": pages}
    except Exception as exc:
        return {"status": "FAILED", "reason": f"OCR processing failed: {type(exc).__name__}", "pages": []}


@lru_cache(maxsize=1)
def _get_ocr_engine(factory: Any) -> Any:
    return factory(use_angle_cls=True, lang="en", show_log=False)


def _classify(text: str) -> dict[str, Any]:
    catalog = {
        "SSLC_MARKSHEET": (r"sslc|secondary school leaving", r"marksheet|mark sheet|statement of marks"),
        "HSC_MARKSHEET": (r"hsc|higher secondary|class xii|class 12", r"marksheet|mark sheet|statement of marks"),
        "SEMESTER_MARKSHEET": (r"semester|term [1-9]", r"marksheet|mark sheet|statement of marks"),
        "CONSOLIDATED_MARKSHEET": (r"consolidated|cumulative", r"marksheet|statement of marks"),
        "ACADEMIC_TRANSCRIPT": (r"transcript|academic record|credits attempted",),
        "DEGREE_CERTIFICATE": (r"degree|conferred|bachelor|master|undergraduate|postgraduate",),
        "DEGREE_COMPLETION_CERTIFICATE": (r"degree completion|completed all requirements",),
        "PROVISIONAL_DEGREE_CERTIFICATE": (r"provisional degree|provisional certificate",),
        "TRANSFER_CERTIFICATE": (r"transfer certificate|leaving certificate",),
        "MIGRATION_CERTIFICATE": (r"migration certificate",),
        "BONAFIDE_CERTIFICATE": (r"bonafide|bona fide",),
        "CHARACTER_CERTIFICATE": (r"character certificate|conduct certificate",),
        "COURSE_COMPLETION_CERTIFICATE": (r"course completion|completion certificate",),
        "RANK_CERTIFICATE": (r"rank certificate|rank holder|ranked [0-9]+",),
        "ACADEMIC_ACHIEVEMENT_CERTIFICATE": (r"academic achievement|academic excellence",),
        "INTERNSHIP_CERTIFICATE": (r"internship|intern",),
        "TRAINING_CERTIFICATE": (r"training certificate|successfully completed training",),
        "WORKSHOP_CERTIFICATE": (r"workshop|participation certificate",),
        "SKILL_CERTIFICATE": (r"skill certificate|competency certificate",),
        "DIPLOMA_CERTIFICATE": (r"diploma|polytechnic",),
        "OTHER_UNDERGRADUATE_DEGREE": (r"undergraduate|bachelor of",),
        "OTHER_POSTGRADUATE_DEGREE": (r"postgraduate|master of",),
    }
    folded = text.casefold()
    ranked = sorted(
        ((name, sum(bool(re.search(term, folded)) for term in terms)) for name, terms in catalog.items()),
        key=lambda pair: pair[1], reverse=True,
    )
    hits = [name for name, score in ranked if score]
    if not hits:
        return {"documentType": "OTHER_INSTITUTION_DOCUMENT", "confidence": 0.0, "candidateTypes": [], "evidence": ["No supported document-type terms found"], "status": "HEURISTIC_ONLY"}
    confidence = min(0.85, 0.45 + 0.15 * ranked[0][1])
    return {"documentType": ranked[0][0], "confidence": confidence, "candidateTypes": hits[:3], "evidence": [f"Matched document-type terms for {ranked[0][0]}"], "status": "HEURISTIC_ONLY"}


def _extract_fields(text: str) -> dict[str, Any]:
    patterns = {
        "studentName": r"(?:student\s+)?name\s*[:\-]\s*([A-Z][A-Z .'-]{2,80})",
        "institutionName": r"(?:university|institution|college)\s*(?:name)?\s*[:\-]\s*([A-Z][A-Z0-9 &'.,()-]{3,120})",
        "registerNumber": r"(?:register|registration|roll|enrol(?:l)?ment)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9/-]{4,})",
        "certificateNumber": r"(?:certificate|serial|document)\s*(?:no\.?|number|#)\s*[:\-]?\s*([A-Z0-9/-]{3,})",
        "issueDate": r"(?:date of issue|issued on|issue date)\s*[:\-]?\s*([0-9]{1,4}[./-][A-Za-z0-9]{1,9}[./-][0-9]{2,4})",
        "dateOfBirth": r"(?:date of birth|dob)\s*[:\-]?\s*([0-9]{1,4}[./-][A-Za-z0-9]{1,9}[./-][0-9]{2,4})",
        "course": r"(?:course|program(?:me)?)\s*[:\-]\s*([A-Z][A-Z0-9 &'.,()-]{2,100})",
        "semester": r"(?:semester|term)\s*[:\-]?\s*([0-9]{1,2}(?:st|nd|rd|th)?)",
        "graduationYear": r"\b(20[0-9]{2})\b",
    }
    fields = {}
    for field, pattern in patterns.items():
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        if matches:
            fields[field] = {"value": matches[0], "confidence": 0.55, "method": "regex_candidate", "verified": False}
    return {"status": "HEURISTIC_CANDIDATES" if fields else "NO_FIELDS_FOUND", "fields": fields, "evidence": ["Values are OCR-derived candidates and require human or authoritative-source confirmation"]}


def _metadata(data: bytes, mime_type: str) -> dict[str, Any]:
    if mime_type != "application/pdf":
        try:
            from PIL import Image
            Image.MAX_IMAGE_PIXELS = 40_000_000
            image = Image.open(io.BytesIO(data))
            exif = image.getexif()
            return {"status": "PARTIAL", "metadataRisk": "UNKNOWN", "width": image.width, "height": image.height, "format": image.format, "exifTagCount": len(exif), "evidence": ["Raster metadata is partial; EXIF absence or presence does not determine authenticity"]}
        except Exception as exc:
            return {"status": "FAILED", "metadataRisk": "UNKNOWN", "evidence": [f"Image metadata could not be read ({type(exc).__name__})"]}
    try:
        from pypdf import PdfReader  # type: ignore[import-not-found]
        reader = PdfReader(io.BytesIO(data), strict=False)
        meta = reader.metadata or {}
        creation = meta.get("/CreationDate")
        modification = meta.get("/ModDate")
        evidence = [f"PDF contains {len(reader.pages)} page(s)"]
        risk = "LOW"
        if creation and modification and str(creation) != str(modification):
            evidence.append("Creation and modification timestamps differ; this can be normal after re-export or editing")
            risk = "MEDIUM"
        root = reader.trailer["/Root"].get_object()
        active_content = []
        for key in ("/OpenAction", "/JavaScript", "/JS", "/EmbeddedFiles"):
            if root.get(key) is not None:
                active_content.append(key)
        annotation_count = sum(len(page.get("/Annots", [])) for page in reader.pages)
        if active_content:
            evidence.append(f"PDF catalog contains potentially active/embedded entries: {', '.join(active_content)}")
            risk = "MEDIUM"
        if annotation_count:
            evidence.append(f"PDF contains {annotation_count} annotation(s); annotations may be benign")
        return {
            "status": "AVAILABLE",
            "metadataRisk": risk,
            "pageCount": len(reader.pages),
            "pageDimensions": [{"width": float(page.mediabox.width), "height": float(page.mediabox.height)} for page in reader.pages[:MAX_PDF_PAGES]],
            "annotationCount": annotation_count,
            "potentiallyActiveCatalogEntries": active_content,
            "producer": meta.get("/Producer"),
            "creator": meta.get("/Creator"),
            "creationDate": str(creation) if creation else None,
            "modificationDate": str(modification) if modification else None,
            "evidence": evidence,
        }
    except Exception as exc:
        return {"status": "FAILED", "metadataRisk": "UNKNOWN", "evidence": [f"PDF metadata could not be read ({type(exc).__name__})"]}


def _normalized_fingerprint(text: str) -> str | None:
    # Text-derived normalization is explicitly weaker than normalized
    # structured fields and is not used as an authenticity decision.
    normalized = re.sub(r"[^\w]+", " ", text.casefold(), flags=re.UNICODE).strip()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest() if normalized else None


def _content_fingerprint(fields: dict[str, Any], text: str) -> dict[str, Any]:
    candidates = fields.get("fields", {})
    stable_candidates = {
        key: re.sub(r"\s+", " ", str(candidate.get("value", ""))).strip().casefold()
        for key, candidate in sorted(candidates.items())
        if isinstance(candidate, dict) and candidate.get("value") is not None
    }
    if stable_candidates:
        normalized = json.dumps(stable_candidates, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return {"algorithm": "SHA-256", "value": hashlib.sha256(normalized.encode("utf-8")).hexdigest(), "basis": "normalized OCR-derived structured field candidates; unverified"}
    return {"algorithm": "SHA-256", "value": _normalized_fingerprint(text), "basis": "normalized OCR text fallback; unverified"}


@app.get("/health")
def health_check() -> dict[str, Any]:
    return {"status": "UP", "service": "acadshield-trust-ai", "version": "1.1.0", "timestamp": int(time.time())}


@app.get("/ready")
def readiness_probe() -> dict[str, Any]:
    return {"status": "READY", "ocr": "AVAILABLE" if _ocr_configured() else "UNAVAILABLE"}


def _ocr_configured() -> bool:
    try:
        import paddleocr  # noqa: F401
        return True
    except Exception:
        return False


def _authorize(api_key: str | None) -> None:
    expected = os.getenv("AI_SERVICE_API_KEY")
    if not expected:
        raise HTTPException(status_code=503, detail="AI service authentication is not configured")
    if not api_key or not hmac.compare_digest(api_key, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.post("/api/v1/analyze-document")
async def analyze_document(file: UploadFile = File(...), template_json: str | None = Form(default=None), x_api_key: str | None = Header(default=None)) -> dict[str, Any]:
    _authorize(x_api_key)
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_UPLOAD_BYTES} byte limit")
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    mime_type = _file_type(data)
    if mime_type not in {"application/pdf", "image/png", "image/jpeg", "image/gif"}:
        raise HTTPException(status_code=415, detail="Unsupported or invalid file signature")
    ocr = _ocr(data, mime_type)
    text = "\n".join(page.get("text", "") for page in ocr.get("pages", []))
    classification = _classify(text)
    fields = _extract_fields(text)
    metadata = _metadata(data, mime_type)
    layout = summarize_layout(ocr)
    forensics = analyze_raster_forensics(data, mime_type) if mime_type != "application/pdf" else {"status": "NOT_IMPLEMENTED", "signals": [], "evidence": ["PDF visual forensics is not implemented; metadata is reported separately"]}
    features = build_features(ocr, metadata, fields, forensics)
    anomalyModel = score_with_configured_model(features)
    try:
        template = json.loads(template_json) if template_json else None
        if template is not None and not isinstance(template, dict):
            raise ValueError("template must be a JSON object")
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid template_json")
    evidence = ["Original uploaded bytes were SHA-256 hashed", "No authoritative issuer or government source was queried"]
    if ocr["status"] != "AVAILABLE":
        evidence.append("OCR is unavailable; content classification and extraction are incomplete")
    return {
        "analysisId": hashlib.sha256(data).hexdigest()[:24],
        "decision": "REVIEW_REQUIRED",
        "decisionBasis": "AI analysis cannot establish issuer authenticity; source verification is not configured in this service",
        "file": {"mimeType": mime_type, "sizeBytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "hashAlgorithm": "SHA-256"},
        "contentFingerprint": _content_fingerprint(fields, text),
        "ocr": ocr,
        "layout": layout,
        "classification": classification,
        "fieldExtraction": fields,
        "templateAnalysis": analyze_template(template, classification, fields, metadata),
        "forensics": forensics,
        "anomalyModel": anomalyModel,
        "modelFeatures": features,
        "metadata": metadata,
        "sourceVerification": {"status": "NOT_CONFIGURED"},
        "evidence": evidence,
        "analyzedAt": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/v1/analyze-cross-document")
def analyze_cross_document(request: CrossDocumentRequest, x_api_key: str | None = Header(default=None)) -> dict[str, Any]:
    _authorize(x_api_key)
    return compare_document_fields(request.documents)


@app.post("/api/v1/risk-score")
def risk_score(request: RiskRequest, x_api_key: str | None = Header(default=None)) -> dict[str, Any]:
    """Aggregate provided evidence without overriding deterministic checks."""
    _authorize(x_api_key)
    evidence = []
    severity_rank = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
    for signal in request.signals:
        severity = str(signal.get("severity", "LOW")).upper()
        if severity in severity_rank:
            evidence.append({"type": signal.get("type", "UNSPECIFIED"), "severity": severity, "source": signal.get("source", "provided signal")})
    unavailable = request.source_status in {"NOT_CHECKED", "UNAVAILABLE", "NOT_CONFIGURED"}
    max_severity = max((item["severity"] for item in evidence), key=lambda item: severity_rank[item], default=None)
    risk_level = "UNKNOWN" if unavailable else (max_severity or "NOT_ASSESSED")
    return {
        "decision": "REVIEW_REQUIRED" if evidence or unavailable else "NO_MODEL_FINDING",
        "riskLevel": risk_level,
        "modelStatus": "RULE_AGGREGATION_ONLY",
        "evidence": evidence + ([{"type": "SOURCE_NOT_VERIFIED", "severity": "UNKNOWN"}] if unavailable else []),
        "deterministicStatus": request.credential_status,
        "note": "AI risk output does not alter signature, issuer, source, blockchain, or lifecycle verification results.",
    }
