# ACADSHIELD Core

Core is the credential registry and issuer service in ACADSHIELD X. This repository contains a Next.js portal, Express/Prisma API, PostgreSQL migrations, a soulbound credential contract, and integration points for AcadShield Trust and optional document analysis.

## Current capabilities

- Password login with HTTP-only sessions and role-scoped API access.
- Private university document upload, exact-byte SHA-256, human review, and signed VC-JWT issuance.
- Institution-managed document templates and holder-scoped cross-document consistency checks. Differences remain human-review signals.
- Explicit optional contract mint/revoke with confirmed transaction receipts and event-derived token IDs.
- Public credential resolver and QR generation, plus company document verification and evidence history.
- Optional PII-free Pinata V3 credential metadata upload. It is disabled by default.
- Optional AI evidence for OCR-derived fields, layout counts, metadata, JPEG recompression metrics, and a locally trained reference-distribution model.
- API-backed university document/credential and company/public verification flows. Other portal dashboards still contain demo/sample views.

See [API.md](docs/API.md) for routes and configuration, and [IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) for limitations and unconfigured external integrations.

## Local development

Requirements: Node.js 20+, npm, and PostgreSQL 16. Copy `.env.example` to `backend/.env`, configure a local database and random secrets, then:

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

In another terminal:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

To run the local contract suite:

```powershell
cd contracts
npm install
npm test
```

Docker Compose requires configured database and application secrets. Blockchain minting, Pinata uploads, and official NAD/DigiLocker checks need the external deployment inputs described in the environment template and implementation status.

## Verification routes

- Public page: `http://localhost:3000/verify/{credentialId}`
- Public API: `GET /api/v1/verify/{credentialId}`
- Company upload: `POST /api/v1/company/verifications` (authenticated multipart form)
- Trust service verification: `POST /api/v1/internal/verify-credential` with `X-API-Key` and the credential ID plus exact document SHA-256.

AI analysis is review evidence and does not override deterministic signature, source, file-hash, lifecycle, or chain checks.
