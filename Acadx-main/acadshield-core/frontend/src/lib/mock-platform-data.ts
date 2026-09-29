export type UserRole = "UNIVERSITY" | "COMPANY" | "ADMIN" | "STUDENT" | null;

import { requireDemoMode } from "./demo-mode";
requireDemoMode();

export interface Institution {
  id: string;
  legalName: string;
  displayName: string;
  type: string;
  domain: string;
  email: string;
  status: "VERIFIED" | "PENDING" | "SUSPENDED" | "REJECTED";
  country: string;
  city: string;
  studentsCount: number;
  issuersCount: number;
  credentialsCount: number;
  documentsCount: number;
  registeredAt: string;
  walletAddress?: string;
  accreditationBody?: string;
}

export interface Company {
  id: string;
  legalName: string;
  displayName: string;
  domain: string;
  email: string;
  industry: string;
  status: "VERIFIED" | "PENDING" | "SUSPENDED";
  candidatesCount: number;
  verificationsCount: number;
  registeredAt: string;
  apiKeysCount: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  did: string;
  universityId: string;
  universityName: string;
  department: string;
  program: string;
  year: string;
  status: "ACTIVE" | "GRADUATED" | "ALUMNI";
  credentialCount: number;
  documentCount: number;
  email: string;
  registeredAt: string;
}

export interface CandidateRecord {
  id: string;
  name: string;
  did: string;
  targetRole: string;
  companyId: string;
  department: string;
  credentialsCount: number;
  verificationStatus: "VERIFIED" | "HASH_MISMATCH" | "PENDING_REVIEW" | "UNVERIFIED";
  documentStatus: "MATCHED" | "MISMATCHED" | "AWAITING_UPLOAD";
  lastVerifiedAt: string;
  riskSignal: "LOW" | "ELEVATED" | "NOMINAL";
  institution: string;
  degreeTitle: string;
}

export interface VerificationRecord {
  id: string;
  companyId: string;
  companyName: string;
  candidateName: string;
  candidateId: string;
  credentialId: string;
  documentId: string;
  documentType: string;
  result: "VERIFIED" | "HASH_MISMATCH" | "REVOKED" | "EXPIRED" | "REVIEW_REQUIRED";
  verificationTime: string;
  registeredHash: string;
  submittedHash: string;
  issuerName: string;
  universityName: string;
  blockchainTx: string;
  aiRiskSignal: "LOW" | "MEDIUM" | "HIGH";
  notes?: string;
}

export interface AcademicDocument {
  id: string;
  studentId: string;
  studentName: string;
  studentDid: string;
  universityId: string;
  universityName: string;
  documentType: string;
  category: "IDENTITY" | "SCHOOL" | "UNDERGRADUATE" | "POSTGRADUATE" | "INTERNSHIP" | "OTHER";
  documentNumber: string;
  issueDate: string;
  academicYear: string;
  sha256Hash: string;
  status: "VERIFIED" | "PENDING_REVIEW" | "REVIEW_REQUIRED" | "REVOKED" | "SUPERSEDED";
  uploadedBy: string;
  uploadedAt: string;
  fileName: string;
  fileSize: string;
  ipfsCid: string;
  credentialId?: string;
  checks: {
    fileValid: boolean;
    metadataValid: boolean;
    studentMatched: boolean;
    universityMatched: boolean;
    issuerAuthorized: boolean;
    hashGenerated: boolean;
    duplicateFree: boolean;
    blockchainAnchored: boolean;
  };
  versions: Array<{
    versionNumber: number;
    sha256Hash: string;
    uploadedAt: string;
    reason?: string;
    status: string;
  }>;
}

export interface CredentialItem {
  id: string;
  title: string;
  type: string;
  studentName: string;
  studentDid: string;
  universityName: string;
  issuerName: string;
  issueDate: string;
  expirationDate: string | null;
  status: "ACTIVE" | "REVOKED" | "EXPIRED" | "DRAFT";
  documentId: string;
  documentHash: string;
  blockchain: {
    network: string;
    tokenId: string;
    txHash: string;
    blockNumber: number;
    confirmed: boolean;
  };
  revocationReason?: string;
  revokedAt?: string;
  version: number;
  qrUrl: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  result: "SUCCESS" | "WARNING" | "BLOCKED";
  txHash?: string;
  details: string;
}

