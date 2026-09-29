# ACADSHIELD X — engineering audit report

Audit date: 2026-09-29
Scope: `acadshield-core`, `acadshield-trust`, Solidity contracts, Python AI service, frontend, persistence, security, deployment, tests, and documentation.

## Executive summary

ACADSHIELD has a credible prototype foundation: the Core and Trust Node/TypeScript backends compile, the deterministic verification decision logic is tested, uploads validate file signatures and exact SHA-256 bytes, role-scoped sessions exist, and the blockchain contract is designed to be non-transferable. The system is not yet production-ready for high-stakes academic credential decisions.

The largest risks are:

1. A substantial part of the Core frontend still reads seeded demo data from browser `localStorage`, so several screens can show stale or fictional institutions, students, credentials, hashes, audits, analytics, and passport data beside live API screens.
2. Trust API-key quota is consumed for read requests and even before malformed verification requests are rejected, making quota accounting incorrect and vulnerable to inexpensive quota exhaustion.
3. Account status is embedded in a 15-minute JWT but is not rechecked on protected requests; suspended accounts can retain access until token expiry.
4. File storage is local, unencrypted, not malware-scanned, and can leave orphaned files when database creation fails.
5. The AI service is evidence-only and heuristic; OCR, PDF visual forensics, trained models, source verification, and several advertised trust workflows are absent or unvalidated.
6. CI/reproducibility is incomplete: the root test command fails before contract and Python tests, the frontend build reports an ESLint parser error, and Docker/live integration paths were not verified.

Severity is assessed for a deployed system handling education records: Critical blocks production, High requires remediation before production, Medium is important operational debt, Low is polish or maintainability.

## Findings

### F-01 — Demo/localStorage screens are mixed with live product flows (Critical)

Evidence: `acadshield-core/frontend/src/lib/platform-state.ts:43-91` initializes `INITIAL_*` datasets and persists them to `localStorage`; the same store is used by pages including `admin/analytics`, `admin/credentials`, `admin/students`, `admin/hashes`, `admin/verifications`, `university/audit`, student pages, and `p/[publicId]`. The seed data is defined in `frontend/src/lib/mock-platform-data.ts:212-792`.

Impact: users can see records that do not exist in PostgreSQL and can mutate browser-only state. This creates a false operational picture and can lead an administrator or employer to act on fictional evidence. Browser storage is also editable by any user and is not an audit trail.

Fix: remove `usePlatformState` from production routes. Replace each page with typed API clients, server-side data loading where possible, explicit empty/loading/error states, pagination, and authorization-aware responses. Keep demo data only behind a development-only feature flag and separate demo hostname/build. Add an automated test that fails if protected production routes import `mock-platform-data`.

### F-02 — Trust API-key quota accounting is incorrect (High)

Evidence: `acadshield-trust/backend/src/server.ts:50-95` increments `usedToday` inside `authenticateCompany`. That function is called by both `POST /api/v1/verify/credential` and `GET /api/v1/verifications`; it runs before credential/file validation and before the downstream Core request.

Impact: a client can consume its daily quota with read requests, missing fields, invalid files, or requests that later fail. A low-quota customer can be denied service without a successful verification. Concurrent requests also rely on a read-then-update sequence for reset behavior, which should be made explicitly transactional.

Fix: separate authentication/scope validation from quota consumption. Consume quota only after request validation and immediately before the billable verification operation. Never charge `verification:read`. Use one atomic database update/transaction for reset-and-increment, return `Retry-After`, and add tests for malformed requests, reads, concurrent requests, expired keys, and quota boundaries.

### F-03 — Suspended users remain authorized until JWT expiry (High)

Evidence: Core `requireSession` at `acadshield-core/backend/src/server.ts:126-183` verifies token signature, role, and subject but does not load the current `User` record or check `User.status`. Trust `requestCompanyId` at `acadshield-trust/backend/src/server.ts:28-48` trusts the Core-issued company claims and also does not check live account status.

Impact: administrator suspension does not immediately revoke access. A compromised session remains usable for up to the 15-minute Core token lifetime, and Trust can accept that session independently.

Fix: perform a cheap active-user lookup/cache on every protected request, or use a revocation/session-version claim checked against the database. On suspension, increment a session version and clear active sessions. Trust should validate the session with Core or use a short-lived service assertion that includes status/version. Add tests for suspend-after-login and cross-service behavior.

### F-04 — Local document storage lacks production data-protection controls (High)

