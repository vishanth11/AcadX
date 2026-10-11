import dns from "node:dns";
import { MongoClient, Db, Collection } from "mongodb";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Use system default if custom servers cannot be set
}

export type SubmissionType = "SOURCE_DOCUMENT" | "CREDENTIAL" | "INSTITUTION_REGISTRATION";

export interface UniversitySubmission {
  id: string;
  type: SubmissionType;
  institutionId: string;
  institutionName?: string;
  submittedBy: string;
  status: "PENDING_ADMIN_APPROVAL" | "APPROVED" | "REJECTED";
  submittedAt: Date;
  payload: Record<string, unknown>;
  documentSha256?: string;
  credentialSha256?: string;
  adminDecision?: {
    decidedBy: string;
    decidedAt: Date;
    decision: "APPROVE" | "REJECT";
    notes?: string;
  };
}

export interface ApprovedVaultRecord {
  id: string;
  submissionId: string;
  recordType: SubmissionType;
  institutionId: string;
  institutionName?: string;
  approvedBy: string;
  approvedAt: Date;
  payload: Record<string, unknown>;
  documentSha256?: string;
  credentialSha256?: string;
  blockchainAnchor?: {
    tokenId?: string;
    transactionHash?: string;
    chainId?: number;
    contractAddress?: string;
  };
}

export interface AdminApprovalAudit {
  id: string;
  submissionId: string;
  action: "APPROVED" | "REJECTED";
  adminId: string;
  adminEmail?: string;
  timestamp: Date;
  notes?: string;
  recordSnapshot: Record<string, unknown>;
}

let client: MongoClient | null = null;
let db: Db | null = null;

export function isMongoConfigured(): boolean {
  if (process.env.NODE_ENV === "test" && !process.env.TEST_LIVE_MONGODB) return false;
  const uri = process.env.MONGODB_URI;
  return Boolean(uri && uri.startsWith("mongodb") && !uri.includes("replace_with_your_mongodb_atlas_uri"));
}