export const DOCUMENT_CATEGORIES: Record<string, string[]> = {
  "ACADEMIC IDENTITY": [
    "Student ID Card",
    "University Enrollment Record",
    "Bonafide Student Certificate"
  ],
  "ACADEMIC SCHOOL DOCUMENTS": [
    "SSLC Marksheet (10th Standard)",
    "HSC Marksheet (12th Standard)",
    "School Migration Certificate",
    "School Leaving / Transfer Certificate"
  ],
  "UNDERGRADUATE DOCUMENTS": [
    "Semester Marksheet (Term 1 - 8)",
    "Consolidated Grade Sheet",
    "Academic Transcript",
    "Provisional Degree Certificate",
    "Degree Certificate (Final)",
    "Degree Completion Certificate",
    "Transfer Certificate (TC)",
    "Migration Certificate",
    "Course Completion Certificate",
    "Character Certificate",
    "Rank Certificate",
    "Academic Achievement Certificate"
  ],
  "INTERNSHIP / TRAINING": [
    "Internship Certificate (University-issued)",
    "Clinical / Practical Training Certificate",
    "Advanced Workshop Certificate",
    "Institution Skill & Honors Certificate"
  ],
  "POSTGRADUATE / HIGHER EDUCATION": [
    "Postgraduate Semester Transcript",
    "Consolidated Master Transcript",
    "Provisional Master Degree",
    "Final Master Degree",
    "Doctoral Completion Certificate",
    "Research / Academic Publication Credential"
  ],
  "OTHER": [
    "Custom Institutional Certificate",
    "Dean's Honor Roll Document"
  ]
};

export const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: "inst_mit_001",
    legalName: "Massachusetts Institute of Technology",
    displayName: "MIT",
    type: "Research University",
    domain: "mit.edu",
    email: "registrar@mit.edu",
    status: "VERIFIED",
    country: "United States",
    city: "Cambridge",
    studentsCount: 11520,
    issuersCount: 42,
    credentialsCount: 8940,
    documentsCount: 14210,
    registeredAt: "2024-01-15T09:00:00Z",
    walletAddress: "0x71C...49A2",
    accreditationBody: "NECHE Accredited"
  },
  {
    id: "inst_poly_002",
    legalName: "National Polytechnic Institute",
    displayName: "NPI",
    type: "Polytechnic / Institute of Tech",
    domain: "polytechnic.ac.in",
    email: "credentials@polytechnic.ac.in",
    status: "VERIFIED",
    country: "India",
    city: "Bangalore",
    studentsCount: 8400,
    issuersCount: 28,
    credentialsCount: 6120,
    documentsCount: 9800,
    registeredAt: "2024-03-20T11:30:00Z",
    walletAddress: "0x93F...18E7",
    accreditationBody: "AICTE Accredited"
  },
  {
    id: "inst_oxf_003",
    legalName: "University of Oxford",
    displayName: "Oxford",
    type: "Collegiate Research University",
    domain: "ox.ac.uk",
    email: "academic.office@ox.ac.uk",
    status: "VERIFIED",
    country: "United Kingdom",
    city: "Oxford",
    studentsCount: 24000,
    issuersCount: 85,
    credentialsCount: 19500,
    documentsCount: 31200,
    registeredAt: "2024-02-10T14:00:00Z",
    walletAddress: "0x12A...99C4",
    accreditationBody: "QAA Certified"
  },
  {
    id: "inst_apex_004",
    legalName: "Apex Global Technological College",
    displayName: "Apex Tech",
    type: "Technical College",
    domain: "apextech.edu",
    email: "admin@apextech.edu",
    status: "PENDING",
    country: "Singapore",
    city: "Singapore",
    studentsCount: 1200,
    issuersCount: 4,
    credentialsCount: 0,
    documentsCount: 12,
    registeredAt: "2026-09-24T16:45:00Z",
    accreditationBody: "Pending Board Review"
  }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: "comp_anthropic_001",
    legalName: "Anthropic PBC",
    displayName: "Anthropic",
    domain: "anthropic.com",
    email: "talent-verify@anthropic.com",
    industry: "Artificial Intelligence Research",
    status: "VERIFIED",
    candidatesCount: 142,
    verificationsCount: 389,
    registeredAt: "2024-04-10T10:00:00Z",
    apiKeysCount: 3
  },
  {
    id: "comp_google_002",
    legalName: "Google LLC",
    displayName: "Google",
    domain: "google.com",
    email: "enterprise-trust@google.com",
    industry: "Information Technology & Cloud",
    status: "VERIFIED",
    candidatesCount: 680,
    verificationsCount: 2410,
    registeredAt: "2024-02-01T08:30:00Z",
    apiKeysCount: 12
  },
  {
    id: "comp_stripe_003",
    legalName: "Stripe Inc.",
    displayName: "Stripe",
    domain: "stripe.com",
    email: "background-checks@stripe.com",
    industry: "Financial Infrastructure",
    status: "VERIFIED",
    candidatesCount: 95,
    verificationsCount: 412,
    registeredAt: "2024-05-18T12:00:00Z",
    apiKeysCount: 2
  },
  {
    id: "comp_novastart_004",
    legalName: "NovaStart Labs Inc.",
    displayName: "NovaStart",
    domain: "novastart.io",
    email: "ops@novastart.io",
    industry: "Biotech / Early Stage",
    status: "PENDING",
    candidatesCount: 0,
    verificationsCount: 0,
    registeredAt: "2026-09-25T03:10:00Z",
    apiKeysCount: 0
  }
];

