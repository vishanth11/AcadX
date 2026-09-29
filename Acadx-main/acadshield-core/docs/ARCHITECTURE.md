# ACADSHIELD CORE — ARCHITECTURAL SPECIFICATION

## System Invariants
1. **Zero Fake Trust Scores**: AcadShield Core does not generate heuristic or speculative fraud scores. It reports exact, deterministic verification states:
   - `VERIFIED`
   - `REVOKED`
   - `EXPIRED`
   - `INVALID`
   - `ISSUER_NOT_VERIFIED`
   - `NOT_FOUND`
   - `HASH_MISMATCH`
   - `BLOCKCHAIN_MISMATCH`
2. **Blockchain Transaction Confirmation Rule**: A credential record in PostgreSQL cannot transition from `ISSUED` to `ACTIVE` unless the associated on-chain transaction receipt is returned with status `1` (Success). If a transaction reverts or fails, the database status records the failure reason and reverts the credential to `DRAFT` or `FAILED`.
3. **Decentralized Identifiers (DID)**:
   - Student: `did:acadshield:student:<uuid>`
   - Institution: `did:acadshield:institution:<uuid>`
   - Issuer: `did:acadshield:issuer:<uuid>`
4. **Append-Only Audit Trail**: Every security, identity, status transition, or verification event generates an immutable record in the `AuditLog` table. Records cannot be updated or deleted.

---

## Component Interaction Flow

```mermaid
sequenceDiagram
    autonumber
    actor Issuer as Authorized Issuer
    participant API as AcadShield Core API
    participant IPFS as IPFS / Pinata Storage
    participant DB as PostgreSQL
    participant Chain as Polygon Amoy Contract

    Issuer->>API: POST /api/v1/credentials (Metadata + File)
    API->>API: Compute SHA-256 & Keccak-256 of canonical document
    API->>IPFS: Upload document & W3C JSON-LD metadata
    IPFS-->>API: Return ipfsDocumentCid & ipfsMetadataCid
    API->>DB: Save Credential (Status: DRAFT)
    
    Issuer->>API: POST /api/v1/credentials/:id/issue
    API->>API: Check: Issuer has ISSUER_ROLE & Institution is VERIFIED
    API->>Chain: mintCredential(holder, credId, instId, docHash, ipfsMetadataCid)
    Chain-->>API: Return Transaction Hash (Status: PENDING)
    API->>DB: Log BlockchainTransaction (PENDING), Update Credential (ISSUED)
    
    API->>Chain: Wait for transaction confirmation
    Chain-->>API: Receipt confirmed (Token ID minted)
    API->>DB: Update BlockchainTransaction (CONFIRMED)
    API->>DB: Update Credential (ACTIVE, tokenId, issueDate)
    API->>API: Generate QR Code Verification URL
    API-->>Issuer: 200 OK (Credential ACTIVE + QR Code)
```
