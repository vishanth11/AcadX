"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  Users,
  Search,
  Building2,
  FileCheck2,
  Award,
  ExternalLink,
  Copy,
  CheckCircle2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export default function AdminStudentsPage() {
  const { students, documents, credentials } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.did.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.universityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyDid = (did: string, id: string) => {
    navigator.clipboard.writeText(did);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-xs font-semibold text-red-900 mb-2">
          <Users className="w-3.5 h-3.5 text-red-600" />
          Universal Identity Ledger
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Universal Student DIDs
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Global index of self-sovereign student identities (W3C DID format) anchored across accredited higher education institutions.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white/70 backdrop-blur border border-forest/15 p-4 rounded-2xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-forest/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, DID, or university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-forest/20 bg-forest/5 focus:outline-none focus:border-forest text-forest placeholder:text-forest/40 font-medium"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-forest/15 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest/5 border-b border-forest/10 font-bold uppercase text-[10px] text-forest/70 tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Institutional Host</th>
                <th className="py-3 px-4">Decentralized Identifier (DID)</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filteredStudents.map((s) => {
                const docCount = documents.filter((d) => d.studentName === s.name).length;
                const credCount = credentials.filter((c) => c.studentName === s.name).length;
                return (
                  <tr key={s.id} className="hover:bg-forest/[0.02] transition">
                    <td className="py-3.5 px-4 font-bold text-forest">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-forest text-ochre font-serif flex items-center justify-center font-bold text-xs">
                          {s.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <span>{s.name}</span>
                          <span className="block text-[10px] text-forest/50 font-mono">{s.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-forest/80 font-medium">{s.universityName}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-forest/60">
                      <div className="flex items-center gap-1.5">
                        <span>{s.did.substring(0, 24)}...</span>
                        <button
                          onClick={() => copyDid(s.did, s.id)}
                          className="text-forest/40 hover:text-forest"
                          title="Copy DID"
                        >
                          {copiedId === s.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-forest/70">{s.program} ({s.year})</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold text-forest">
                        {docCount} Docs / {credCount} Creds
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/university/students/${s.id}`}
                        className="px-2.5 py-1 rounded bg-forest/10 hover:bg-forest text-forest hover:text-white font-bold text-[11px] transition inline-flex items-center gap-1"
                      >
                        Profile <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
