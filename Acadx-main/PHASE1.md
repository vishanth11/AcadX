# Phase 1 implementation handoff

Implemented on 2026-09-29. Scope: production/demo separation, API-key quota accounting, live account authorization, upload failure safety, and reproducible checks.

## Bugs fixed

### Frontend data and actions

All 27 routes that imported the seeded platform store now use the shared API-loading component. Registry documents, credentials, issuer institutions, verification records, audit events, and stored mint references come from explicitly selected database fields. The new read endpoints enforce the user's current role and institution. Credential lookup uses the exact requested ID and no longer substitutes the first sample credential.

Document detail/review and credential revocation use the existing mutation APIs. A failed mutation displays its error and never pretends a browser-only change succeeded. Requests carry the session cookie, disable caching, cancel on unmount, and render loading, empty, failure/retry, and unavailable states separately.

Student profiles, passports, consented sharing, candidate/employee records, analytics, billing/usage, security metrics, and self-service API-key management do not have implemented backing models/workflows. Their former sample displays now load an explicit unavailable response from the capabilities API. No Phase 2/3 implementations were added. Existing working upload, issuance, verification, public resolver, registration, and administration flows remain.

Mock fixture modules and simulation components are gated by BOTH `NODE_ENV=development` and `NEXT_PUBLIC_ENABLE_DEMO=true`. Production routes do not import them, and setting the flag in a production build cannot enable them. Role types have moved out of the fixture module. Obsolete demo banners and fictional organization/student identities have been removed from active layouts.

### Trust quota

Authentication performs credential, scope, and live company-status validation without incrementing quota. History reads never charge. Missing/invalid IDs, missing files, unsupported file signatures, expired keys, and unavailable configuration cannot consume a verification unit.

After validation, a single PostgreSQL UPDATE atomically resets the UTC daily counter if necessary and reserves one unit before Core verification. Its predicate checks the current quota, key status, and expiry under the database row lock. Concurrent requests cannot independently read and overwrite a daily reset. A failed reservation stops the Core verification call.

Quota counts valid verification attempts once dispatched, including an attempt whose downstream verification later reports source unavailability. This is an explicit operational policy; no billing/refund system was added.

### Suspension

Core verifies the JWT issuer/algorithm and reloads the user and institution/company on every protected request. It rejects suspended, disabled, missing, or role-changed users and inactive organizations. Tenant scope comes from the live user row rather than stale token claims. Login also rejects an inactive organization.

Trust company sessions are checked through Core's new `GET /api/v1/auth/session`. Trust API keys also check the current company through the service-authenticated `GET /api/v1/internal/companies/:companyId/status`. Suspended accounts therefore lose subsequent access without waiting for JWT expiry. Core outages fail closed; Trust returns an authorization-availability error instead of trusting stale state.

Deploy Core before Trust, because the latter now requires these live status endpoints. Keep `PROJECT_A_API_URL` pointing to Core's `/api/v1` base and `PROJECT_A_INTERNAL_API_KEY` matching Core's `INTERNAL_SERVICE_API_KEY`.

### Upload safety

File ownership is tracked immediately after exclusive creation, including partial-write failures. After a later error, the handler checks whether the document row actually committed. Confirmed unreferenced files are removed. A committed file is retained, including when only audit recording failed. If database state is unavailable or commit outcome is uncertain, cleanup is deferred rather than deleting potentially committed evidence.

Optional AI failures retain a database-owned `REVIEW_REQUIRED` document with unavailable analysis evidence. They no longer present any orphan-cleanup ambiguity.

The reconciliation command finds UUID-named unreferenced files older than 24 hours and stale `PROCESSING` rows. It skips recent files, registered files, symlinks, unexpected filenames, and paths outside the configured root. Default behavior is a dry run. Apply mode deletes only eligible orphan files and conditionally marks still-stale processing rows `FAILED`; it does not delete their records or referenced files.

### Reproducibility

The root runner installs each leaf package from its own lockfile with `npm ci --workspaces=false`, avoiding the nested-workspace dependency ambiguity that left Hardhat missing and the Next ESLint parser unable to resolve its peer package. Both Prisma clients are generated in their respective packages.

The test runner works across Windows/Linux, uses the AI virtual environment (or an explicit Python executable), runs suites independently, summarizes results, and returns nonzero if any suite fails. It no longer stops after the first failure or uses Windows-only `cd /d`.

CI has independent Core, Trust, Core frontend, Trust frontend, contracts, and AI jobs. Python's tested baseline is recorded in `requirements-lock.txt`; optional OCR dependencies remain separate.

