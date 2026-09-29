# ACADSHIELD implementation status

## Delivered in this checkout

- Core Express API and Prisma schema/migrations for authentication, role-scoped administration, private source documents, credential issuance/revocation, verification records, and audit events.
- Core frontend authentication and the university/company/public credential flows use Core APIs for credentials, document review, QR generation, public resolution, and company verification history.
- Credential issuance signs VC-JWTs with the configured issuer key. The explicit blockchain mint action confirms the transaction and derives the token ID from the contract event. Revocation and resolver checks include chain evidence when a credential is minted.
- Optional Pinata V3 upload stores a public manifest that omits holder data and original files. It is disabled by default; without it, chain metadata points to the public resolver.
- Institution template versions can be created and activated per document type; configured field/page rules are applied as review signals during upload.
- Cross-document checks compare extracted student name, registration number, and date-of-birth candidates for the same institutional holder reference and persist evidence without calling a remote AI service.
- AI service reports OCR layout summaries, PDF metadata/catalog entries, raster metadata and JPEG recompression metrics, configured template rules, and optional Isolation Forest reference-distribution signals. Its output is evidence only.
- Trust backend has company verification APIs, calls Core as a source provider, and can request optional Trust AI scoring. The AI service has authenticated analysis and evidence-aggregation routes with optional PaddleOCR.
- The credential contract is non-transferable and has Hardhat tests. The AI service includes tests for its current evidence and safety behavior.

## Remaining work and operational limits

| Capability | Status | Current limitation |
|---|---|---|
| Exact file hashing and private upload | PARTIAL | Core checks supported file signatures and size, hashes exact bytes, and stores originals privately. Malware scanning, encryption at rest, object storage, and retention controls are not configured. |
| OCR and document analysis | PARTIAL | PaddleOCR is optional; classification/extraction remain heuristic. Layout summaries, page-count/field template rules, PDF metadata/catalog inspection, and weak JPEG recompression metrics are implemented. Trained visual forensics, learned layout/region matching, and QR/barcode extraction remain unavailable. |
| Cross-document consistency | PARTIAL | Core compares OCR candidate identity fields within one institution and holder reference. It does not check academic marks, course progression, cross-institution records, or resolve ambiguous names. |
| Anomaly model | TRAINING PIPELINE ONLY | Isolation Forest trainer and optional inference exist. No approved dataset, trained artifact, validation result, or performance claim is included. |
| Database and migrations | IMPLEMENTED IN CODE | PostgreSQL schema and migrations are present; no live database migration or deployment was run in this environment. |
| Authentication and RBAC | PARTIAL | Password login, HTTP-only session cookie, role scopes, and rate limits exist. MFA, password reset, student onboarding, and security review remain. |
| University/NAD/DigiLocker source verification | NOT CONFIGURED | No official approved API contract or credentials were supplied. No provider endpoints are invented. |
| VC signing and verification | PARTIAL | ES256 signing uses one configured issuer key. DID resolution, per-institution KMS/HSM custody, key rotation, and independent conformance validation remain. |
| Credential lifecycle/versioning | PARTIAL | Issuance, expiry, revocation, replacement links, and superseded status are stored. A minted predecessor must be chain-revoked before a replacement; automated expiry jobs and broader multi-version administration remain. |
| NFT/blockchain provenance | IMPLEMENTED IN CODE, NOT DEPLOYED | Mint, revoke, receipt verification, and resolver paths exist. Contract deployment, issuer-role setup, production RPC credentials, and live chain smoke checks remain. |
| IPFS | OPTIONAL INTEGRATION | Pinata V3 adapter is implemented and disabled by default. A scoped JWT and upload confirmation are required for a live upload. |
| QR/public/company verification | IMPLEMENTED IN CODE | Resolver and company verification use API records. Company verification currently uses exact-file hash plus deterministic evidence; AI comparison is explicitly `NOT_RUN`. |
| Audit history and Trust UI | PARTIAL | Core writes audit rows and Trust persists verification evidence. Append-only database enforcement and a fully connected Trust Passport/analytics experience remain. |
| Local runtime | VERIFIED | Local PostgreSQL databases and migrations, both APIs, AI health, both frontends, Core admin login, and authenticated admin overview were smoke-checked. Docker deployment, production configuration, live official source providers, OCR, and live blockchain were not tested. |

## External configuration needed

Live NAD/DigiLocker checks require an official integration agreement, API specification, and issued credentials. Live blockchain mint/revoke requires a deployed contract, authorized issuer wallet, funded gas account, and configured RPC. Pinata requires a scoped JWT. These are external deployment inputs; code paths fail closed or report unavailable when they are absent.

## Verification

See the root README for local commands. Backend compilation, Prisma schema validation/client generation, frontend lint/build, and automated unit suites are run as part of the current implementation handoff; no live external services are implied by those checks.
