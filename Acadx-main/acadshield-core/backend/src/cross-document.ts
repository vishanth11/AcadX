export type CrossDocumentRecord = {
  id: string;
  documentType: string | null;
  extractedFields: unknown;
};

const identityFields = ["studentName", "registerNumber", "dateOfBirth"] as const;

function normalized(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function candidate(record: CrossDocumentRecord, field: string): string | null {
  if (!record.extractedFields || typeof record.extractedFields !== "object") return null;
  const root = record.extractedFields as Record<string, unknown>;
  const fields = root.fields && typeof root.fields === "object" ? root.fields as Record<string, unknown> : root;
  const value = fields[field];
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object" && "value" in value && typeof (value as { value?: unknown }).value === "string") {
    return ((value as { value: string }).value).trim() || null;
  }
  return null;
}

export function compareHolderDocuments(records: CrossDocumentRecord[]) {
  const comparisons = identityFields.flatMap((field) => {
    const values = records.flatMap((record) => {
      const value = candidate(record, field);
      return value ? [{ documentId: record.id, documentType: record.documentType, value }] : [];
    });
    if (values.length < 2) return [];
    return [{ field, status: new Set(values.map((item) => normalized(item.value))).size === 1 ? "MATCH" : "REVIEW_REQUIRED", values }];
  });
  const mismatches = comparisons.filter((item) => item.status !== "MATCH");
  return {
    status: mismatches.length ? "REVIEW_REQUIRED" : comparisons.length ? "CONSISTENT" : "INSUFFICIENT_EVIDENCE",
    comparisons,
    mismatches: mismatches.map((item) => item.field),
    evidence: ["Only extracted identity candidates in this university and holder reference were compared", "Differences require human review and are not a fraud finding"],
  };
}
