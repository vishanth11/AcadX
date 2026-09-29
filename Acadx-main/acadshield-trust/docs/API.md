# Trust API

Base path: `/api/v1`

## Company verification

`POST /verify/credential` accepts multipart fields `credentialId` and `file`. Callers must provide either a Core-issued company session cookie or `X-API-Key`. API keys must include `credential:verify` scope. The service accepts PDF, PNG, JPEG, and GIF signatures up to `MAX_DOCUMENT_BYTES`, hashes the uploaded bytes with SHA-256, asks Core to verify the credential, optionally obtains AI risk evidence, and stores the verification record.

The `decision` is the Core source decision. An unavailable Core service yields `SOURCE_UNAVAILABLE`; AI evidence never upgrades that decision to `VERIFIED`.

## Verification history

`GET /verifications` returns up to 100 recent records for the authenticated company. API keys must include `verification:read` scope.

## Readiness and API key provisioning

- `GET /health` reports process liveness.
- `GET /ready` checks PostgreSQL connectivity.
- To seed a company API key, set `TRUST_API_KEY` (at least 32 characters) and `TRUST_API_COMPANY_ID` to the existing Core company UUID, then run `npm run prisma:seed`. Only the SHA-256 key hash is stored.

## AI evidence service

The FastAPI service runs separately on port 8000. `POST /api/v1/analyze-document` accepts a multipart file and optional `template_json`; `POST /api/v1/analyze-cross-document` compares OCR identity candidates; `POST /api/v1/risk-score` aggregates supplied signals. All require `X-API-Key`. AI outputs are review evidence and never replace the Core credential decision. See [`ai-service/README.md`](../ai-service/README.md) for outputs, model setup, and limitations.