Evidence: Core stores upload bytes with `fs.writeFile` at `acadshield-core/backend/src/server.ts:574-576` under `DOCUMENT_STORAGE_DIR`; Trust keeps submitted files in memory. The implementation status explicitly records that encryption at rest, malware scanning, object storage, and retention controls are not configured.

Impact: a host compromise or backup leak exposes academic documents and personal information. In-memory multipart handling increases process memory pressure. There is no retention/deletion policy, legal hold, quarantine flow, or antivirus result attached to a document.

Fix: use private object storage with server-side encryption and per-object authorization, malware-scan/quarantine before analysis, stream uploads with hard limits, record scan status, define retention/deletion/legal-hold policy, and make backups encrypted. Never expose storage paths. Add operational monitoring for disk/memory pressure.

### F-05 — Upload/database failure can leave orphaned files (Medium)

Evidence: Core writes the file first (`server.ts:574-576`), then calls `prisma.academicDocument.create` (`server.ts:606-626`). The catch at `server.ts:628` forwards the error but does not delete the file. AI analysis can also fail or time out between those operations.

Impact: repeated failures, duplicate submissions, or database outages accumulate files that have no database owner and are not covered by normal retention or deletion tooling.

Fix: use an object-storage key with a pending record and a compensating delete, or create the database row first with `PROCESSING` and finalize it after durable upload. Add a reconciliation job that finds orphaned objects and stale `PROCESSING` rows. Use idempotency keys for upload/analysis retries.

### F-06 — Authentication and account lifecycle are incomplete (High)

Evidence: the implementation status marks authentication `PARTIAL`: no MFA, password reset, or student onboarding. Login is a password-only flow in `server.ts:335-369`; the cookie lifetime is 15 minutes. There is no visible password-change, account recovery, email verification, session management, or login audit event.

Impact: account takeover resistance and account recovery are insufficient for universities and employers. Short tokens reduce exposure but increase UX pressure and do not replace revocation or MFA.

Fix: add MFA/WebAuthn for administrators and issuers, verified email and recovery with one-time hashed tokens, password rotation and breach-password screening, active-session listing/revocation, login/logout/security-event auditing, and an explicit student identity/onboarding model. Keep cookie flags (`Secure`, `HttpOnly`, `SameSite`) and add a documented production proxy configuration.

### F-07 — Audit logs are database rows, not tamper-evident audit evidence (Medium)

Evidence: Core returns `tamperEvidence: "DATABASE_AUDIT_ROWS_ONLY"` in `server.ts:252-262`; the schema allows ordinary application writes to `AuditLog`. Trust stores verification evidence in ordinary rows.

Impact: a database administrator or compromised application credential can alter or delete history without detection. This is weak for accreditation, dispute resolution, and regulator-facing evidence.

Fix: make audit writes append-only through a restricted database role, add hash chaining or signed event envelopes, replicate to immutable/WORM storage, include request IDs, actor, source IP/device metadata, before/after summaries, and retention policy. Add verification tooling and alert on chain breaks.

### F-08 — AI output can be misunderstood despite safe decision separation (High)

Evidence: `acadshield-trust/ai-service/app/main.py:148-170,285-312` uses heuristic classification/regex extraction, returns `REVIEW_REQUIRED`, and marks source verification `NOT_CONFIGURED`; PDF visual forensics is `NOT_IMPLEMENTED` at `main.py:285`. `app/ml/inference.py:14-39` loads optional Joblib artifacts without a signed artifact manifest. The project status says there is no approved dataset, trained artifact, validation result, or performance claim.

Impact: OCR errors, formatting variation, language variation, and biased reference data can produce misleading signals. A future UI or consumer may incorrectly treat a risk signal as proof of fraud. Loading a tampered Joblib artifact can also execute unsafe deserialization code if the model path is writable or compromised.

Fix: keep deterministic verification as the only acceptance decision; show AI as “unvalidated review evidence” with provenance and confidence. Add institution-reviewed multilingual datasets, held-out evaluation, calibration, bias/error analysis, model/version lineage, signed artifacts, safe artifact permissions, and a model registry. Implement QR/barcode extraction, trained layout/visual checks, and source-provider integrations only with measurable tests.

### F-09 — AI service has resource-exhaustion and privacy gaps (Medium)

Evidence: upload bytes are read into memory at `main.py:271-273`; images are allowed up to 40 million pixels at `main.py:81,177`; PDFs are parsed in memory and page metadata is generated without an explicit page-count/time budget. OCR is optional and can be expensive.

