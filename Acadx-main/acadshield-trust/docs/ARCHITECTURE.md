# ACADSHIELD TRUST (PROJECT B) — ARCHITECTURAL SPECIFICATION

## System Invariants & Core Tenets

1. **AI is Auxiliary, Cryptography is Definitive:**
   - Cryptographic verification proves: signature validity, document hash integrity, issuer authorization, and blockchain state.
   - AI anomaly detection never rules a credential "fake" or "fraudulent". It flags patterns as `LOW`, `REVIEW`, or `HIGH_ATTENTION` with human-readable explanations.
2. **Provider Pattern Decoupling:**
   - All credential verification requests flow through `ICredentialProvider`.
   - `MockCredentialProvider` operates offline with zero external network dependencies.
   - `ProjectACredentialProvider` communicates with Project A over HTTP with `X-API-Key` service authentication.
3. **Graceful Degradation:**
   - If AI service fails or times out: verification status returns `VERIFIED` with `risk.level = "UNAVAILABLE"`.
   - If Project A fails or times out: verification status returns `SOURCE_UNAVAILABLE`.
4. **Relational Trust Graph:**
   - Graph entities (`trust_nodes`) and edges (`trust_relationships`) preserve evidence references (credential ID, blockchain transaction hash, verification timestamp).
5. **Usage Metering & Rate Limiting:**
   - Every enterprise API request is metered against the client's subscription plan quota.
