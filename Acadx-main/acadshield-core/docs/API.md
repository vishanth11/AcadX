# Core API

Base URL: `http://localhost:4000/api/v1`. Browser sessions use the HTTP-only `acadshield_session` cookie. Service calls use `X-API-Key`.

| Method | Path | Access | Behavior |
|---|---|---|---|
| GET | `/health` | Public | Process liveness. |
| GET | `/ready` | Public | PostgreSQL readiness. |
| GET | `/admin/overview` | Admin | Counts institutions, companies, documents, credentials, and verification decisions from PostgreSQL. |
| GET | `/admin/blockchain` | Admin | Lists stored mint receipts and checks chain evidence when the chain configuration is available. |
| GET | `/admin/audit` | Admin | Lists up to 200 database audit rows; reports that tamper-proof storage is not configured. |
| GET | `/admin/institutions` | Admin | Lists registered institutions and related user/document/credential counts. |
| GET | `/admin/companies` | Admin | Lists registered companies and related verification counts. |
| POST | `/auth/login` | Public, rate limited | Verifies account/password and sets a 15-minute session cookie. |
| POST | `/auth/logout` | Public | Clears the session cookie. |
| POST | `/institutions/register` | Public, rate limited | Submits an institution application and creates its university administrator as `PENDING`; an admin must activate it before sign-in. Requires `name`, `code`, `adminEmail`, and `initialPassword` (at least 16 characters); `country` and `website` are optional. |
| POST | `/admin/institutions` | Admin | Creates a pending institution and university administrator. |
| POST | `/admin/institutions/{id}/activate` | Admin | Activates an institution and pending users. |
| POST | `/admin/companies` | Admin | Creates a pending company and company administrator. |
| POST | `/admin/companies/{id}/activate` | Admin | Activates a company and pending users. |
| GET | `/templates` | Owning university | Lists the institution's template versions. |
| POST | `/templates` | Owning university | Creates a template with expected field keys and optional min/max page count. At most one version per type is active. |
| POST | `/templates/{id}/activate` | Owning university | Activates an owned version and deactivates the other active version for that type. |
| POST | `/documents` | University, rate limited | Multipart `file`, `documentType`, optional `holderReference`; stores privately, hashes exact bytes, and requests evidence analysis using a matching active template when configured. |
| GET | `/documents` | Owning university | Lists that institution's source records. |
| GET | `/documents/{id}` | Owning university or admin | Returns metadata and analysis evidence, not file bytes. |
| POST | `/documents/{id}/review` | Owning university | Approves or rejects a source record with a required review note. |
| POST | `/documents/{id}/cross-check` | Owning university | Compares OCR identity candidates across the same institution and holder reference; discrepancies require human review. |
| GET | `/credentials` | Owning university | Lists credentials and chain receipts. |
| POST | `/credentials` | University | Signs a VC-JWT for the configured issuer and an approved source document. Optional `supersedesId` links a replacement to a prior credential; minted predecessors must first be revoked on-chain. |
| POST | `/credentials/{id}/mint` | Owning university | Explicit mint action; waits for chain confirmation and stores the event-derived token ID and receipt. |
| POST | `/credentials/{id}/revoke` | Owning university | Confirms chain revocation first for a minted credential, then updates registry status. |
| GET | `/credentials/{id}/qr` | Owning university | Generates a QR data URL for the public resolver. |
| POST | `/company/verifications` | Active company | Hashes submitted bytes, compares the registered source hash, verifies signature and chain evidence, and stores the result. |
| GET | `/company/verifications` | Active company | Lists recent history for the signed-in company. |
| GET | `/company/verifications/{id}` | Active company | Returns evidence only for a record belonging to that company. |
| GET | `/verify/{id}` | Public | Returns lifecycle, issuer signature, source registry, and any chain evidence without holder personal data. |
| POST | `/internal/verify-credential` | Trust service key | Requires credential ID and exact 64-character document SHA-256; stores deterministic evidence. |

Configure exact browser origins with `CORS_ORIGIN`. Never put secrets in `NEXT_PUBLIC_*` variables.

## Document analysis

Core stores original upload bytes on private local storage and calculates SHA-256 over those exact bytes. When configured, the AI service reports OCR, heuristic classification and field candidates, layout counts, PDF metadata, raster image measurements, optional model signals, and template-rule results. These signals do not authenticate an issuer or override cryptographic checks. Uploads stay in `REVIEW_REQUIRED` until an authorized university reviewer approves them.

Cross-document comparison only uses OCR-derived `studentName`, `registerNumber`, and `dateOfBirth` candidates for the same holder reference within one institution. It never labels a person or document fraudulent. A difference or insufficient data requires review.

Original uploads remain on private local storage. Malware scanning, encryption at rest, object storage, and retention controls still need deployment work.

## Credentials, chain, and IPFS

VC-JWT issuance and NFT minting are separate actions. Minting needs `BLOCKCHAIN_RPC_URL`, `CHAIN_ID`, `CREDENTIAL_CONTRACT_ADDRESS`, `BLOCKCHAIN_ISSUER_PRIVATE_KEY`, `BLOCKCHAIN_RECIPIENT_ADDRESS`, and `VERIFY_BASE_URL`; authorize the issuer wallet on the deployed contract and fund gas. Missing or inconsistent chain evidence is reported as unavailable or mismatch.

Optional Pinata V3 metadata upload uses `IPFS_STORAGE_MODE=pinata` and a scoped `IPFS_JWT`. It uploads only a public manifest without holder fields or the original file. When disabled, chain metadata uses the public resolver URL. See [Pinata Upload a File](https://docs.pinata.cloud/api-reference/endpoint/upload-a-file).

One configured issuer key is supported. Production multi-institution deployments need separate KMS/HSM custody, DID resolution, key rotation, and recovery procedures.
