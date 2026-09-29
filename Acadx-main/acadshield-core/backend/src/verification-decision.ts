import { CredentialStatus, VerificationDecision } from "@prisma/client";

export type DecisionEvidence = {
  lifecycle: CredentialStatus;
  expired: boolean;
  issuerActive: boolean;
  documentRegistered: boolean;
  hashCompared: boolean;
  hashMatches: boolean | null;
  signature: "VERIFIED" | "MISSING" | "INVALID" | "NOT_CONFIGURED";
  blockchain: "NOT_RECORDED" | "NOT_CONFIGURED" | "UNAVAILABLE" | "MISMATCH" | "REVOKED" | "VERIFIED";
};

/** Deterministic evidence gates the decision; AI risk output is deliberately absent. */
export function decideVerification(evidence: DecisionEvidence): VerificationDecision {
  if (evidence.lifecycle === "REVOKED" || evidence.blockchain === "REVOKED") return "REVOKED";
  if (evidence.lifecycle === "EXPIRED" || evidence.expired) return "EXPIRED";
  if (evidence.lifecycle !== "ACTIVE") return "INVALID";
  if (!evidence.issuerActive) return "SOURCE_UNAVAILABLE";
  if (!evidence.documentRegistered) return "INVALID";
  if (evidence.blockchain === "MISMATCH") return "MISMATCH";
  if (evidence.hashCompared && evidence.hashMatches === false) return "MISMATCH";
  if (evidence.signature === "INVALID" || evidence.signature === "MISSING") return "INVALID";
  if (evidence.signature !== "VERIFIED") return "REVIEW_REQUIRED";
  if (evidence.hashCompared && evidence.hashMatches !== true) return "REVIEW_REQUIRED";
  if (!["NOT_RECORDED", "VERIFIED"].includes(evidence.blockchain)) return "REVIEW_REQUIRED";
  return "VERIFIED";
}
