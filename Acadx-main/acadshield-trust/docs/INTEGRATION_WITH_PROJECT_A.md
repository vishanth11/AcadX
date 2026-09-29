# INTEGRATION SPECIFICATION: PROJECT B -> PROJECT A

Project B (*AcadShield Trust*) integrates with Project A (*AcadShield Core*) exclusively via documented REST APIs.

---

## 1. Authentication
Project B uses a secret service API key provided in the `X-API-Key` header:
```http
X-API-Key: acad_sec_dev_projb_trust_engine_key_99812450
```

---

## 2. Machine Verification Endpoint
### `POST /api/v1/internal/verify-credential`

#### Request Payload
```json
{
  "credentialId": "cred_valid_degree_001",
  "expectedDocumentHash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
}
```

#### Success Response
```json
{
  "success": true,
  "credential": {
    "id": "cred_valid_degree_001",
    "type": "DEGREE",
    "status": "ACTIVE",
    "issuer": {
      "id": "inst_mit_001",
      "name": "Massachusetts Institute of Technology",
      "verified": true
    },
    "holder": {
      "did": "did:acadshield:student:stu_001"
    },
    "issuedAt": "2026-05-20T10:00:00Z",
    "expiresAt": null
  },
  "verification": {
    "credentialExists": true,
    "issuerVerified": true,
    "signatureValid": true,
    "blockchainVerified": true,
    "hashValid": true,
    "revoked": false
  },
  "blockchain": {
    "network": "polygon-amoy",
    "transactionHash": "0x4b78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fa"
  }
}
```

---

## 3. Switching Between Mock and Live Mode
In `.env` or container environment:
```env
# Standalone offline development
CREDENTIAL_PROVIDER=mock

# Live integration with Project A
CREDENTIAL_PROVIDER=project_a
PROJECT_A_API_URL=http://localhost:4000/api/v1
PROJECT_A_INTERNAL_API_KEY=acad_sec_dev_projb_trust_engine_key_99812450
```
