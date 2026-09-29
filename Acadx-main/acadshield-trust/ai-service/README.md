# AcadShield document evidence service

This service extracts review evidence. It does not authenticate issuers, prove a document genuine, or make a fraud finding. Core owns exact-file hashing, credentials, signatures, lifecycle, and deterministic verification.

## Local analysis

Install `requirements.txt` and set `AI_SERVICE_API_KEY`. `POST /api/v1/analyze-document` accepts a multipart `file` plus optional JSON `template_json`, and requires `X-API-Key`. It returns:

- Exact uploaded-byte SHA-256 and a separate normalized OCR text fingerprint.
- Optional PaddleOCR text blocks and confidence. OCR is unavailable unless installed and its model is loadable.
- Heuristic document type and regex field candidates; none are verified facts.
- Page/text-block layout summaries and configured expected-field/page-count checks.
- PDF producer/dates/page size/catalog entries, or raster dimensions/EXIF counts. JPEG recompression difference is a weak clue, not a tamper classifier.
- Optional Isolation Forest reference-distribution evidence when a trusted model is configured.

`POST /api/v1/analyze-cross-document` compares OCR-derived `studentName`, `registerNumber`, and `dateOfBirth` candidates. Differences return `REVIEW_REQUIRED`; they are not fraud findings. Core performs its own holder-scoped comparison and persists the result.

`POST /api/v1/risk-score` aggregates submitted evidence without upgrading or replacing deterministic source results. `/health` and `/ready` are health probes.

## Optional model training

See [`dataset/README.md`](dataset/README.md). No document dataset, model weights, or model performance claim is included. Training requires at least 30 institution-approved, source-verified reference feature rows. The Isolation Forest only reports distance from that reference distribution; it is not a calibrated fraud probability.

After validating the model on a separately held-out dataset, place the artifact at a trusted local path and configure `ANOMALY_MODEL_PATH`. `joblib` artifacts can execute code while loading: never point this variable at a user-uploaded or otherwise untrusted file.

## Not implemented

There is no trained academic-document classifier, learned layout/template embedding, PDF visual forensics, QR/barcode decoder, image tamper model, or academic-course progression model. Government source checks require official API agreements/specifications and credentials. PaddleOCR is optional and may download weights at first use.