export async function getMongoDb(): Promise<Db | null> {
  if (!isMongoConfigured()) return null;
  if (db) return db;

  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGODB_DB_NAME || "acadshield_vault";

  try {
    if (!client) {
      client = new MongoClient(uri, {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
    }
    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error("MongoDB Atlas connection error:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function saveUniversitySubmission(submission: UniversitySubmission): Promise<boolean> {
  const database = await getMongoDb();
  if (!database) return false;

  try {
    const col: Collection<UniversitySubmission> = database.collection("university_submissions");
    await col.updateOne(
      { id: submission.id },
      { $set: submission },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error("Failed to save university submission to MongoDB Atlas:", error);
    return false;
  }
}

export async function approveAndVaultSubmission(
  submissionId: string,
  admin: { adminId: string; adminEmail?: string; notes?: string },
  blockchainAnchor?: { tokenId?: string; transactionHash?: string; chainId?: number; contractAddress?: string },
  fallbackSubmission?: UniversitySubmission
): Promise<ApprovedVaultRecord | null> {
  const database = await getMongoDb();
  if (!database) return null;

  try {
    const submissionsCol: Collection<UniversitySubmission> = database.collection("university_submissions");
    const vaultCol: Collection<ApprovedVaultRecord> = database.collection("approved_vault_records");
    const auditCol: Collection<AdminApprovalAudit> = database.collection("admin_approval_audit");

    let submission: UniversitySubmission | null = await submissionsCol.findOne({ id: submissionId });
    if (!submission && fallbackSubmission) {
      submission = fallbackSubmission;
      await submissionsCol.updateOne({ id: submissionId }, { $set: fallbackSubmission }, { upsert: true });
    }
    if (!submission) return null;

    const now = new Date();
    await submissionsCol.updateOne(
      { id: submissionId },
      {
        $set: {
          status: "APPROVED",
          adminDecision: {
            decidedBy: admin.adminId,
            decidedAt: now,
            decision: "APPROVE",
            notes: admin.notes,
          },
        },
      }
    );

    const vaultRecord: ApprovedVaultRecord = {
      id: crypto.randomUUID(),
      submissionId,
      recordType: submission.type,
      institutionId: submission.institutionId,
      institutionName: submission.institutionName,
      approvedBy: admin.adminId,
      approvedAt: now,
      payload: submission.payload,
      documentSha256: submission.documentSha256,
      credentialSha256: submission.credentialSha256,
      blockchainAnchor,
    };

    await vaultCol.insertOne(vaultRecord);

    await auditCol.insertOne({
      id: crypto.randomUUID(),
      submissionId,
      action: "APPROVED",
      adminId: admin.adminId,
      adminEmail: admin.adminEmail,
      timestamp: now,
      notes: admin.notes,
      recordSnapshot: vaultRecord as unknown as Record<string, unknown>,
    });

    return vaultRecord;
  } catch (error) {
    console.error("Failed to approve and vault submission in MongoDB Atlas:", error);
    return null;
  }
}

export async function recordBlockchainAnchor(
  submissionOrDocId: string,
  anchor: { tokenId?: string; transactionHash?: string; chainId?: number; contractAddress?: string }
): Promise<boolean> {
  const database = await getMongoDb();
  if (!database) return false;

  try {
    const vaultCol: Collection<ApprovedVaultRecord> = database.collection("approved_vault_records");
    await vaultCol.updateOne(
      {
        $or: [
          { submissionId: submissionOrDocId },
          { id: submissionOrDocId },
          { "payload.documentId": submissionOrDocId },
          { "payload.credentialId": submissionOrDocId },
        ],
      },
      { $set: { blockchainAnchor: anchor } }
    );
    return true;
  } catch (error) {
    console.error("Failed to record blockchain anchor in MongoDB Atlas:", error);
    return false;
  }
}

export async function rejectUniversitySubmission(
  submissionId: string,
  admin: { adminId: string; adminEmail?: string; reason: string }
): Promise<boolean> {
  const database = await getMongoDb();
  if (!database) return false;

  try {
    const submissionsCol: Collection<UniversitySubmission> = database.collection("university_submissions");
    const auditCol: Collection<AdminApprovalAudit> = database.collection("admin_approval_audit");

    const submission = await submissionsCol.findOne({ id: submissionId });
    if (!submission) return false;

    const now = new Date();
    await submissionsCol.updateOne(
      { id: submissionId },
      {
        $set: {
          status: "REJECTED",
          adminDecision: {
            decidedBy: admin.adminId,
            decidedAt: now,
            decision: "REJECT",
            notes: admin.reason,
          },
        },
      }
    );

    await auditCol.insertOne({
      id: crypto.randomUUID(),
      submissionId,
      action: "REJECTED",
      adminId: admin.adminId,
      adminEmail: admin.adminEmail,
      timestamp: now,
      notes: admin.reason,
      recordSnapshot: submission as unknown as Record<string, unknown>,
    });

    return true;
  } catch (error) {
    console.error("Failed to reject university submission in MongoDB Atlas:", error);
    return false;
  }
}

export async function getPendingSubmissions(institutionId?: string): Promise<UniversitySubmission[]> {
  const database = await getMongoDb();
  if (!database) return [];

  try {
    const col: Collection<UniversitySubmission> = database.collection("university_submissions");
    const query = {
      status: "PENDING_ADMIN_APPROVAL" as const,
      ...(institutionId ? { institutionId } : {}),
    };
    return await col.find(query).sort({ submittedAt: -1 }).toArray();
  } catch {
    return [];
  }
}

export async function getVaultRecords(institutionId?: string, limit = 50): Promise<ApprovedVaultRecord[]> {
  const database = await getMongoDb();
  if (!database) return [];

  try {
    const col: Collection<ApprovedVaultRecord> = database.collection("approved_vault_records");
    const query = institutionId ? { institutionId } : {};
    return await col.find(query).sort({ approvedAt: -1 }).limit(limit).toArray();
  } catch {
    return [];
  }
}

export async function getVaultRecordById(id: string): Promise<ApprovedVaultRecord | null> {
  const database = await getMongoDb();
  if (!database) return null;
  try {
    const col: Collection<ApprovedVaultRecord> = database.collection("approved_vault_records");
    return await col.findOne({ $or: [{ id }, { submissionId: id }] });
  } catch {
    return null;
  }
}

export async function createVaultRecord(
  data: {
    recordType: SubmissionType;
    institutionId: string;
    institutionName?: string;
    payload: Record<string, unknown>;
    documentSha256?: string;
    credentialSha256?: string;
    blockchainAnchor?: {
      tokenId?: string;
      transactionHash?: string;
      chainId?: number;
      contractAddress?: string;
    };
  },
  admin: { adminId: string; adminEmail?: string; notes?: string }
): Promise<ApprovedVaultRecord | null> {
  const database = await getMongoDb();
  if (!database) return null;

  try {
    const vaultCol: Collection<ApprovedVaultRecord> = database.collection("approved_vault_records");
    const auditCol = database.collection("admin_approval_audit");
    const now = new Date();
    const id = crypto.randomUUID();

    const record: ApprovedVaultRecord = {
      id,
      submissionId: id,
      recordType: data.recordType,
      institutionId: data.institutionId,
      institutionName: data.institutionName,
      approvedBy: admin.adminId,
      approvedAt: now,
      payload: data.payload,
      documentSha256: data.documentSha256,
      credentialSha256: data.credentialSha256,
      blockchainAnchor: data.blockchainAnchor,
    };

    await vaultCol.insertOne(record);
    await auditCol.insertOne({
      id: crypto.randomUUID(),
      submissionId: id,
      action: "APPROVED",
      adminId: admin.adminId,
      adminEmail: admin.adminEmail,
      timestamp: now,
      notes: admin.notes || "Direct administrative creation in MongoDB Atlas",
      recordSnapshot: record as unknown as Record<string, unknown>,
    });

    return record;
  } catch (error) {
    console.error("Failed to create vault record in MongoDB Atlas:", error);
    return null;
  }
}

export async function updateVaultRecord(
  id: string,
  updates: {
    institutionName?: string;
    payload?: Record<string, unknown>;
    documentSha256?: string;
    credentialSha256?: string;
    blockchainAnchor?: {
      tokenId?: string;
      transactionHash?: string;
      chainId?: number;
      contractAddress?: string;
    };
  },
  admin: { adminId: string; adminEmail?: string; notes?: string }
): Promise<ApprovedVaultRecord | null> {
  const database = await getMongoDb();
  if (!database) return null;

  try {
    const vaultCol: Collection<ApprovedVaultRecord> = database.collection("approved_vault_records");
    const auditCol = database.collection("admin_approval_audit");

    const existing = await vaultCol.findOne({ $or: [{ id }, { submissionId: id }] });
    if (!existing) return null;

    const updatedRecord: ApprovedVaultRecord = {
      ...existing,
      ...updates,
      payload: updates.payload ? { ...existing.payload, ...updates.payload } : existing.payload,
    };

    await vaultCol.updateOne(
      { _id: existing._id },
      {
        $set: {
          institutionName: updatedRecord.institutionName,
          payload: updatedRecord.payload,
          documentSha256: updatedRecord.documentSha256,
          credentialSha256: updatedRecord.credentialSha256,
          blockchainAnchor: updatedRecord.blockchainAnchor,
        },
      }
    );

    const now = new Date();
    await auditCol.insertOne({
      id: crypto.randomUUID(),
      submissionId: existing.id,
      action: "APPROVED",
      adminId: admin.adminId,
      adminEmail: admin.adminEmail,
      timestamp: now,
      notes: admin.notes || "Administrative update to vault record",
      recordSnapshot: updatedRecord as unknown as Record<string, unknown>,
    });

    return updatedRecord;
  } catch (error) {
    console.error("Failed to update vault record in MongoDB Atlas:", error);
    return null;
  }
}

export async function deleteVaultRecord(
  id: string,
  admin: { adminId: string; adminEmail?: string; reason?: string }
): Promise<boolean> {
  const database = await getMongoDb();
  if (!database) return false;

  try {
    const vaultCol: Collection<ApprovedVaultRecord> = database.collection("approved_vault_records");
    const auditCol = database.collection("admin_approval_audit");

    const existing = await vaultCol.findOne({ $or: [{ id }, { submissionId: id }] });
    if (!existing) return false;

    await vaultCol.deleteOne({ _id: existing._id });

    const now = new Date();
    await auditCol.insertOne({
      id: crypto.randomUUID(),
      submissionId: existing.id,
      action: "REJECTED",
      adminId: admin.adminId,
      adminEmail: admin.adminEmail,
      timestamp: now,
      notes: admin.reason || "Administrative record deletion from MongoDB Atlas",
      recordSnapshot: existing as unknown as Record<string, unknown>,
    });

    return true;
  } catch (error) {
    console.error("Failed to delete vault record in MongoDB Atlas:", error);
    return false;
  }
}

export async function getVaultStats(): Promise<{
  configured: boolean;
  connected: boolean;
  cluster: string | null;
  dbName: string;
  pendingCount: number;
  approvedCount: number;
}> {
  const configured = isMongoConfigured();
  const dbName = process.env.MONGODB_DB_NAME || "acadshield_vault";
  const rawUri = process.env.MONGODB_URI || "";
  const clusterMatch = rawUri.match(/@([^/?]+)/);
  const cluster = clusterMatch ? clusterMatch[1] : (configured ? "atlas-cluster" : null);

  if (!configured) return { configured: false, connected: false, cluster: null, dbName, pendingCount: 0, approvedCount: 0 };

  const database = await getMongoDb();
  if (!database) return { configured: true, connected: false, cluster, dbName, pendingCount: 0, approvedCount: 0 };

  try {
    const submissionsCol = database.collection("university_submissions");
    const vaultCol = database.collection("approved_vault_records");

    const [pendingCount, approvedCount] = await Promise.all([
      submissionsCol.countDocuments({ status: "PENDING_ADMIN_APPROVAL" }),
      vaultCol.countDocuments(),
    ]);

    return { configured: true, connected: true, cluster, dbName, pendingCount, approvedCount };
  } catch {
    return { configured: true, connected: false, cluster, dbName, pendingCount: 0, approvedCount: 0 };
  }
}
