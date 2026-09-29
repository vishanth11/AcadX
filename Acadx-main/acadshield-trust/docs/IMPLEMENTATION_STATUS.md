# AcadShield Trust status

## Implemented

- Express API with authenticated company verification and history, Core credential source calls, hashed API keys, scopes, expiry, and quota enforcement.
- Prisma schema/migration for company API keys and verification records.
- FastAPI evidence service with authenticated document-analysis, risk aggregation, and cross-document routes.
- Optional PaddleOCR; heuristic type/field extraction; page/text-block summaries; PDF metadata/catalog inspection; raster metadata and weak JPEG recompression metrics; configured template rules; versioned feature vector; optional Isolation Forest training/inference code.

## Limits

- The Trust frontend and Trust Passport/graph screens are still demo views. Core company upload/history screens are connected to Core data.
- AI has no included training data or validated model weights. Its score is a reference-distribution outlier signal only and does not establish fraud or authenticity.
- Visual tamper classifiers, trained layout embeddings, QR/barcode decoding, and academic marks/course progression checks are not implemented.
- Uploaded Trust verification files are analyzed in memory and not retained. Malware scanning, retention controls, and encryption policies still need deployment decisions.
- Live PostgreSQL and Docker services were not started. Company keys need an existing company UUID and local provisioning.
- NAD/DigiLocker, production blockchain, and IPFS remain deployment integrations configured in Core and require external contracts, credentials, and live service checks.

## Verification

The Trust TypeScript build and backend/API tests are run separately. AI service tests are in `ai-service/tests`; the optional trainer CLI can be smoke-checked with `python -m app.ml.train_anomaly --help`. A real model training run is intentionally not possible without a source-reviewed dataset.