Impact: many concurrent large images or pathological PDFs can consume CPU/RAM and block the service. Uploaded academic data is processed without an explicit retention, redaction, tenant isolation, or deletion policy.

Fix: stream to a bounded temporary file, enforce decompressed pixel/page/object limits, set parser and OCR timeouts, use worker isolation and concurrency limits, clean temporary files, redact logs, and document retention/processing location. Add adversarial PDF/image tests.

### F-10 — Blockchain integration is code-complete but not operationally proven (High)

Evidence: the contract and Core chain verification paths exist, but the status says deployment, issuer-role setup, funded gas, RPC credentials, and live smoke checks remain. The root `npm test` and contract `npm run compile` both fail because `hardhat` is unavailable in the checkout.

Impact: mint/revoke/resolver behavior is unverified against a real deployed contract. Network, role, receipt, reorg, RPC outage, and retry behavior can fail in production. A credential may be signed off-chain while minting is only partially completed.

Fix: install and lock the contract toolchain in CI, compile/test/coverage contracts, deploy to a disposable local chain in CI, run end-to-end mint/revoke/verify tests, persist chain ID/contract bytecode hash, handle confirmations/reorgs/idempotency, and use a KMS/HSM or signer service rather than long-lived private keys in environment variables. Add operational alerts for failed or stale mint jobs.

### F-11 — Root test/reproducibility workflow is broken (High)

Evidence: `npm test` passes the Core backend tests, then stops at `acadshield-core/contracts` with `'hardhat' is not recognized`. The Python test command cannot run because `python`/the documented `.venv` executable is unavailable. Frontend `next build` completes page generation but reports `ESLint: Failed to load parser ... next/dist/compiled/babel/eslint-parser`.

Impact: the repository’s stated verification command does not verify the complete system. A green-looking partial run can hide broken contracts, AI regressions, and lint issues.

Fix: make each package independently reproducible with documented install commands and CI jobs. Use `npm ci` in each package that owns a lockfile, install Hardhat dependencies, create/use a pinned Python environment, and run `npm run lint` separately from `next build`. Fix the Next dependency installation/lockfile mismatch and fail CI on lint errors. Publish a single supported matrix for Node, npm, Python, PostgreSQL, and Docker.

### F-12 — Trust frontend is largely a shell, not a connected employer product (High)

Evidence: `acadshield-trust/frontend` contains only a minimal app surface; Trust documentation states passport/graph screens are demo views and are not backed by consented candidate data. Core routes such as `company/candidates`, passport, graph, and reports intentionally render `UnavailableFeaturePage`.

Impact: the product narrative suggests candidate/passport/analytics functionality that is not deliverable. Users need clear workflow boundaries, consent, sharing, and employer tenancy before these features can be used.

Fix: prioritize a small connected employer workflow: upload/verify, decision explanation, verification history, exportable evidence report, and consented share link. Then design candidate passport/graph around explicit subject consent, expiry, scope, revocation, and data minimization. Do not ship seeded records in production builds.

### F-13 — Source verification and issuer trust are not production-grade (High)

Evidence: `configuredSourceProvider` can report unavailable/unconfigured; `.env.example` leaves NAD/DigiLocker credentials empty. VC signing uses one configured issuer key, while the status records that DID resolution, per-institution KMS/HSM custody, key rotation, and independent conformance validation remain.

Impact: a valid signature currently proves possession of the configured signing key, not necessarily a verified institution identity or current institutional authority. If the key leaks, issued credentials can be forged until rotation/revocation is implemented.

Fix: establish issuer onboarding and accreditation checks, DID/document resolution, per-issuer keys, KMS/HSM custody, rotation and revocation metadata, JWKS/key history, VC-JWT/JSON-LD conformance tests, and an authoritative source adapter with contract tests. Make issuer trust state and key version visible in verification evidence.

### F-14 — Credential lifecycle jobs and consistency are incomplete (Medium)

Evidence: the status says expiry jobs and broader multi-version administration remain. Expiration is evaluated during verification, but there is no scheduler/worker to transition records or notify owners. File upload, credential issuance, minting, and revocation span multiple systems and are not represented as a durable workflow state machine.

Impact: dashboards and reports can show stale `ACTIVE`/`DRAFT` data; retries can duplicate or strand issuance/mint requests; replacement and revocation disputes are harder to explain.

