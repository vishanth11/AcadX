export interface CredentialRecord {
  id: string;
  opaqueId: string;
  type: string;
  title: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED" | "ISSUER_UNVERIFIED" | "HASH_MISMATCH";
  issuer: {
    id: string;
    name: string;
    domain: string;
    country: string;
    verified: boolean;
    verificationStatus: "VERIFIED" | "PENDING" | "REJECTED";
  };
  holder: {
    name: string;
    did: string;
    studentNumber: string;
  };
  dates: {
    issued: string;
    expires: string | null;
    revokedOn?: string;
    revocationReason?: string;
  };
  integrity: {
    documentHash: string;
    computedHash: string;
    hashAlgorithm: "SHA-256";
    ipfsMetadataCid: string;
    ipfsDocumentCid: string;
  };
  blockchain: {
    network: string;
    chainId: number;
    contractAddress: string;
    tokenId: string;
    transactionHash: string;
    blockNumber: number;
    confirmed: boolean;
  };
  w3cPayload: Record<string, any>;
}

export const SAMPLE_CREDENTIALS: Record<string, CredentialRecord> = {
  "cred_valid_degree_001": {
    id: "cred_valid_degree_001",
    opaqueId: "cuid_mit_cs_8921",
    type: "DEGREE",
    title: "Bachelor of Science in Computer Science",
    status: "ACTIVE",
    issuer: {
      id: "inst_mit_001",
      name: "Massachusetts Institute of Technology",
      domain: "mit.edu",
      country: "United States",
      verified: true,
      verificationStatus: "VERIFIED",
    },
    holder: {
      name: "Alex Vance",
      did: "did:acadshield:student:stu_2026_0981",
      studentNumber: "MIT-CS-2022-892",
    },
    dates: {
      issued: "2026-05-20T10:00:00Z",
      expires: null,
    },
    integrity: {
      documentHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      computedHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      hashAlgorithm: "SHA-256",
      ipfsMetadataCid: "QmZtmD2qt8STT4nUMewGhGxsrfafHGVTJ6GFiopjgEdFNr",
      ipfsDocumentCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    },
    blockchain: {
      network: "Polygon Amoy Testnet",
      chainId: 80002,
      contractAddress: "0x3Fa890B9772B5620803513360bA082b2EbC7338A",
      tokenId: "101",
      transactionHash: "0x4b78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fa",
      blockNumber: 1284920,
      confirmed: true,
    },
    w3cPayload: {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://schema.acadshield.io/v1/academic"
      ],
      "id": "urn:uuid:cred_valid_degree_001",
      "type": ["VerifiableCredential", "AcademicDegreeCredential"],
      "issuer": "did:acadshield:institution:inst_mit_001",
      "issuanceDate": "2026-05-20T10:00:00Z",
      "credentialSubject": {
        "id": "did:acadshield:student:stu_2026_0981",
        "degreeName": "Bachelor of Science in Computer Science",
        "major": "Computer Science & Artificial Intelligence",
        "honors": "Summa Cum Laude",
        "gpa": "3.96"
      },
      "proof": {
        "type": "EcdsaSecp256k1RecoverySignature2020",
        "created": "2026-05-20T10:00:00Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:acadshield:institution:inst_mit_001#key-1"
      }
    }
  },
  "cred_revoked_diploma_002": {
    id: "cred_revoked_diploma_002",
    opaqueId: "cuid_poly_cyber_441",
    type: "DIPLOMA",
    title: "Diploma in Advanced Cybersecurity",
    status: "REVOKED",
    issuer: {
      id: "inst_poly_002",
      name: "National Polytechnic Institute",
      domain: "polytechnic.edu",
      country: "United Kingdom",
      verified: true,
      verificationStatus: "VERIFIED",
    },
    holder: {
      name: "David Miller",
      did: "did:acadshield:student:stu_2025_4812",
      studentNumber: "NPI-SEC-441",
    },
    dates: {
      issued: "2025-01-10T00:00:00Z",
      expires: null,
      revokedOn: "2025-08-14T14:30:00Z",
      revocationReason: "Administrative revocation following academic integrity review committee decision.",
    },
    integrity: {
      documentHash: "0x1111b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      computedHash: "0x1111b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      hashAlgorithm: "SHA-256",
      ipfsMetadataCid: "QmMockRevokedCid",
      ipfsDocumentCid: "QmMockDocCid",
    },
    blockchain: {
      network: "Polygon Amoy Testnet",
      chainId: 80002,
      contractAddress: "0x3Fa890B9772B5620803513360bA082b2EbC7338A",
      tokenId: "102",
      transactionHash: "0x5c78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fb",
      blockNumber: 1285000,
      confirmed: true,
    },
    w3cPayload: {
      "status": "REVOKED",
      "revocationReason": "Academic integrity non-compliance"
    }
  },
  "cred_expired_cert_003": {
    id: "cred_expired_cert_003",
    opaqueId: "cuid_gci_cloud_902",
    type: "PROFESSIONAL_CERTIFICATION",
    title: "Cloud Solutions Architect — Professional",
    status: "EXPIRED",
    issuer: {
      id: "inst_aws_003",
      name: "Global Cloud Institute",
      domain: "gci.org",
      country: "Global",
      verified: true,
      verificationStatus: "VERIFIED",
    },
    holder: {
      name: "Sarah Chen",
      did: "did:acadshield:student:stu_2023_1104",
      studentNumber: "GCI-CSA-902",
    },
    dates: {
      issued: "2023-01-01T00:00:00Z",
      expires: "2025-01-01T00:00:00Z",
    },
    integrity: {
      documentHash: "0x2222b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      computedHash: "0x2222b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      hashAlgorithm: "SHA-256",
      ipfsMetadataCid: "QmMockExpiredCid",
      ipfsDocumentCid: "QmMockDocCid2",
    },
    blockchain: {
      network: "Polygon Amoy Testnet",
      chainId: 80002,
      contractAddress: "0x3Fa890B9772B5620803513360bA082b2EbC7338A",
      tokenId: "103",
      transactionHash: "0x6d78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fc",
      blockNumber: 1280000,
      confirmed: true,
    },
    w3cPayload: {
      "status": "EXPIRED",
      "validUntil": "2025-01-01T00:00:00Z"
    }
  },
  "cred_unverified_issuer_004": {
    id: "cred_unverified_issuer_004",
    opaqueId: "cuid_unverified_web_11",
    type: "COURSE_CERTIFICATE",
    title: "Fullstack Web & Smart Contract Development",
    status: "ISSUER_UNVERIFIED",
    issuer: {
      id: "inst_unverified_004",
      name: "Apex Virtual Academy (Unaccredited)",
      domain: "apex-online.test",
      country: "Online",
      verified: false,
      verificationStatus: "PENDING",
    },
    holder: {
      name: "Marcus Brody",
      did: "did:acadshield:student:stu_2026_9932",
      studentNumber: "AVA-W-11",
    },
    dates: {
      issued: "2026-08-10T00:00:00Z",
      expires: null,
    },
    integrity: {
      documentHash: "0x3333b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      computedHash: "0x3333b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      hashAlgorithm: "SHA-256",
      ipfsMetadataCid: "QmMockUnverifiedCid",
      ipfsDocumentCid: "QmMockDocCid3",
    },
    blockchain: {
      network: "Polygon Amoy Testnet",
      chainId: 80002,
      contractAddress: "0x3Fa890B9772B5620803513360bA082b2EbC7338A",
      tokenId: "104",
      transactionHash: "0x7e78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fd",
      blockNumber: 1286000,
      confirmed: true,
    },
    w3cPayload: {
      "warning": "Issuer institution is under review and has not received verified trust status."
    }
  }
};
