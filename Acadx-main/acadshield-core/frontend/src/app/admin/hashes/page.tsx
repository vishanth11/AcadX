"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  Binary,
  Search,
  Copy,
  CheckCircle2,
  FileCheck2,
  Building2,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function AdminHashesPage() {
  const { documents } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredDocs = documents.filter(
    (d) =>
      d.sha256Hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.universityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-xs font-semibold text-red-900 mb-2">
          <Binary className="w-3.5 h-3.5 text-red-600" />
          Cryptographic Integrity Registry
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Document Hashes (SHA-256)
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Superadmin registry of all authoritative document digests registered by accredited universities across the AcadShield X network.
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur border border-forest/15 p-4 rounded-2xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-forest/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SHA-256 fingerprint, student, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-forest/20 bg-forest/5 focus:outline-none focus:border-forest text-forest font-medium"
          />
        </div>
      </div>

      <div className="bg-white border border-forest/15 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest/5 border-b border-forest/10 font-bold uppercase text-[10px] text-forest/70 tracking-wider">
              <tr>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Issuing University</th>
                <th className="py-3 px-4">SHA-256 Fingerprint</th>
                <th className="py-3 px-4">IPFS CID</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filteredDocs.map((d) => (
                <tr key={d.id} className="hover:bg-forest/[0.02] transition">
                  <td className="py-3.5 px-4 font-bold text-forest">
                    <div>{d.documentType}</div>
                    <span className="text-[10px] text-forest/50 font-mono">{d.documentNumber}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-forest/80">{d.studentName}</td>
                  <td className="py-3.5 px-4 text-forest/70">{d.universityName}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-forest/60">
                    <div className="flex items-center gap-1.5">
                      <span>{d.sha256Hash.substring(0, 16)}...</span>
                      <button
                        onClick={() => copyHash(d.sha256Hash, d.id)}
                        className="text-forest/40 hover:text-forest"
                        title="Copy SHA-256"
                      >
                        {copiedHash === d.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-forest/60 truncate max-w-[120px]">
                    {d.ipfsCid}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/university/documents/${d.id}`}
                      className="px-2.5 py-1 rounded bg-forest/10 hover:bg-forest text-forest hover:text-white font-bold text-[11px] transition inline-flex items-center gap-1"
                    >
                      Dossier <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
