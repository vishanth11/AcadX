"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldCheck,
  RefreshCw,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Building2,
  Award,
  Layers,
  Search,
  Check,
  Copy,
  Info,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";

type VaultStatus = {
  configured: boolean;
  connected: boolean;
  cluster: string | null;
  dbName: string;
  pendingCount: number;
  approvedCount: number;
  timestamp: string;
};

type UniversitySubmission = {
  id: string;
  type: string;
  institutionId: string;
  institutionName?: string;
  submittedBy: string;
  status: "PENDING_ADMIN_APPROVAL" | "APPROVED" | "REJECTED";
  submittedAt: string;
  documentSha256?: string;
  credentialSha256?: string;
  payload: {
    documentId?: string;
    credentialId?: string;
    fileName?: string;
    mediaType?: string;
    sizeBytes?: number;
    documentType?: string;
    holderReference?: string | null;
    studentName?: string | null;
    studentEmail?: string | null;
    studentWallet?: string | null;
    ipfsCid?: string | null;
    metadataUri?: string | null;
    analysis?: Record<string, unknown>;
    sourceVerification?: Record<string, unknown>;
  };
};

type ApprovedVaultRecord = {
  id: string;
  submissionId: string;
  recordType: string;
  institutionId: string;
  institutionName?: string;
  approvedBy: string;
  approvedAt: string;
  documentSha256?: string;
  credentialSha256?: string;
  blockchainAnchor?: {
    tokenId?: string;
    transactionHash?: string;
    chainId?: number;
    contractAddress?: string;
  };
  payload: Record<string, unknown>;
};

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function MongoVaultAdminPage() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [pending, setPending] = useState<UniversitySubmission[]>([]);
  const [vaultRecords, setVaultRecords] = useState<ApprovedVaultRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "records">("records");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ApprovedVaultRecord | null>(null);

  // CRUD Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fileName: "",
    documentType: "DEGREE_CERTIFICATE",
    institutionName: "CIT",
    institutionId: "26d06b02-76fa-40dd-b00f-c5db909aa4b6",
    studentName: "",
    holderReference: "",
    notes: "",
  });

  const [editRecord, setEditRecord] = useState<ApprovedVaultRecord | null>(null);
  const [editForm, setEditForm] = useState({
    institutionName: "",
    fileName: "",
    studentName: "",
    holderReference: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, pendingRes, recordsRes] = await Promise.all([
        fetch(`${apiBase}/admin/vault/status`, { credentials: "include" }),
        fetch(`${apiBase}/admin/vault/pending`, { credentials: "include" }),
        fetch(`${apiBase}/admin/vault/records`, { credentials: "include" }),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPending(pendingData.pending || []);
      }
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        setVaultRecords(recordsData.records || []);
      }
    } catch {
      setMessage({ text: "Could not communicate with the backend vault API.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // CREATE (CRUD: Create)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId("create");
    setMessage(null);
    try {
      const generatedSha = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const res = await fetch(`${apiBase}/admin/vault/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recordType: "SOURCE_DOCUMENT",
          institutionId: createForm.institutionId,
          institutionName: createForm.institutionName,
          documentSha256: generatedSha,
          credentialSha256: generatedSha,
          notes: createForm.notes || "Direct administrative creation in MongoDB Atlas",
          payload: {
            fileName: createForm.fileName || "Academic Record.pdf",
            documentType: createForm.documentType,
            studentName: createForm.studentName || undefined,
            holderReference: createForm.holderReference || undefined,
            verifiedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Creation failed");

      setMessage({ text: "New record successfully stored into MongoDB Atlas Vault!", type: "success" });
      setIsCreateOpen(false);
      setCreateForm({
        fileName: "",
        documentType: "DEGREE_CERTIFICATE",
        institutionName: "CIT",
        institutionId: "26d06b02-76fa-40dd-b00f-c5db909aa4b6",
        studentName: "",
        holderReference: "",
        notes: "",
      });
      await fetchData();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Creation error", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  // UPDATE (CRUD: Update)
  const handleEditOpen = (record: ApprovedVaultRecord) => {
    setEditRecord(record);
    const payload = (record.payload || {}) as any;
    setEditForm({
      institutionName: record.institutionName || "",
      fileName: payload.fileName || "",
      studentName: payload.studentName || "",
      holderReference: payload.holderReference || "",
      notes: "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    setProcessingId(editRecord.id);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/vault/records/${editRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          institutionName: editForm.institutionName,
          notes: editForm.notes || "Admin updated vault details",
          payload: {
            fileName: editForm.fileName,
            studentName: editForm.studentName,
            holderReference: editForm.holderReference,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setMessage({ text: "Record updated in MongoDB Atlas successfully!", type: "success" });
      setEditRecord(null);
      await fetchData();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Update error", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  // DELETE (CRUD: Delete)
  const handleDelete = async (recordId: string) => {
    if (!confirm("Are you sure you want to permanently delete this record from MongoDB Atlas? This action is audited.")) {
      return;
    }
    const reason = prompt("Enter deletion reason:") || "Admin manual deletion";
    setProcessingId(recordId);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/vault/records/${recordId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed");

      setMessage({ text: "Record deleted from MongoDB Atlas Vault.", type: "success" });
      await fetchData();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Deletion error", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  // APPROVE (Workflow Gate)
  const handleApprove = async (submissionId: string) => {
    setProcessingId(submissionId);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/vault/${submissionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: "Admin approved university submission for MongoDB Atlas storage" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setMessage({ text: "Submission approved and permanently vaulted into MongoDB Atlas!", type: "success" });
      await fetchData();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to approve submission", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  // REJECT (Workflow Gate)
  const handleReject = async (submissionId: string) => {
    const reason = prompt("Please enter the reason for rejection:") || "Rejected by administrator";
    setProcessingId(submissionId);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/admin/vault/${submissionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setMessage({ text: "Submission rejected and audit log updated.", type: "success" });
      await fetchData();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to reject submission", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredPending = pending.filter((item) => {
    const query = searchTerm.toLowerCase();
    const docName = item.payload?.fileName?.toLowerCase() || "";
    const uniName = item.institutionName?.toLowerCase() || "";
    const hash = item.documentSha256?.toLowerCase() || "";
    const ref = item.payload?.holderReference?.toLowerCase() || "";
    return docName.includes(query) || uniName.includes(query) || hash.includes(query) || ref.includes(query);
  });

  const filteredRecords = vaultRecords.filter((item) => {
    const query = searchTerm.toLowerCase();
    const uniName = item.institutionName?.toLowerCase() || "";
    const hash = item.documentSha256?.toLowerCase() || "";
    const id = item.id.toLowerCase();
    const fileName = (item.payload as any)?.fileName?.toLowerCase() || "";
    return uniName.includes(query) || hash.includes(query) || id.includes(query) || fileName.includes(query);
  });

  return (
    <main className="mx-auto max-w-7xl space-y-7 px-5 py-7 sm:px-8">
      {/* Top Header */}
      <header className="relative overflow-hidden rounded-3xl bg-forest p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[32px] border-white/5" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/85">
              <Database className="h-3.5 w-3.5 text-ochre" />
              MongoDB Atlas Cloud Vault & CRUD Operations
            </div>
            <h1 className="mt-4 font-serif text-3xl font-extrabold tracking-tight sm:text-4xl">
              University Submissions & Cloud Vault
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
              Strict Admin Approval Gate & Full CRUD Management: University records are held in staging and permanently preserved in MongoDB Atlas once approved.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-ochre px-4 py-2.5 text-sm font-bold text-forest shadow-sm transition hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              Create Vault Record
            </button>
            <button
              onClick={() => void fetchData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white px-4 py-2.5 text-sm font-bold text-forest shadow-sm transition hover:bg-amber-50 disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh Vault"}
            </button>
          </div>
        </div>

        {/* MongoDB Status Banner */}
        <div className="relative mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-4 text-xs text-white/80">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status?.connected ? "bg-emerald-400 animate-pulse" : status?.configured ? "bg-amber-400" : "bg-red-400"
              }`}
            />
            <span className="font-semibold">
              MongoDB Atlas:{" "}
              {status?.connected
                ? `Connected (${status.cluster || "Cluster"})`
                : status?.configured
                ? `Awaiting IP Access (${status.cluster || "acadx.ugkz7f1.mongodb.net"})`
                : "URI Config Needed in .env"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-white/60" />
            <span>Database: <strong className="text-white">{status?.dbName || "acadshield_vault"}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-white/60" />
            <span>Pending Gate: <strong className="text-amber-300">{pending.length}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-white/60" />
            <span>Vaulted Records: <strong className="text-emerald-300">{vaultRecords.length}</strong></span>
          </div>
        </div>
      </header>

      {/* Atlas Network Access Warning / Instruction Banner */}
      {status && !status.connected && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-950 flex items-start gap-4 shadow-sm">
          <AlertTriangle className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-sm">
            <p className="font-bold text-amber-900 text-base">
              MongoDB Atlas Action Required: Whitelist Your Current IP Address
            </p>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              MongoDB Atlas blocked the connection with <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono text-[11px]">SSL alert number 80 / TLSV1_ALERT_INTERNAL_ERROR</code> because your current IP address is not on Atlas&apos;s Network Access list.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://cloud.mongodb.com/v2"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-900 shadow-sm"
              >
                Go to MongoDB Atlas Console <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="text-xs text-amber-800">
                Click <strong>&ldquo;Add Current IP Address&rdquo;</strong> (or in <strong>Network Access</strong> add <code className="font-mono font-bold bg-amber-200 px-1 rounded">0.0.0.0/0</code>)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {message && (
        <div
          role="alert"
          className={`flex items-center justify-between rounded-2xl p-4 text-sm ${
            message.type === "success"
              ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
              : message.type === "warning"
              ? "border border-amber-300 bg-amber-50 text-amber-900"
              : "border border-red-300 bg-red-50 text-red-900"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-forest/15 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === "records"
                ? "bg-forest text-white shadow-sm"
                : "bg-white text-forest/70 hover:bg-forest/5"
            }`}
          >
            <Database className="h-4 w-4" />
            MongoDB Atlas Records (CRUD)
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === "records" ? "bg-emerald-300 text-emerald-950 font-black" : "bg-forest/10 text-forest font-bold"
              }`}
            >
              {vaultRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === "pending"
                ? "bg-forest text-white shadow-sm"
                : "bg-white text-forest/70 hover:bg-forest/5"
            }`}
          >
            <Clock3 className="h-4 w-4" />
            Pending Approval Queue
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === "pending" ? "bg-ochre text-forest font-black" : "bg-forest/10 text-forest font-bold"
              }`}
            >
              {pending.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-forest/40" />
          <input
            type="text"
            placeholder="Search university, hash, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-forest/20 bg-white py-2 pl-9 pr-4 text-xs text-forest placeholder:text-forest/40 focus:border-forest focus:outline-none"
          />
        </div>
      </div>

      {/* TAB: MONGODB ATLAS RECORDS (CRUD) */}
      {activeTab === "records" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-forest/60 px-1">
            <span>Showing {filteredRecords.length} records archived in MongoDB Atlas</span>
            <span className="font-semibold text-forest/80">Full CRUD: Create, Read, Update, Delete supported</span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-forest/10 bg-white p-12 text-center shadow-sm">
              <Database className="mx-auto h-12 w-12 text-forest/30" />
              <h3 className="mt-3 text-lg font-bold text-forest">No Records in MongoDB Atlas Vault Yet</h3>
              <p className="mt-1 text-sm text-forest/60 max-w-md mx-auto">
                Approve pending university submissions or click <strong>&ldquo;Create Vault Record&rdquo;</strong> above to insert new records directly into your MongoDB Atlas cluster.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRecords.map((rec) => {
                const payload = (rec.payload || {}) as any;
                return (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm transition hover:border-forest/25"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                            Stored in Atlas
                          </span>
                          <span className="rounded-full bg-forest/5 px-2.5 py-0.5 text-[10px] font-bold text-forest/70">
                            ID: {rec.id.slice(0, 8)}...
                          </span>
                          <span className="text-xs text-forest/50">
                            Approved {new Date(rec.approvedAt).toLocaleString()}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-forest flex items-center gap-2">
                          <Award className="h-4 w-4 text-emerald-600 shrink-0" />
                          {payload.fileName || rec.institutionName || "Verified Academic Credential"}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-forest/70">
                          <span>
                            <strong>Institution:</strong> {rec.institutionName || "CIT University"}
                          </span>
                          {payload.studentName && (
                            <span>
                              <strong>Student:</strong> {payload.studentName}
                            </span>
                          )}
                          {payload.holderReference && (
                            <span>
                              <strong>Ref:</strong> {payload.holderReference}
                            </span>
                          )}
                          <span>
                            <strong>Approved By:</strong> {rec.approvedBy}
                          </span>
                          {rec.blockchainAnchor?.tokenId && (
                            <span className="rounded bg-violet-50 px-2 py-0.5 font-bold text-violet-800">
                              On-Chain NFT #{rec.blockchainAnchor.tokenId}
                            </span>
                          )}
                        </div>

                        {/* SHA-256 */}
                        {rec.documentSha256 && (
                          <div className="flex items-center gap-2 font-mono text-[11px] text-forest/60">
                            <span>SHA-256:</span>
                            <span className="bg-forest/5 px-2 py-0.5 rounded truncate max-w-xs sm:max-w-md">
                              {rec.documentSha256}
                            </span>
                            <button
                              onClick={() => copyToClipboard(rec.documentSha256!)}
                              className="text-forest/40 hover:text-forest transition"
                              title="Copy Hash"
                            >
                              {copiedHash === rec.documentSha256 ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* CRUD Actions */}
                      <div className="shrink-0 flex items-center gap-2 pt-2 lg:pt-0">
                        <button
                          onClick={() => handleEditOpen(rec)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-forest/20 px-3 py-2 text-xs font-bold text-forest hover:bg-forest/5 transition"
                          title="Update Record in MongoDB Atlas"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="rounded-xl border border-forest/20 px-3 py-2 text-xs font-bold text-forest hover:bg-forest/5 transition"
                        >
                          Inspect
                        </button>

                        <button
                          onClick={() => handleDelete(rec.id)}
                          disabled={processingId === rec.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                          title="Delete from MongoDB Atlas"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB: PENDING APPROVAL QUEUE */}
      {activeTab === "pending" && (
        <section className="space-y-4">
          {filteredPending.length === 0 ? (
            <div className="rounded-2xl border border-forest/10 bg-white p-12 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-3 text-lg font-bold text-forest">No Pending University Submissions</h3>
              <p className="mt-1 text-sm text-forest/60 max-w-md mx-auto">
                All submitted documents and credentials have been approved. New uploads from registered universities will appear here for admin review.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPending.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm transition hover:border-forest/25 hover:shadow-md"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                          {item.type.replace(/_/g, " ")}
                        </span>
                        <span className="rounded-full bg-forest/5 px-2.5 py-0.5 text-[10px] font-bold text-forest/70">
                          ID: {item.id.slice(0, 8)}...
                        </span>
                        <span className="text-xs text-forest/50">
                          Submitted {new Date(item.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-forest flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-ochre shrink-0" />
                        {item.payload?.fileName || "University Academic Document"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-forest/70">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-forest/50" />
                          <strong>University:</strong> {item.institutionName || "CIT University"}
                        </span>
                        {item.payload?.studentName && (
                          <span>
                            <strong>Student:</strong> {item.payload.studentName}
                          </span>
                        )}
                        {item.payload?.holderReference && (
                          <span>
                            <strong>Reg No:</strong> {item.payload.holderReference}
                          </span>
                        )}
                      </div>

                      {/* SHA-256 Digest */}
                      {item.documentSha256 && (
                        <div className="flex items-center gap-2 font-mono text-[11px] text-forest/60">
                          <span>SHA-256:</span>
                          <span className="bg-forest/5 px-2 py-0.5 rounded truncate max-w-xs sm:max-w-md">
                            {item.documentSha256}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                      <button
                        onClick={() => handleApprove(item.id)}
                        disabled={processingId === item.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-forest/90 disabled:opacity-50"
                      >
                        <ShieldCheck className="h-4 w-4 text-emerald-300" />
                        {processingId === item.id ? "Vaulting to Atlas..." : "Approve & Vault in Atlas"}
                      </button>

                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={processingId === item.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CREATE MODAL (CRUD: Create) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-forest/10 px-6 py-4">
              <h3 className="font-bold text-forest flex items-center gap-2">
                <Plus className="h-4 w-4 text-ochre" />
                Create New MongoDB Atlas Record
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1.5 hover:bg-forest/5 text-forest/50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-forest mb-1">Document / Credential Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech Computer Science Degree"
                  value={createForm.fileName}
                  onChange={(e) => setCreateForm({ ...createForm, fileName: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">Institution Name</label>
                  <input
                    type="text"
                    value={createForm.institutionName}
                    onChange={(e) => setCreateForm({ ...createForm, institutionName: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">Document Type</label>
                  <select
                    value={createForm.documentType}
                    onChange={(e) => setCreateForm({ ...createForm, documentType: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none bg-white"
                  >
                    <option value="DEGREE_CERTIFICATE">Degree Certificate</option>
                    <option value="TRANSCRIPT">Official Transcript</option>
                    <option value="DIPLOMA">Diploma Certificate</option>
                    <option value="MARKSHEET">Consolidated Marksheet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">Student Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vishanth"
                    value={createForm.studentName}
                    onChange={(e) => setCreateForm({ ...createForm, studentName: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">Student / Registration No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 71762205001"
                    value={createForm.holderReference}
                    onChange={(e) => setCreateForm({ ...createForm, holderReference: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-forest mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional verification remarks..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-forest/20 px-4 py-2 text-xs font-bold text-forest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === "create"}
                  className="rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest/90 disabled:opacity-50"
                >
                  {processingId === "create" ? "Writing to Atlas..." : "Save into MongoDB Atlas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL (CRUD: Update) */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-forest/10 px-6 py-4">
              <h3 className="font-bold text-forest flex items-center gap-2">
                <Pencil className="h-4 w-4 text-ochre" />
                Update MongoDB Atlas Record
              </h3>
              <button
                onClick={() => setEditRecord(null)}
                className="rounded-lg p-1.5 hover:bg-forest/5 text-forest/50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-forest mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={editForm.fileName}
                  onChange={(e) => setEditForm({ ...editForm, fileName: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-forest mb-1">Institution Name</label>
                <input
                  type="text"
                  value={editForm.institutionName}
                  onChange={(e) => setEditForm({ ...editForm, institutionName: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">Student Name</label>
                  <input
                    type="text"
                    value={editForm.studentName}
                    onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-forest mb-1">Registration Reference</label>
                  <input
                    type="text"
                    value={editForm.holderReference}
                    onChange={(e) => setEditForm({ ...editForm, holderReference: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-forest mb-1">Update Notes (Audit Trail)</label>
                <input
                  type="text"
                  placeholder="Reason for modification..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3 py-2 text-xs focus:border-forest focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditRecord(null)}
                  className="rounded-xl border border-forest/20 px-4 py-2 text-xs font-bold text-forest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === editRecord.id}
                  className="rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest/90 disabled:opacity-50"
                >
                  {processingId === editRecord.id ? "Updating Atlas..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payload Inspection Modal (CRUD: Read single) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-forest/10 px-6 py-4">
              <h3 className="font-bold text-forest flex items-center gap-2">
                <Database className="h-4 w-4 text-ochre" />
                MongoDB Atlas Document Payload & Audit
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 hover:bg-forest/5 text-forest/50 hover:text-forest"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-forest/80 bg-forest/5 space-y-2">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>
            <div className="border-t border-forest/10 px-6 py-3 bg-white text-right">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
