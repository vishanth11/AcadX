# ACADSHIELD X

ACADSHIELD X contains two services:

- `acadshield-core/`: university source registry, credential issuance and lifecycle, deterministic verification, public resolver, company verification, and the Core web portal.
- `acadshield-trust/`: employer verification API and evidence-only document analysis service.

## Current implementation

Core uses PostgreSQL/Prisma, private document storage, signed VC-JWTs, optional explicit NFT mint/revoke, and optional PII-free Pinata metadata. University and company flows for source review, templates, credentials, QR resolution, and verification history are API-backed. Selected admin oversight pages read live database records. Unsupported candidate, Trust Passport/graph, student, and analytics features are clearly marked as unavailable or demo-only; they do not present sample credentials as real evidence.

The AI service supports optional PaddleOCR, heuristic classification and extraction, layout summaries, template field/page rules, metadata inspection, weak JPEG recompression measurements, cross-document identity comparisons, and a trainable Isolation Forest reference-distribution signal. It does not decide authenticity. No model dataset, trained artifact, or performance result is included.

## Local verification

From this application directory, install each package with `npm run setup:node` and create the AI virtual environment using [Phase 1 setup instructions](PHASE1.md). Then:

```powershell
npm test
npm run check
```

See [Phase 1 implementation and handoff](PHASE1.md) for the fixes, affected files, independent test commands, upload reconciliation, configuration requirements, and remaining risks. The root runner executes every suite and summarizes failures. See also [Core implementation status](acadshield-core/docs/IMPLEMENTATION_STATUS.md) and [AI service notes](acadshield-trust/ai-service/README.md).

## External configuration

Live database deployment, blockchain transaction testing, Pinata uploads, and NAD/DigiLocker checks require deployment resources and official credentials. DigiLocker/NAD integrations are deliberately unconfigured until approved API specifications and credentials are provided. Docker Compose files are present, but this checkout has not been deployed as a live stack.