export const INITIAL_STUDENTS: StudentProfile[] = [
  {
    id: "stu_alex_001",
    name: "Alex Vance Morgan",
    did: "did:acadshield:student:stu_2026_9941",
    universityId: "inst_mit_001",
    universityName: "Massachusetts Institute of Technology",
    department: "Department of Electrical Engineering & Computer Science",
    program: "B.S. in Computer Science & Artificial Intelligence",
    year: "Class of 2026",
    status: "ACTIVE",
    credentialCount: 3,
    documentCount: 5,
    email: "a.morgan@alum.mit.edu",
    registeredAt: "2022-09-01T08:00:00Z"
  },
  {
    id: "stu_elena_002",
    name: "Elena Rostova",
    did: "did:acadshield:student:stu_2025_1102",
    universityId: "inst_oxf_003",
    universityName: "University of Oxford",
    department: "Department of Mathematics & Data Science",
    program: "M.Sc. in Mathematical Modeling & Scientific Computing",
    year: "Class of 2025",
    status: "GRADUATED",
    credentialCount: 2,
    documentCount: 4,
    email: "elena.r@ox.ac.uk",
    registeredAt: "2023-10-01T09:30:00Z"
  },
  {
    id: "stu_david_003",
    name: "David Miller",
    did: "did:acadshield:student:stu_2025_4812",
    universityId: "inst_poly_002",
    universityName: "National Polytechnic Institute",
    department: "School of Cybersecurity & Network Architecture",
    program: "Diploma in Information Security Systems",
    year: "Class of 2025",
    status: "ACTIVE",
    credentialCount: 1,
    documentCount: 2,
    email: "david.miller@polytechnic.ac.in",
    registeredAt: "2023-01-15T11:00:00Z"
  }
];

