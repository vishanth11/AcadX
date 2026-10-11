# ACADSHIELD X — PRIORITIZED REMEDIATION & ENGINEERING ROADMAP

**Document Version:** 1.0.0  
**Target Architecture:** Production-Grade Digital Trust Infrastructure  
**Planning Horizon:** Sprint 1 through Sprint 8

---

## Roadmap Priority Framework
- **P0: Critical Correctness & Security Safeguards** (Blockers for High-Stakes Production)
- **P1: Essential End-to-End Operational Completeness** (Core Issuance & Verification Hardening)
- **P2: Enterprise Reliability & Performance Scalability** (Cloud Storage, Asynchronous Queues & Monitoring)
- **P3: Advanced Intelligence & Commercial Expansion** (AI Model Training, Official Government Gateways)

---

## Phase 1: Immediate Security & Hardening (Sprint 1–2) [P0]

### Task 1.1: Multi-Factor Authentication (MFA / WebAuthn) for Registrars & Admins
- **Rationale:** High-stakes academic credential issuance requires phishing-resistant authentication. Single-password credentials present unacceptable account takeover risk.
- **Affected Files:**
  - `acadshield-core/backend/src/server.ts`
  - `acadshield-core/backend/prisma/schema.prisma` (Add `mfaSecret`, `mfaEnabled`, `backupCodes` to `User`)
  - `acadshield-core/frontend/src/app/login/page.tsx`
- **Dependencies:** None.
- **Acceptance Criteria:**
  1. Administrative and University roles must enroll in TOTP (Google Authenticator / 1Password) before issuing credentials or approving institutions.
  2. Account takeover simulation verifies that a leaked password cannot bypass login without TOTP code.

### Task 1.2: Cryptographic Audit Log Chaining (Tamper-Resistant Ledger)
- **Rationale:** Existing PostgreSQL triggers enforce append-only constraints, but direct database administrator access could still manipulate tables.
- **Affected Files:**
  - `acadshield-core/backend/prisma/schema.prisma` (Add `previousHash`, `entryHash`, `signature` to `AuditLog`)
  - `acadshield-core/backend/src/audit-service.ts`
- **Dependencies:** None.
- **Acceptance Criteria:**
  1. Every new `AuditLog` row includes SHA-256 hash of `(previousHash + action + actorId + timestamp + details)`.
  2. Automated daily job verifies cryptographic continuity and alerts if any historical block has been altered.

### Task 1.3: Secrets Management & KMS Wallet Integration
- **Rationale:** Storing the institutional blockchain private key in an environment variable (`BLOCKCHAIN_ISSUER_PRIVATE_KEY`) risks key exposure during host or backup breaches.
- **Affected Files:**
  - `acadshield-core/backend/src/server.ts`
  - `acadshield-core/backend/src/credential-operations.ts`
- **Dependencies:** AWS KMS, GCP Cloud KMS, or HashiCorp Vault.
- **Acceptance Criteria:**
  1. Transaction signing delegates to an HSM / KMS remote signer (`Ethers.js` KMS Signer).
  2. No raw private keys are stored on the API server disk or in environment variables.

---

## Phase 2: End-to-End Operational Completeness (Sprint 3–4) [P1]

### Task 2.1: S3-Compatible Cloud Object Storage Migration
- **Rationale:** Storing uploaded academic PDFs on the local container filesystem prevents horizontal scaling across multiple API instances.
- **Affected Files:**
  - `acadshield-core/backend/src/storage/object-storage.ts`
  - `acadshield-core/backend/src/server.ts`
- **Dependencies:** AWS S3 / Cloudflare R2 / MinIO.
- **Acceptance Criteria:**
  1. Files are uploaded directly to private, server-side encrypted S3 buckets with random UUID keys.
  2. Multi-replica API instances can view and verify documents without shared NFS mounts.
  3. Pre-signed expiring download URLs (15-minute validity) are generated for authorized university and admin document inspection.

### Task 2.2: Live Polygon Amoy Testnet Deployment & Monitoring
- **Rationale:** Local Hardhat node validation is complete, but live testnet deployment must be verified against public network latency and gas fees.
- **Affected Files:**
  - `acadshield-core/contracts/hardhat.config.ts`
  - `acadshield-core/backend/.env`