## Files changed

Paths below are relative to the application directory containing this document, except the CI workflow, which is at the parent Git root.

| Area | Files |
| --- | --- |
| Core authorization and uploads | `acadshield-core/backend/src/server.ts` |
| Scoped frontend read APIs | `acadshield-core/backend/src/registry-routes.ts` |
| Upload reconciliation | `acadshield-core/backend/src/reconcile-uploads.ts`, backend `package.json` |
| Core tests | `src/session.test.ts`, `src/upload-safety.test.ts`, `src/registry-routes.test.ts`, updated `src/server.test.ts` under the Core backend |
| Trust authorization/quota | `acadshield-trust/backend/src/server.ts`, `src/quota.test.ts` |
| Shared frontend API view | `acadshield-core/frontend/src/components/RegistryPage.tsx` |
| Frontend types and demo gates | `src/lib/roles.ts`, `demo-mode.ts`, `mock-platform-data.ts`, `platform-state.ts`, `credentials-data.ts` |
| Frontend components/layouts | `EnterpriseNavbar.tsx`, `UnavailableFeaturePage.tsx`, `IssuerSimulationModal.tsx`, `TrustPassportSection.tsx`, `VerificationDrawer.tsx`; root, admin, and student layouts |
| Frontend tests/setup | `acadshield-core/frontend/tests/registry.test.cjs`, `package.json`, `package-lock.json`, `.env.example` |
| Root workflow | `package.json`, `scripts/checks.cjs`, `scripts/ai-test.cjs`, `scripts/checks.test.cjs`, `README.md`, this document |
| CI | `../.github/workflows/phase1.yml` |
| AI baseline | `acadshield-trust/ai-service/requirements-lock.txt` |

Replaced Core frontend pages, under `src/app`:

- Admin: `analytics`, `credentials`, `documents`, `employees`, `hashes`, `issuers`, `nfts`, `security`, `students`, `verifications`.
- Company: `api`, `usage`.
- Public: `p/[publicId]`.
- Student: index, `credentials`, `credentials/[id]`, `documents`, `identity`, `passport`, `share`.
- University: `analytics`, `audit`, `blockchain`, `credentials/[id]`, `documents/[id]`, `documents/[id]/analysis`, `documents/[id]/revoke`, `nfts`, `students`, `students/[id]`.

No Solidity behavior, database schema, production database rows, or AI decision logic was intentionally changed. Existing PostgreSQL runtime-file changes and the earlier audit report were preserved.

## Focused tests added

- Core sessions: successful login; suspension after login; inactive organization login denial; live tenant scope; database outage fails closed.
- Trust: malformed request, unsupported file, free read with exhausted quota, one charge before successful verification, expired key, exhausted quota, unconfigured verifier, suspended company API key, Core status outage, and suspension after a successful company-session read.
- Uploads: confirmed DB failure cleanup; AI failure with a registered review document; committed row plus audit failure; uncertain commit deferred; dry-run/apply reconciliation, recent-file protection, referenced-file protection, and stale-row transition.
- Registry: university isolation, omitted private storage paths, denial of admin-only reads, exact credential ID with no sample fallback.
- Frontend: loading, empty, actual API record display, session credentials/no-store, revoked-session error/retry, unavailable features, unknown IDs, failed revocation, production-route fixture-import guard, and production-safe demo flag.
- Workflow: suites still execute after an earlier failure; a missing Python setup returns a clear setup error.

Core/Trust tests mock database and downstream providers. Upload tests use fresh temporary directories. Contract tests run on Hardhat's ephemeral local chain. No tests mutate the application's existing credential or user records.

## Setup and commands

Local verification completed: `npm test` passed all 62 tests (Core 24, Trust 12, frontend 8, contracts 3, AI 13, workflow 2). The full `npm run check` also passed both backend builds, Core lint/component tests/production build, the Trust frontend build, contract tests, and AI tests. The subsequently added workflow tests passed separately and in the final root test run. Final frontend lint/type checking and `git diff --check` passed.

Run from the application directory `Acadx-main` (the inner directory containing the root `package.json`). CI uses Node 22 and Python 3.12; this checkout was verified with Node 24.13.0, npm 11.6.2, and Python 3.12. PostgreSQL is needed to run the application, but the unit suites do not require a live database.

Stop development servers before reinstalling dependencies; Windows can lock the Next.js native compiler while a server is running.

```sh
npm run setup:node
```