export const INITIAL_CANDIDATES: CandidateRecord[] = [
  {
    id: "cand_alex_001",
    name: "Alex Vance Morgan",
    did: "did:acadshield:student:stu_2026_9941",
    targetRole: "Senior Systems Research Engineer",
    companyId: "comp_anthropic_001",
    department: "Core Architecture Team",
    credentialsCount: 3,
    verificationStatus: "VERIFIED",
    documentStatus: "MATCHED",
    lastVerifiedAt: "2026-09-25T09:12:00Z",
    riskSignal: "LOW",
    institution: "Massachusetts Institute of Technology",
    degreeTitle: "B.S. in Computer Science & Artificial Intelligence"
  },
  {
    id: "cand_elena_002",
    name: "Elena Rostova",
    did: "did:acadshield:student:stu_2025_1102",
    targetRole: "Lead Quantitative Modeler",
    companyId: "comp_stripe_003",
    department: "Risk Infrastructure",
    credentialsCount: 2,
    verificationStatus: "VERIFIED",
    documentStatus: "MATCHED",
    lastVerifiedAt: "2026-09-24T14:40:00Z",
    riskSignal: "LOW",
    institution: "University of Oxford",
    degreeTitle: "M.Sc. in Mathematical Modeling"
  },
  {
    id: "cand_david_003",
    name: "David Miller",
    did: "did:acadshield:student:stu_2025_4812",
    targetRole: "Infrastructure Security Analyst",
    companyId: "comp_google_002",
    department: "Cloud Security Operations",
    credentialsCount: 1,
    verificationStatus: "HASH_MISMATCH",
    documentStatus: "MISMATCHED",
    lastVerifiedAt: "2026-09-25T10:05:00Z",
    riskSignal: "ELEVATED",
    institution: "National Polytechnic Institute",
    degreeTitle: "Diploma in Information Security Systems"
  }
];