- **Dependencies:** Funded Polygon Amoy testnet wallet (MATIC).
- **Acceptance Criteria:**
  1. `AcademicCredentialNFT.sol` deployed to Polygon Amoy (`chainId: 80002`).
  2. Automated end-to-end test mints credential, waits for 2 network confirmations, and verifies token URI and receipt on Polygonscan.

### Task 2.3: Asynchronous Background Job Processing (BullMQ / Redis)
- **Rationale:** Heavy operations (PDF rasterization, OCR, ClamAV antivirus, IPFS upload, blockchain settlement) currently block the HTTP request thread.
- **Affected Files:**
  - `acadshield-core/backend/src/queue/` (New directory)
  - `acadshield-core/backend/src/workers/issuance-worker.ts`
- **Dependencies:** Redis.
- **Acceptance Criteria:**
  1. Document upload immediately returns `HTTP 202 Accepted` with a tracking task ID.
  2. Background worker handles virus scanning, OCR, hashing, and database persistence with automatic retry and dead-letter queue.

---

## Phase 3: Enterprise Scalability & Verification Features (Sprint 5–6) [P2]

### Task 3.1: Student Trust Passport with W3C Verifiable Presentation (VP)
- **Rationale:** Students need the ability to bundle multiple verified credentials (e.g., Degree + Transcript + Internship Certificate) into a single verifiable presentation.
- **Affected Files:**
  - `acadshield-core/frontend/src/app/student/passport/page.tsx`
  - `acadshield-core/backend/src/routes/presentation-routes.ts`
- **Dependencies:** Task 1.1.
- **Acceptance Criteria:**
  1. Student selects multiple active credentials and generates a signed Verifiable Presentation (VP-JWT).
  2. Employer can scan a single QR code to verify all credentials in the bundle simultaneously.

### Task 3.2: Automated Expiration & Revocation Reconciliation Cron
- **Rationale:** While credential status changes during manual verification, automatic notification of expired or superseded credentials requires a scheduled reconciliation worker.
- **Affected Files:**
  - `acadshield-core/backend/src/jobs/expiration-reconciliation.ts`
- **Dependencies:** Task 2.3 (Redis / Scheduled Job Runner).
- **Acceptance Criteria:**
  1. Daily cron sweeps active credentials past `expiresAt` date and updates status to `EXPIRED`.
  2. Audit event `CREDENTIAL_EXPIRED_AUTOMATICALLY` is appended for each transition.

---

## Phase 4: Intelligence & Ecosystem Expansion (Sprint 7–8) [P3]

### Task 4.1: Certified AI Training Dataset & Anomaly Model Calibration
- **Rationale:** The Isolation Forest anomaly detector is code-complete but reports `NOT_CONFIGURED` due to lack of an institutional reference dataset.
- **Affected Files:**
  - `acadshield-trust/ai-service/dataset/`
  - `acadshield-trust/ai-service/app/ml/train_anomaly.py`
- **Dependencies:** Legal data-sharing agreements with accredited partner institutions.
- **Acceptance Criteria:**
  1. Ingest minimum 1,000 verified reference certificate feature vectors across varied university layouts.
  2. Calibrate Isolation Forest contamination hyperparameter to achieve <2% false-positive anomaly rate on held-out reference certificates.
  3. Package and sign model artifact (`anomaly.joblib`) with SHA-256 verification manifest.

### Task 4.2: Official API Setu (NAD / DigiLocker) Production Gateway
- **Rationale:** Replaces mock/unconfigured government providers with active national verification gateways.
- **Affected Files:**
  - `acadshield-core/backend/src/providers/source-provider.ts` (`DigiLockerProvider`, `NADProvider`)
- **Dependencies:** Institutional sandbox agreement with API Setu (Digital India Corporation).
- **Acceptance Criteria:**
  1. Complete mutual TLS (mTLS) and OAuth 2.0 client credential exchange with API Setu.
  2. Live student roll-number lookup queries return verified digital award XML/JSON from National Academic Depository.
