"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  FileCheck2,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Building2,
  Briefcase
} from "lucide-react";

export default function AdminVerificationsPage() {
  const { verifications } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");

  const filteredVerifs = verifications.filter((v) => {
    const matchesSearch =
      v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.universityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResult = resultFilter === "ALL" || v.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-xs font-semibold text-red-900 mb-2">
          <FileCheck2 className="w-3.5 h-3.5 text-red-600" />
          Cross-Enterprise Verifications Ledger
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Platform Verification Requests
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Superadmin log of all verification attempts, cryptographic comparisons, and background checks performed by corporate verifiers.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur border border-forest/15 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-forest/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, candidate, or document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-forest/20 bg-forest/5 focus:outline-none focus:border-forest text-forest font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "VERIFIED", "HASH_MISMATCH"].map((f) => (
            <button
              key={f}
              onClick={() => setResultFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                resultFilter === f
                  ? "bg-forest text-white"
                  : "bg-forest/5 text-forest/70 hover:bg-forest/10"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-forest/15 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest/5 border-b border-forest/10 font-bold uppercase text-[10px] text-forest/70 tracking-wider">
              <tr>
                <th className="py-3 px-4">Corporate Verifier</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Issuing University</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Verification Time</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filteredVerifs.map((v) => (
                <tr key={v.id} className="hover:bg-forest/[0.02] transition">
                  <td className="py-3.5 px-4 font-bold text-forest">{v.companyName}</td>
                  <td className="py-3.5 px-4 font-semibold text-forest/85">{v.candidateName}</td>
                  <td className="py-3.5 px-4 text-forest/80">{v.documentType}</td>
                  <td className="py-3.5 px-4 text-forest/70">{v.universityName}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.result === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {v.result}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-forest/60">{new Date(v.verificationTime).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/company/verifications/${v.id}`}
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
