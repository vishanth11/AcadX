"use client";

import {
  Institution,
  Company,
  StudentProfile,
  CandidateRecord,
  VerificationRecord,
  AcademicDocument,
  CredentialItem,
  AuditRecord,
  INITIAL_INSTITUTIONS,
  INITIAL_COMPANIES,
  INITIAL_STUDENTS,
  INITIAL_CANDIDATES,
  INITIAL_DOCUMENTS,
  INITIAL_CREDENTIALS,
  INITIAL_VERIFICATIONS,
  INITIAL_AUDIT_LOGS,
  UserRole
} from "./mock-platform-data";
import { useEffect, useState } from "react";

const STORAGE_KEYS = {
  INSTITUTIONS: "acadshield_institutions_v1",
  COMPANIES: "acadshield_companies_v1",
  STUDENTS: "acadshield_students_v1",
  CANDIDATES: "acadshield_candidates_v1",
  DOCUMENTS: "acadshield_documents_v1",
  CREDENTIALS: "acadshield_credentials_v1",
  VERIFICATIONS: "acadshield_verifications_v1",
  AUDIT: "acadshield_audit_v1",
  ACTIVE_ROLE: "acadshield_active_role_v1"
};

export async function computeSha256(fileOrBuffer: File | ArrayBuffer): Promise<string> {
  const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function usePlatformState() {
  const [institutions, setInstitutions] = useState<Institution[]>(INITIAL_INSTITUTIONS);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [students, setStudents] = useState<StudentProfile[]>(INITIAL_STUDENTS);
  const [candidates, setCandidates] = useState<CandidateRecord[]>(INITIAL_CANDIDATES);
  const [documents, setDocuments] = useState<AcademicDocument[]>(INITIAL_DOCUMENTS);
  const [credentials, setCredentials] = useState<CredentialItem[]>(INITIAL_CREDENTIALS);
  const [verifications, setVerifications] = useState<VerificationRecord[]>(INITIAL_VERIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [activeRole, setActiveRole] = useState<UserRole>("UNIVERSITY");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedInst = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
      if (storedInst) setInstitutions(JSON.parse(storedInst));

      const storedComp = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      if (storedComp) setCompanies(JSON.parse(storedComp));

      const storedStu = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (storedStu) setStudents(JSON.parse(storedStu));

      const storedCand = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
      if (storedCand) setCandidates(JSON.parse(storedCand));

      const storedDocs = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (storedDocs) setDocuments(JSON.parse(storedDocs));

      const storedCreds = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (storedCreds) setCredentials(JSON.parse(storedCreds));

      const storedVerifs = localStorage.getItem(STORAGE_KEYS.VERIFICATIONS);
      if (storedVerifs) setVerifications(JSON.parse(storedVerifs));

      const storedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
      if (storedAudit) setAuditLogs(JSON.parse(storedAudit));

      const storedRole = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
      if (storedRole) setActiveRole(storedRole as UserRole);
    } catch {
      // Fallback to initial seeds
    }
    setIsLoaded(true);
  }, []);

  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const addDocument = (newDoc: AcademicDocument) => {
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, updated);

    // Append audit log
    const audit: AuditRecord = {
      id: "aud_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      actor: newDoc.uploadedBy,
      role: "ISSUER",
      action: "DOCUMENT_UPLOADED",
      entity: "DOCUMENT",
      entityId: newDoc.id,
      result: "SUCCESS",
      details: `Authoritative ${newDoc.documentType} registered with SHA-256 fingerprint.`
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);
    saveToStorage(STORAGE_KEYS.AUDIT, updatedAudit);
  };

  const addVerification = (verif: VerificationRecord) => {
    const updated = [verif, ...verifications];
    setVerifications(updated);
    saveToStorage(STORAGE_KEYS.VERIFICATIONS, updated);

    const audit: AuditRecord = {
      id: "aud_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      actor: verif.companyName,
      role: "COMPANY",
      action: "DOCUMENT_HASH_VERIFIED",
      entity: "VERIFICATION",
      entityId: verif.id,
      result: verif.result === "VERIFIED" ? "SUCCESS" : "WARNING",
      details: `Verification result: ${verif.result} for ${verif.documentType}`
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);
    saveToStorage(STORAGE_KEYS.AUDIT, updatedAudit);
  };

  const revokeCredential = (credentialId: string, reason: string) => {
    const updated = credentials.map(c => {
      if (c.id === credentialId) {
        return {
          ...c,
          status: "REVOKED" as const,
          revocationReason: reason,
          revokedAt: new Date().toISOString()
        };
      }
      return c;
    });
    setCredentials(updated);
    saveToStorage(STORAGE_KEYS.CREDENTIALS, updated);

    // Also mark linked document as REVOKED
    const targetCred = credentials.find(c => c.id === credentialId);
    if (targetCred?.documentId) {
      const updatedDocs = documents.map(d => {
        if (d.id === targetCred.documentId) {
          return { ...d, status: "REVOKED" as const };
        }
        return d;
      });
      setDocuments(updatedDocs);
      saveToStorage(STORAGE_KEYS.DOCUMENTS, updatedDocs);
    }

    const audit: AuditRecord = {
      id: "aud_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      actor: "University Registrar Authority",
      role: "UNIVERSITY",
      action: "CREDENTIAL_REVOKED",
      entity: "CREDENTIAL",
      entityId: credentialId,
      result: "WARNING",
      details: `Revocation executed. Reason: ${reason}`
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);
    saveToStorage(STORAGE_KEYS.AUDIT, updatedAudit);
  };

  const updateInstitutionStatus = (instId: string, status: "VERIFIED" | "SUSPENDED" | "REJECTED") => {
    const updated = institutions.map(i => (i.id === instId ? { ...i, status } : i));
    setInstitutions(updated);
    saveToStorage(STORAGE_KEYS.INSTITUTIONS, updated);

    const audit: AuditRecord = {
      id: "aud_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      actor: "Universal Admin",
      role: "ADMIN",
      action: `INSTITUTION_${status}`,
      entity: "INSTITUTION",
      entityId: instId,
      result: status === "VERIFIED" ? "SUCCESS" : "WARNING",
      details: `Administrative status change to ${status}.`
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);
    saveToStorage(STORAGE_KEYS.AUDIT, updatedAudit);
  };

  const updateCompanyStatus = (compId: string, status: "VERIFIED" | "SUSPENDED") => {
    const updated = companies.map(c => (c.id === compId ? { ...c, status } : c));
    setCompanies(updated);
    saveToStorage(STORAGE_KEYS.COMPANIES, updated);

    const audit: AuditRecord = {
      id: "aud_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      actor: "Universal Admin",
      role: "ADMIN",
      action: `COMPANY_${status}`,
      entity: "COMPANY",
      entityId: compId,
      result: status === "VERIFIED" ? "SUCCESS" : "WARNING",
      details: `Corporate verifier status updated to ${status}.`
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);
    saveToStorage(STORAGE_KEYS.AUDIT, updatedAudit);
  };

  const changeRole = (role: UserRole) => {
    setActiveRole(role);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role || "");
    } catch {
      // ignore
    }
  };

  const resetPlatformState = () => {
    setInstitutions(INITIAL_INSTITUTIONS);
    setCompanies(INITIAL_COMPANIES);
    setStudents(INITIAL_STUDENTS);
    setCandidates(INITIAL_CANDIDATES);
    setDocuments(INITIAL_DOCUMENTS);
    setCredentials(INITIAL_CREDENTIALS);
    setVerifications(INITIAL_VERIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  };

  return {
    isLoaded,
    institutions,
    companies,
    students,
    candidates,
    documents,
    credentials,
    verifications,
    auditLogs,
    activeRole,
    changeRole,
    addDocument,
    addVerification,
    revokeCredential,
    updateInstitutionStatus,
    updateCompanyStatus,
    resetPlatformState
  };
}
