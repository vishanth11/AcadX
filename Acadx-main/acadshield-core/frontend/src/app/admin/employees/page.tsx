"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  Briefcase,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  Users
} from "lucide-react";

export default function AdminEmployeesPage() {
  const { candidates } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.targetRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.institution.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-xs font-semibold text-red-900 mb-2">
          <Briefcase className="w-3.5 h-3.5 text-red-600" />
          Enterprise Screening Ledger
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Candidate & Employee Verifications
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Superadmin registry of all candidate verification workflows across corporate verifiers and enterprises.
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur border border-forest/15 p-4 rounded-2xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-forest/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates, target roles, or institutions..."
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
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Target Role</th>
                <th className="py-3 px-4">Educational Institution</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4">Document Hash Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-forest/[0.02] transition">
                  <td className="py-3.5 px-4 font-bold text-forest">
                    <div>{c.name}</div>
                    <span className="text-[10px] text-forest/50 font-mono">{c.did.substring(0, 20)}...</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-forest">{c.targetRole}</td>
                  <td className="py-3.5 px-4 text-forest/80">{c.institution}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.verificationStatus === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.verificationStatus === "HASH_MISMATCH"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] text-forest/70 font-semibold">{c.documentStatus}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/company/candidates/${c.id}`}
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