export const INITIAL_DOCUMENTS: AcademicDocument[] = [
  {
    id: "doc_mit_degree_001",
    studentId: "stu_alex_001",
    studentName: "Alex Vance Morgan",
    studentDid: "did:acadshield:student:stu_2026_9941",
    universityId: "inst_mit_001",
    universityName: "Massachusetts Institute of Technology",
    documentType: "Degree Certificate (Final)",
    category: "UNDERGRADUATE",
    documentNumber: "MIT-EECS-2026-8819",
    issueDate: "2026-06-04",
    academicYear: "2022-2026",
    sha256Hash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    status: "VERIFIED",
    uploadedBy: "Prof. Arthur Pendelton (Dean of Engineering)",
    uploadedAt: "2026-06-04T10:15:00Z",
    fileName: "Alex_Morgan_MIT_Degree_Certificate.pdf",
    fileSize: "2.4 MB",
    ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    credentialId: "cred_valid_degree_001",
    checks: {
      fileValid: true,
      metadataValid: true,
      studentMatched: true,
      universityMatched: true,
      issuerAuthorized: true,
      hashGenerated: true,
      duplicateFree: true,
      blockchainAnchored: true
    },
    versions: [
      {
        versionNumber: 1,
        sha256Hash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        uploadedAt: "2026-06-04T10:15:00Z",
        status: "ACTIVE"
      }
    ]
  },
  {
    id: "doc_mit_transcript_002",
    studentId: "stu_alex_001",
    studentName: "Alex Vance Morgan",
    studentDid: "did:acadshield:student:stu_2026_9941",
    universityId: "inst_mit_001",
    universityName: "Massachusetts Institute of Technology",
    documentType: "Academic Transcript",
    category: "UNDERGRADUATE",
    documentNumber: "TR-MIT-2026-041",
    issueDate: "2026-06-02",
    academicYear: "2022-2026",
    sha256Hash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
    status: "VERIFIED",
    uploadedBy: "Registrar Office (MIT)",
    uploadedAt: "2026-06-02T14:30:00Z",
    fileName: "Alex_Morgan_Official_Transcript.pdf",
    fileSize: "1.8 MB",
    ipfsCid: "QmZtmD2qt8fJpq3CLDH8pAsWbs6jK6R3A7D6bcmq8cR4Fv",
    credentialId: "cred_mit_transcript_002",
    checks: {
      fileValid: true,
      metadataValid: true,
      studentMatched: true,
      universityMatched: true,
      issuerAuthorized: true,
      hashGenerated: true,
      duplicateFree: true,
      blockchainAnchored: true
    },
    versions: [
      {
        versionNumber: 1,
        sha256Hash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
        uploadedAt: "2026-06-02T14:30:00Z",
        status: "ACTIVE"
      }
    ]
  },
  {
    id: "doc_mit_sslc_003",
    studentId: "stu_alex_001",
    studentName: "Alex Vance Morgan",
    studentDid: "did:acadshield:student:stu_2026_9941",
    universityId: "inst_mit_001",
    universityName: "Massachusetts Institute of Technology",
    documentType: "SSLC Marksheet (10th Standard)",
    category: "SCHOOL",
    documentNumber: "SSLC-2020-99120",
    issueDate: "2020-05-15",
    academicYear: "2019-2020",
    sha256Hash: "0x3344556677889900aabbccddeeff00112233445566778899aabbccddeeff0011",
    status: "VERIFIED",
    uploadedBy: "Admissions Verification Desk (MIT)",
    uploadedAt: "2022-08-20T11:00:00Z",
    fileName: "Alex_Morgan_SSLC_Verified.pdf",
    fileSize: "1.2 MB",
    ipfsCid: "QmSSLCVerifiedArchiveCid90123",
    checks: {
      fileValid: true,
      metadataValid: true,
      studentMatched: true,
      universityMatched: true,
      issuerAuthorized: true,
      hashGenerated: true,
      duplicateFree: true,
      blockchainAnchored: true
    },
    versions: [
      {
        versionNumber: 1,
        sha256Hash: "0x3344556677889900aabbccddeeff00112233445566778899aabbccddeeff0011",
        uploadedAt: "2022-08-20T11:00:00Z",
        status: "ACTIVE"
      }
    ]
  },
  {
    id: "doc_oxf_degree_004",
    studentId: "stu_elena_002",
    studentName: "Elena Rostova",
    studentDid: "did:acadshield:student:stu_2025_1102",
    universityId: "inst_oxf_003",
    universityName: "University of Oxford",
    documentType: "Final Master Degree",
    category: "POSTGRADUATE",
    documentNumber: "OXF-MATH-2025-019",
    issueDate: "2025-07-12",
    academicYear: "2023-2025",
    sha256Hash: "0x4e21a88b8f2c3d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    status: "VERIFIED",
    uploadedBy: "Examinations Committee (Oxford)",
    uploadedAt: "2025-07-12T16:00:00Z",
    fileName: "Elena_Rostova_Oxford_MSc.pdf",
    fileSize: "3.1 MB",
    ipfsCid: "QmOxfordOfficialMScCredentialCid4412",
    credentialId: "cred_oxf_msc_003",
    checks: {
      fileValid: true,
      metadataValid: true,
      studentMatched: true,
      universityMatched: true,
      issuerAuthorized: true,
      hashGenerated: true,
      duplicateFree: true,
      blockchainAnchored: true
    },
    versions: [
      {
        versionNumber: 1,
        sha256Hash: "0x4e21a88b8f2c3d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
        uploadedAt: "2025-07-12T16:00:00Z",
        status: "ACTIVE"
      }
    ]
  },
  {
    id: "doc_poly_cyber_005",
    studentId: "stu_david_003",
    studentName: "David Miller",
    studentDid: "did:acadshield:student:stu_2025_4812",
    universityId: "inst_poly_002",
    universityName: "National Polytechnic Institute",
    documentType: "Diploma Certificate (Final)",
    category: "UNDERGRADUATE",
    documentNumber: "NPI-SEC-4410",
    issueDate: "2025-01-10",
    academicYear: "2023-2025",
    sha256Hash: "0x1111b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    status: "REVOKED",
    uploadedBy: "Registrar Office (NPI)",
    uploadedAt: "2025-01-10T11:00:00Z",
    fileName: "David_Miller_Cyber_Diploma.pdf",
    fileSize: "1.1 MB",
    ipfsCid: "QmMockRevokedCid",
    credentialId: "cred_revoked_diploma_002",
    checks: {
      fileValid: true,
      metadataValid: true,
      studentMatched: true,
      universityMatched: true,
      issuerAuthorized: true,
      hashGenerated: true,
      duplicateFree: true,
      blockchainAnchored: true
    },
    versions: [
      {
        versionNumber: 1,
        sha256Hash: "0x1111b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        uploadedAt: "2025-01-10T11:00:00Z",
        status: "REVOKED",
        reason: "Administrative integrity review correction."
      }
    ]
  }
];

