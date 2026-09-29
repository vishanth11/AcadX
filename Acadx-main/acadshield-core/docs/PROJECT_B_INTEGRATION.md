# PROJECT B (ACADSHIELD TRUST) INTEGRATION CONTRACT

Project B (*AcadShield Trust*) is the consumer intelligence and risk analysis layer of the AcadShield ecosystem. It must NOT access the AcadShield Core database directly. Instead, it must consume Project A through the dedicated service API documented below.

---

## 1. Authentication
Project B authenticates against AcadShield Core via a persistent Service API Key passed in the request header:
```http
X-API-Key: acad_sec_live_projb_trust_engine_key_99812450
```

---

## 2. Machine Verification Endpoint

### `POST /api/v1/internal/verify-credential`

#### Request Body
```json
{
  "credentialId": "cuid_948fha8dfy3",
  "expectedDocumentHash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
}
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "timestamp": "2026-09-24T18:10:00Z",
  "credential": {
    "id": "cred_cuid_948fha8dfy3",
    "opaqueId": "cuid_948fha8dfy3",
    "type": "DEGREE",
    "title": "Bachelor of Science in Computer Science",
    "status": "ACTIVE",
    "issuer": {
      "id": "inst_04a80ce6-e91b-4f74-8848-bb5dfb3e4f3a",
      "name": "Polygon Technical Institute",
      "officialDomain": "pti.edu",
      "verified": true,
      "verificationStatus": "VERIFIED"
    },
    "holder": {
      "did": "did:acadshield:student:stu_2026_0981",
      "studentNumber": "CS-2022-892"
    },
    "issuedAt": "2026-06-15T10:00:00Z",
    "expiresAt": null
  },
  "integrity": {
    "documentHash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "hashAlgorithm": "SHA-256",
    "ipfsMetadataCid": "QmZtmD2qt8STT4nUMewGhGxsrfafHGVTJ6GFiopjgEdFNr",
    "ipfsDocumentCid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
  },
  "verification": {
    "status": "VERIFIED",
    "credentialExists": true,
    "issuerVerified": true,
    "signatureValid": true,
    "blockchainVerified": true,
    "hashValid": true,
    "revoked": false,
    "expired": false
  },
  "blockchain": {
    "network": "polygon-amoy",
    "chainId": 80002,
    "contractAddress": "0x3Fa890B9772B5620803513360bA082b2EbC7338A",
    "tokenId": "42",
    "transactionHash": "0x4b78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fa",
    "blockNumber": 1284920
  }
}
```

---

## 3. Public Verification Endpoints (No Auth Required)
- `GET /api/v1/public/credentials/:id`
- `GET /api/v1/public/issuers/:id`
- `GET /api/v1/public/institutions/:id`
