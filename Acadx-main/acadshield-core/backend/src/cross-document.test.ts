import { compareHolderDocuments } from "./cross-document";

describe("holder document consistency", () => {
  it("normalizes formatting before comparing identity candidates", () => {
    const result = compareHolderDocuments([
      { id: "a", documentType: "SSLC", extractedFields: { fields: { studentName: { value: "Asha R. Nair" }, registerNumber: { value: "AB-1234" } } } },
      { id: "b", documentType: "DEGREE", extractedFields: { fields: { studentName: { value: "ASHA R NAIR" }, registerNumber: { value: "AB1234" } } } },
    ]);
    expect(result.status).toBe("CONSISTENT");
  });

  it("reports discrepancies for human review and never labels fraud", () => {
    const result = compareHolderDocuments([
      { id: "a", documentType: "HSC", extractedFields: { fields: { studentName: { value: "Asha Nair" } } } },
      { id: "b", documentType: "DEGREE", extractedFields: { fields: { studentName: { value: "Asha Rao" } } } },
    ]);
    expect(result.status).toBe("REVIEW_REQUIRED");
    expect(result.mismatches).toContain("studentName");
    expect(JSON.stringify(result)).not.toContain("FRAUD");
  });
});