export const INITIAL_CREDENTIALS: CredentialItem[] = [
  {
    id: "cred_valid_degree_001",
    title: "Bachelor of Science in Computer Science & AI",
    type: "BachelorDegreeCredential",
    studentName: "Alex Vance Morgan",
    studentDid: "did:acadshield:student:stu_2026_9941",
    universityName: "Massachusetts Institute of Technology",
    issuerName: "Prof. Arthur Pendelton (Dean of EECS)",
    issueDate: "2026-06-04",
    expirationDate: null,
    status: "ACTIVE",
    documentId: "doc_mit_degree_001",
    documentHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    blockchain: {
      network: "Polygon Amoy (80002)",
      tokenId: "101",
      txHash: "0x4b78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fa",
      blockNumber: 1420951,
      confirmed: true
    },
    version: 1,
    qrUrl: "https://acadshield.network/verify/cred_valid_degree_001"
  },
  {
    id: "cred_mit_transcript_002",
    title: "Official Academic Transcript (Consolidated)",
    type: "AcademicTranscriptCredential",
    studentName: "Alex Vance Morgan",
    studentDid: "did:acadshield:student:stu_2026_9941",
    universityName: "Massachusetts Institute of Technology",
    issuerName: "Registrar Office (MIT)",
    issueDate: "2026-06-02",
    expirationDate: null,
    status: "ACTIVE",
    documentId: "doc_mit_transcript_002",
    documentHash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
    blockchain: {
      network: "Polygon Amoy (80002)",
      tokenId: "102",
      txHash: "0x6f91283e10c71a3994bb2e8174f192b0c102a9b4412ef17293a8c1992019ab71",
      blockNumber: 1420810,
      confirmed: true
    },
    version: 1,
    qrUrl: "https://acadshield.network/verify/cred_mit_transcript_002"
  },
  {
    id: "cred_oxf_msc_003",
    title: "Master of Science in Mathematical Modeling",
    type: "MasterDegreeCredential",
    studentName: "Elena Rostova",
    studentDid: "did:acadshield:student:stu_2025_1102",
    universityName: "University of Oxford",
    issuerName: "Dr. Alistair Finch (Director of Graduate Studies)",
    issueDate: "2025-07-12",
    expirationDate: null,
    status: "ACTIVE",
    documentId: "doc_oxf_degree_004",
    documentHash: "0x4e21a88b8f2c3d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    blockchain: {
      network: "Polygon Amoy (80002)",
      tokenId: "103",
      txHash: "0x8192a0149fbc2018274ec8192a0018b291040182736bca821094018291024810",
      blockNumber: 1398210,
      confirmed: true
    },
    version: 1,
    qrUrl: "https://acadshield.network/verify/cred_oxf_msc_003"
  },
  {
    id: "cred_revoked_diploma_002",
    title: "Diploma in Information Security Systems",
    type: "DiplomaCredential",
    studentName: "David Miller",
    studentDid: "did:acadshield:student:stu_2025_4812",
    universityName: "National Polytechnic Institute",
    issuerName: "Registrar Office (NPI)",
    issueDate: "2025-01-10",
    expirationDate: null,
    status: "REVOKED",
    documentId: "doc_poly_cyber_005",
    documentHash: "0x1111b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    blockchain: {
      network: "Polygon Amoy (80002)",
      tokenId: "104",
      txHash: "0xaa1283e10c71a3994bb2e8174f192b0c102a9b4412ef17293a8c1992019ab999",
      blockNumber: 1380120,
      confirmed: true
    },
    revocationReason: "Institutional integrity audit correction: duplicate issuance flagged.",
    revokedAt: "2025-02-14T11:00:00Z",
    version: 1,
    qrUrl: "https://acadshield.network/verify/cred_revoked_diploma_002"
  }
];

