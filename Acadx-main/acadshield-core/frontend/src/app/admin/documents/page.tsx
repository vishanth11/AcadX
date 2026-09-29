"use client";

import React, { useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import { usePlatformState } from "@/lib/platform-state";
import {
  FileCheck2,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Building2,
  Binary
} from "lucide-react";

export default function AdminDocumentsPage() {
  const { documents } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = documents.filter(
    (d) =>
      d.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.universityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.sha256Hash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="ADMIN" />

      {/* Header */}
      <section className="border-b border-forest/10 bg-white/70 backdrop-blur px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-3">
              <FileCheck2 className="w-3.5 h-3.5 text-ochre" />
              Platform-Wide Universal Document Registry
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">
              Global Academic Document Ledger
            </h1>
            <p className="mt-1 text-forest/75 text-sm max-w-xl">
              Centralized inspection of all academic records registered by accredited universities across the trust network.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
        {/* Search */}
        <div className="bg-white border border-forest/10 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, issuing university, doc type, or SHA-256..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-forest/20 bg-forest/5 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
            />
          </div>
          <span className="text-xs font-bold text-forest/60">
            {filtered.length} Authoritative Records
          </span>
        </div>

        {/* Global Documents Table */}
        <div className="bg-white border border-forest/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-forest/5 border-b border-forest/10 text-forest/70 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Document & Student</th>
                  <th className="py-3.5 px-6">Issuing University</th>
                  <th className="py-3.5 px-6">SHA-256 Document Fingerprint</th>
                  <th className="py-3.5 px-6">IPFS & Storage</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-forest/5 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-forest text-sm">{doc.documentType}</div>
                      <div className="text-forest/70 font-medium">{doc.studentName}</div>
                      <div className="font-mono text-[10px] text-forest/40">
                        Doc #: {doc.documentNumber} • ID: {doc.id}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-forest">{doc.universityName}</div>
                      <div className="text-forest/50 text-[10px]">{doc.uploadedBy}</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-forest/90 bg-forest/5 px-2 py-1 rounded border border-forest/10 max-w-xs truncate">
                        <span className="truncate">{doc.sha256Hash}</span>
                        <button
                          onClick={() => copyHash(doc.sha256Hash, doc.id)}
                          className="text-forest/60 hover:text-ochre shrink-0 p-0.5"
                          title="Copy SHA-256 Fingerprint"
                        >
                          {copiedId === doc.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-mono text-[10px] text-forest/60">
                        {doc.ipfsCid.slice(0, 16)}...
                      </div>
                      <div className="text-[10px] text-forest/40">
                        {doc.fileName} ({doc.fileSize})
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          doc.status === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800"
                            : doc.status === "REVOKED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {doc.status === "VERIFIED" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            VERIFIED
                          </>
                        ) : doc.status === "REVOKED" ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            REVOKED
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            PENDING
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        href="/company/verify/document"
                        className="px-2.5 py-1.5 rounded-lg bg-forest/5 hover:bg-forest/10 border border-forest/10 text-forest font-bold text-[11px] transition"
                      >
                        Test Hash
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