Fix: add an outbox/workflow table with idempotency keys, explicit states and retries, scheduled expiry/revocation reconciliation, notifications, and transaction/event correlation. Keep database status and chain status separately visible and never silently collapse “unknown” into “verified.”

### F-15 — API and data contract quality is inconsistent (Medium)

Evidence: Swagger dependencies are present in both backends but no route wiring was found; Trust `VerificationRecord.decision` is a free-form `String` in `backend/prisma/schema.prisma:34-46`; list endpoints hard-limit results to 100/200 with no cursor pagination. Several frontend pages duplicate fetch logic and response shapes.

Impact: clients can drift from server behavior, invalid decisions can enter the database, large tenants cannot reliably page/export, and API changes are harder to review.

Fix: publish OpenAPI from the actual route schemas, generate typed clients, use enums/check constraints for decision/status values, standardize error envelopes and request IDs, add cursor pagination/filter/sort, and contract-test Core–Trust integration.

### F-16 — Deployment configuration needs hardening and verification (Medium)

Evidence: Docker Compose uses host-facing URLs such as `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`, optional defaults for development integrations, and separate compose stacks. Backend Dockerfiles run database migrations as the container start command. Live Docker deployment was not tested.

Impact: browser-versus-container networking can be confusing outside localhost; startup migrations can race or make rollback difficult; optional values may produce a superficially healthy but non-functional stack.

Fix: separate dev/staging/prod compose or deployment manifests, use internal service DNS for server-side calls and a deliberate public browser API URL, add migration jobs/locks, startup/readiness probes, secret management, non-root containers, image scanning, pinned base-image digests, resource limits, and a deployment smoke test.

## Enhancements and product direction

### Near term (1–2 sprints)

- Make the Core frontend API-only and clearly label every unavailable feature.
- Fix quota charging, live account-status checks, orphan cleanup, and test failures.
- Add request IDs, structured logs, consistent errors, cursor pagination, and OpenAPI generation.
- Add end-to-end tests for registration → admin approval → upload → review → issue → verify → revoke.
- Add file quarantine/antivirus, encrypted object storage, retention policy, and backup/restore tests.

### Medium term (3–6 sprints)

- Build consented credential sharing: scoped, expiring links; recipient identity; revocation; access log; minimal disclosure.
- Add issuer onboarding, key lifecycle management, KMS/HSM signing, DID/JWKS resolution, and source-provider adapters.
- Implement reliable issuance/mint/revoke workflow with outbox events and chain reconciliation.
- Build a connected employer evidence report with deterministic evidence first and AI signals clearly separated.
- Add accessibility, localization, mobile upload resilience, resumable uploads, and clear user-facing explanations.

### Longer term

- Train and validate AI only from independently source-verified, consented, representative data; publish precision/recall, calibration, subgroup error rates, and drift monitoring.
- Add cross-institution academic consistency checks only with privacy-preserving identifiers and explicit legal/data-sharing agreements.
- Add immutable audit anchoring, regulator export packages, tenant-level data residency controls, and disaster recovery exercises.
- Add product analytics based on operational telemetry, not seeded UI data: verification latency, source availability, false-review rate, issuer onboarding time, and chain failure rate.

## Recommended delivery order

1. Block production release until F-01, F-02, F-03, F-04, F-10, and F-11 are resolved.
2. Complete a security/privacy review covering academic records, key custody, tenant isolation, retention, backup, and incident response.
3. Establish CI with independent Core, Trust, contract, AI, frontend, migration, and end-to-end jobs.
4. Ship one narrow, fully connected verification workflow before implementing passport/graph/analytics breadth.
5. Treat AI as an explainable review-assistance product until it has approved data, evaluation, and monitoring.

## Verification record for this audit

- Core backend TypeScript build: passed.
- Trust backend TypeScript build: passed.
- Core backend Jest suite: 3 suites, 13 tests passed.
- Frontend production build: generated pages, but reported an ESLint parser/module failure.
- Root `npm test`: failed at contract tests because `hardhat` was unavailable; Python tests were not reached.
- Contract compile: failed because `hardhat` was unavailable.
- Python AI tests: not run because the documented Python executable/virtual environment was unavailable.
- Live PostgreSQL, Docker, OCR, external source providers, IPFS, and blockchain deployments: not verified in this checkout.

This report distinguishes implemented code from declared prototype limitations; absence of a runtime integration test is reported as unverified, not assumed to be working.
