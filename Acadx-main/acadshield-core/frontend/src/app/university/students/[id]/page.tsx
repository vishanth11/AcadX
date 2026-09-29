"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePlatformState } from "@/lib/platform-state";
import {
  Users,
  GraduationCap,
  FileCheck2,
  Award,
  Binary,
  History,
  QrCode,
  ShieldCheck,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
  Upload,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Share2
} from "lucide-react";

export default function UniversityStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;
  const { students, documents, credentials, verifications, auditLogs } = usePlatformState();

  const [activeTab, setActiveTab] = useState<"DOCS" | "CREDS" | "NFTS" | "VERIFICATIONS" | "AUDIT">("DOCS");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const student = students.find((s) => s.id === studentId) || students[0];

  const studentDocs = documents.filter((d) => d.studentId === student.id || d.studentName === student.name);
  const studentCreds = credentials.filter((c) => c.studentName === student.name);
  const studentVerifs = verifications.filter((v) => v.candidateName === student.name);
  const studentAudit = auditLogs.filter((a) => a.details.includes(student.name) || a.entityId === student.id);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/university/students"
          className="inline-flex items-center gap-2 text-xs font-semibold text-forest/70 hover:text-forest transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Students Roster
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/student/passport`}
            target="_blank"
            className="px-3 py-1.5 rounded-xl border border-forest/20 text-xs font-semibold hover:bg-forest/5 flex items-center gap-1.5 text-forest"
          >
            <Share2 className="w-3.5 h-3.5 text-ochre" />
            View Student Passport
          </Link>
          <Link
            href={`/university/documents/upload?studentId=${student.id}`}
            className="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest/90 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-ochre" />
            Upload Document
          </Link>
        </div>
      </div>

      {/* Student Profile Banner */}
      <div className="bg-white/80 backdrop-blur border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest text-ochre font-serif text-2xl flex items-center justify-center font-bold border border-ochre/30 shadow">
              {student.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-forest tracking-tight">
                  {student.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-900 uppercase">
                  {student.status}
                </span>
              </div>
              <p className="text-forest/70 text-xs font-medium">
                {student.program}   {student.department}   Class of {student.year}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-forest/60">DID:</span>
                <span className="text-[11px] font-mono font-medium text-forest bg-forest/5 px-2 py-0.5 rounded">
                  {student.did}
                </span>
                <button
                  onClick={() => copyToClipboard(student.did, "did")}
                  className="text-forest/40 hover:text-forest transition"
                  title="Copy DID"
                >
                  {copiedKey === "did" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-forest/10 pt-4 lg:pt-0 lg:pl-8 text-center">
            <div className="p-3 bg-forest/5 rounded-2xl">
              <span className="block text-2xl font-extrabold text-forest">{studentDocs.length}</span>
              <span className="text-[10px] text-forest/60 font-semibold uppercase">Documents</span>
            </div>
            <div className="p-3 bg-forest/5 rounded-2xl">
              <span className="block text-2xl font-extrabold text-forest">{studentCreds.length}</span>
              <span className="text-[10px] text-forest/60 font-semibold uppercase">Credentials</span>
            </div>
            <div className="p-3 bg-forest/5 rounded-2xl">
              <span className="block text-2xl font-extrabold text-forest">{studentVerifs.length}</span>
              <span className="text-[10px] text-forest/60 font-semibold uppercase">Verifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-forest/15 gap-2 overflow-x-auto pb-1">
        {[
          { key: "DOCS", label: `Academic Documents (${studentDocs.length})`, icon: FileCheck2 },
          { key: "CREDS", label: `Verifiable Credentials (${studentCreds.length})`, icon: Award },
          { key: "NFTS", label: "NFT & Blockchain Proofs", icon: Sparkles },
          { key: "VERIFICATIONS", label: `Verifier History (${studentVerifs.length})`, icon: ShieldCheck },
          { key: "AUDIT", label: "Lifecycle Audit Log", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition ${
                isActive
                  ? "border-forest text-forest bg-forest/5 rounded-t-xl"
                  : "border-transparent text-forest/60 hover:text-forest hover:border-forest/30"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-ochre" : "text-forest/40"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "DOCS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-forest">Registered Institutional Documents</h3>
            <Link
              href={`/university/documents/upload?studentId=${student.id}`}
              className="text-xs text-forest font-bold hover:underline flex items-center gap-1"
            >
              <Upload className="w-3 h-3 text-ochre" />
              Upload New Record
            </Link>
          </div>

          <div className="bg-white border border-forest/15 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-forest/5 border-b border-forest/10 font-bold uppercase text-[10px] text-forest/70 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Doc Number</th>
                    <th className="py-3 px-4">SHA-256 Fingerprint</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {studentDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-forest/50">
                        No authoritative documents registered yet for this student.
                      </td>
                    </tr>
                  ) : (
                    studentDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-forest/[0.02] transition">
                        <td className="py-3.5 px-4 font-bold text-forest flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{doc.documentType}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-forest/70">{doc.documentNumber}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-forest/60">
                          <span className="bg-forest/5 px-2 py-0.5 rounded">
                            {doc.sha256Hash.substring(0, 14)}...{doc.sha256Hash.substring(doc.sha256Hash.length - 8)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-forest/70">{doc.issueDate}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.status === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-800"
                                : doc.status === "REVOKED"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <Link
                            href={`/university/documents/${doc.id}`}
                            className="px-2.5 py-1 rounded bg-forest/10 hover:bg-forest text-forest hover:text-white font-bold text-[11px] transition"
                          >
                            Inspect Dossier
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "CREDS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-forest">Issued Verifiable Credentials (W3C Standard)</h3>
            <Link
              href={`/university/credentials/create?studentId=${student.id}`}
              className="text-xs text-forest font-bold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-ochre" />
              Issue New Credential
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentCreds.length === 0 ? (
              <div className="col-span-2 py-10 bg-white border border-forest/10 rounded-2xl text-center text-forest/50">
                No verifiable credentials issued yet.
              </div>
            ) : (
              studentCreds.map((cred) => (
                <div
                  key={cred.id}
                  className="bg-white border border-forest/15 rounded-2xl p-5 shadow-sm space-y-4 hover:border-forest/40 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-forest/50 uppercase tracking-widest font-bold">
                        {cred.id}
                      </span>
                      <h4 className="text-base font-extrabold text-forest mt-0.5">{cred.title}</h4>
                      <p className="text-xs text-forest/60">{cred.type}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cred.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {cred.status}
                    </span>
                  </div>

                  <div className="p-3 bg-forest/5 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-forest/60">ERC-721 Token:</span>
                      <span className="font-mono font-bold text-forest">#{cred.blockchain.tokenId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest/60">Network:</span>
                      <span className="font-semibold text-forest">{cred.blockchain.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forest/60">Issued On:</span>
                      <span className="text-forest">{cred.issueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-forest/10">
                    <Link
                      href={`/verify/${cred.id}`}
                      target="_blank"
                      className="text-xs font-bold text-forest/70 hover:text-forest flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3 text-ochre" />
                      Public Verification Link
                    </Link>
                    <Link
                      href={`/university/credentials/${cred.id}`}
                      className="px-3 py-1 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest/90 transition"
                    >
                      Inspect Credential
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "NFTS" && (
        <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-forest">Tokenized Academic Credentials (NFT ERC-721)</h3>
            <p className="text-xs text-forest/70">
              Polygon Amoy testnet tokens certifying non-fungible institutional provenance for this student.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentCreds.map((cred) => (
              <div key={cred.id} className="border border-forest/15 rounded-2xl p-5 bg-forest/[0.02] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-forest">Token ID #{cred.blockchain.tokenId}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                    ERC-721
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-forest/60 font-mono text-[11px]">
                    Contract: <span className="text-forest">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
                  </div>
                  <div className="text-forest/60 font-mono text-[11px]">
                    Tx Hash: <span className="text-forest">{cred.blockchain.txHash.substring(0, 20)}...</span>
                  </div>
                  <div className="text-forest/60">
                    Block Height: <strong className="text-forest">{cred.blockchain.blockNumber}</strong>
                  </div>
                </div>
                <a
                  href={`https://amoy.polygonscan.com/tx/${cred.blockchain.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-ochre hover:underline"
                >
                  Inspect on PolygonScan <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "VERIFICATIONS" && (
        <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-forest">Corporate Verification Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-forest/5 font-bold uppercase text-[10px] text-forest/70">
                <tr>
                  <th className="py-2.5 px-4">Verifier (Company)</th>
                  <th className="py-2.5 px-4">Document Type</th>
                  <th className="py-2.5 px-4">Verification Result</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {studentVerifs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-forest/50">
                      No corporate verifications recorded for this candidate yet.
                    </td>
                  </tr>
                ) : (
                  studentVerifs.map((verif) => (
                    <tr key={verif.id}>
                      <td className="py-3 px-4 font-bold text-forest">{verif.companyName}</td>
                      <td className="py-3 px-4">{verif.documentType}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            verif.result === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {verif.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-forest/60">{new Date(verif.verificationTime).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "AUDIT" && (
        <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-forest">Student Lifecycle Audit Trail</h3>
          <div className="space-y-3">
            {studentAudit.length === 0 ? (
              <p className="text-xs text-forest/50 py-4 text-center">No audit entries found.</p>
            ) : (
              studentAudit.map((log) => (
                <div key={log.id} className="p-3 bg-forest/5 rounded-xl flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-forest block">{log.action}</span>
                    <span className="text-forest/70">{log.details}</span>
                    <div className="text-[10px] text-forest/50 mt-1 font-mono">Actor: {log.actor} ({log.role})</div>
                  </div>
                  <span className="text-[10px] text-forest/50 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