export const INITIAL_VERIFICATIONS: VerificationRecord[] = [
  {
    id: "ver_anthropic_889",
    companyId: "comp_anthropic_001",
    companyName: "Anthropic PBC",
    candidateName: "Alex Vance Morgan",
    candidateId: "cand_alex_001",
    credentialId: "cred_valid_degree_001",
    documentId: "doc_mit_degree_001",
    documentType: "Degree Certificate (Final)",
    result: "VERIFIED",
    verificationTime: "2026-09-25T09:12:00Z",
    registeredHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    submittedHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    issuerName: "Prof. Arthur Pendelton",
    universityName: "Massachusetts Institute of Technology",
    blockchainTx: "0x4b78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fa",
    aiRiskSignal: "LOW",
    notes: "Bit-for-bit SHA-256 match. Issuer accreditation verified."
  },
  {
    id: "ver_google_890",
    companyId: "comp_google_002",
    companyName: "Google LLC",
    candidateName: "David Miller",
    candidateId: "cand_david_003",
    credentialId: "cred_revoked_diploma_002",
    documentId: "doc_poly_cyber_005",
    documentType: "Diploma Certificate (Final)",
    result: "REVOKED",
    verificationTime: "2026-09-25T10:05:00Z",
    registeredHash: "0x1111b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    submittedHash: "0x1111b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    issuerName: "Registrar Office (NPI)",
    universityName: "National Polytechnic Institute",
    blockchainTx: "0xaa1283e10c71a3994bb2e8174f192b0c102a9b4412ef17293a8c1992019ab999",
    aiRiskSignal: "HIGH",
    notes: "Authoritative state indicates institutional revocation."
  },
  {
    id: "ver_stripe_891",
    companyId: "comp_stripe_003",
    companyName: "Stripe Inc.",
    candidateName: "Elena Rostova",
    candidateId: "cand_elena_002",
    credentialId: "cred_oxf_msc_003",
    documentId: "doc_oxf_degree_004",
    documentType: "Final Master Degree",
    result: "VERIFIED",
    verificationTime: "2026-09-24T14:40:00Z",
    registeredHash: "0x4e21a88b8f2c3d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    submittedHash: "0x4e21a88b8f2c3d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    issuerName: "Dr. Alistair Finch",
    universityName: "University of Oxford",
    blockchainTx: "0x8192a0149fbc2018274ec8192a0018b291040182736bca821094018291024810",
    aiRiskSignal: "LOW",
    notes: "Consolidated transcript and degree certificate authenticated."
  }
];

export const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  {
    id: "aud_901",
    timestamp: "2026-09-25T08:14:02Z",
    actor: "Admin (Universal Governance)",
    role: "ADMIN",
    action: "INSTITUTION_VERIFIED",
    entity: "INSTITUTION",
    entityId: "inst_mit_001",
    result: "SUCCESS",
    txHash: "0x19a823b12...",
    details: "Approved Massachusetts Institute of Technology following accreditation check."
  },
  {
    id: "aud_902",
    timestamp: "2026-09-25T08:30:15Z",
    actor: "Prof. Arthur Pendelton",
    role: "ISSUER",
    action: "DOCUMENT_UPLOADED",
    entity: "DOCUMENT",
    entityId: "doc_mit_degree_001",
    result: "SUCCESS",
    details: "Uploaded Degree Certificate for Alex Vance. SHA-256 computed."
  },
  {
    id: "aud_903",
    timestamp: "2026-09-25T08:30:45Z",
    actor: "Prof. Arthur Pendelton",
    role: "ISSUER",
    action: "CREDENTIAL_ISSUED",
    entity: "CREDENTIAL",
    entityId: "cred_valid_degree_001",
    result: "SUCCESS",
    txHash: "0x4b78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fa",
    details: "Minted ERC-721 Token #101 on Polygon Amoy. Status ACTIVE."
  },
  {
    id: "aud_904",
    timestamp: "2026-09-25T09:12:00Z",
    actor: "Anthropic Talent Operations",
    role: "COMPANY",
    action: "DOCUMENT_HASH_VERIFIED",
    entity: "VERIFICATION",
    entityId: "ver_anthropic_889",
    result: "SUCCESS",
    details: "Submitted file copy matched registered university hash 0x7f83b165... Status: MATCH."
  },
  {
    id: "aud_905",
    timestamp: "2026-09-25T10:05:00Z",
    actor: "Google Enterprise Trust",
    role: "COMPANY",
    action: "CREDENTIAL_REVOKED_FLAG",
    entity: "CREDENTIAL",
    entityId: "cred_revoked_diploma_002",
    result: "WARNING",
    details: "Verification rejected due to authoritative university revocation status."
  }
];