This installs all five leaf Node packages, including contracts, and generates both Prisma clients. The first Hardhat compile needs network access to download Solidity 0.8.24 and access to its local compiler cache. No chain account or private key is needed for tests.

Windows Python setup:

```powershell
py -3.12 -m venv acadshield-trust/ai-service/.venv
acadshield-trust/ai-service/.venv/Scripts/python.exe -m pip install -r acadshield-trust/ai-service/requirements.txt -c acadshield-trust/ai-service/requirements-lock.txt
```

Linux/macOS Python setup:

```sh
python3.12 -m venv acadshield-trust/ai-service/.venv
acadshield-trust/ai-service/.venv/bin/python -m pip install -r acadshield-trust/ai-service/requirements.txt -c acadshield-trust/ai-service/requirements-lock.txt
```

Alternatively set `ACADSHIELD_PYTHON` to an absolute executable path with these dependencies installed. In this checkout a local virtual environment has already been created from the available bundled Python runtime.

All tests and all checks:

```sh
npm test
npm run check
```

Independent commands:

```sh
npm run check:core
npm run check:trust
npm run check:frontend
npm run check:trust-frontend
npm run test:contracts
npm run test:ai
npm run test:workflow
```

Each backend check compiles and runs its unit tests. The Core frontend check runs lint, component tests, and the production build. The Trust frontend check builds its current service-status page. Contract tests compile automatically. To compile contracts alone:

```sh
npm --prefix acadshield-core/contracts run compile
```

For local development, configure backend `.env` files from each service's environment template, configure Core frontend `.env.local` from its template, and use the existing development commands. Core frontend and backend must share `JWT_SECRET`; Trust must use Core's session signing secret and service connection settings. Never put signing secrets in `NEXT_PUBLIC_*` variables.

```sh
npm run core:dev
npm run trust:dev
npm --prefix acadshield-core/frontend run dev
npm --prefix acadshield-trust/frontend run dev
```

Run the AI service with its virtual environment:

```powershell
# From acadshield-trust/ai-service on Windows
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

```sh
# From acadshield-trust/ai-service on Linux/macOS
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

For a newly configured database, run the existing migrations explicitly; the tests do not deploy them:

```sh
npm --prefix acadshield-core/backend run prisma:deploy
npm --prefix acadshield-trust/backend run prisma:deploy
```

Reconciliation, against the configured Core database/storage:

```sh
# Preview only
npm --prefix acadshield-core/backend run uploads:reconcile
# Apply the eligible cleanup shown by the preview
npm --prefix acadshield-core/backend run uploads:reconcile -- --apply
```

Schedule reconciliation in the deployment environment, for example daily. Use the same `DOCUMENT_STORAGE_DIR` and `DATABASE_URL` as the API, stop exceptionally long-running imports before applying cleanup, and do not change the storage mount during a reconciliation run. No cleanup was applied to existing uploads during this implementation.

## Remaining risks and verification limits

- The scoped Phase 1 fixes do not make every product feature available. Unsupported screens explicitly report unavailable capability; they no longer show sample evidence.
- npm reported existing dependency advisories, including a critical advisory in the Core frontend dependency tree and high advisories in the contract development tree. Versions were not broadly upgraded as part of these five fixes. Review and patch dependencies before an internet-facing production release.
- The quota SQL is atomic by construction, but the focused quota tests mock the PostgreSQL result. Run concurrency and UTC-day-boundary integration tests against a disposable PostgreSQL instance before production rollout.
- Suspension affects subsequent requests. A request already authorized and in flight can still finish. Trust authorization now depends on Core availability; an outage intentionally denies access.
- Backend unit tests mock persistence. Actual database integration, deployment/restore, and end-to-end issuer workflows need a separate environment. GitHub Actions was added but has not been run remotely during this local task.
- Registry read pages expose at most 100 recent rows and say so. Cursor pagination, advanced analytics, and student/candidate models remain outside this phase.
- If a file/database commit outcome cannot be established, cleanup waits for reconciliation. Operators must schedule that command. Files are still on local storage; object storage, encryption, malware scanning, and retention policy remain separate work.
- AI remains evidence-only; optional OCR/model artifacts and external NAD/DigiLocker, IPFS, and live blockchain checks were not enabled. AI tests emit a Starlette/httpx deprecation warning; one elevated run also reported a non-fatal pytest cache-permission warning.
- Python constraints record the tested Windows/Python 3.12 baseline. The Linux CI job is supplied to validate platform-specific wheels and optional dependencies; it has not yet executed remotely.
