import { decideVerification, DecisionEvidence } from "./verification-decision";

const goodEvidence: DecisionEvidence = {
  lifecycle: "ACTIVE",
  expired: false,
  issuerActive: true,
  documentRegistered: true,
  hashCompared: true,
  hashMatches: true,
  signature: "VERIFIED",
  blockchain: "NOT_RECORDED",
};

describe("deterministic verification decision", () => {
  it("verifies a valid issuer signature and matching registered file hash", () => {
    expect(decideVerification(goodEvidence)).toBe("VERIFIED");
  });

  it("never lets a bad hash or chain record pass", () => {
    expect(decideVerification({ ...goodEvidence, hashMatches: false })).toBe("MISMATCH");
    expect(decideVerification({ ...goodEvidence, blockchain: "MISMATCH" })).toBe("MISMATCH");
  });

  it("preserves revocation and expiration as terminal lifecycle results", () => {
    expect(decideVerification({ ...goodEvidence, lifecycle: "REVOKED" })).toBe("REVOKED");
    expect(decideVerification({ ...goodEvidence, expired: true })).toBe("EXPIRED");
  });

  it("requires review when signature or a recorded chain cannot be checked", () => {
    expect(decideVerification({ ...goodEvidence, signature: "NOT_CONFIGURED" })).toBe("REVIEW_REQUIRED");
    expect(decideVerification({ ...goodEvidence, blockchain: "UNAVAILABLE" })).toBe("REVIEW_REQUIRED");
  });

  it("does not allow AI evidence to participate in the deterministic decision", () => {
    const aiEvidence = { riskScore: 0, classification: "authentic" };
    expect(decideVerification({ ...goodEvidence, ...(aiEvidence as object) })).toBe("VERIFIED");
  });
});
