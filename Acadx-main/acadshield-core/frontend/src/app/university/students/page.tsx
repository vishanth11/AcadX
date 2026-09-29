"use client";

import React, { useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import { usePlatformState } from "@/lib/platform-state";
import {
  Users,
  Search,
  Plus,
  FileCheck2,
  Award,
  ArrowRight,
  ExternalLink,
  GraduationCap
} from "lucide-react";

export default function UniversityStudentsPage() {
  const { students } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.did.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="UNIVERSITY" />

      {/* Header */}
      <section className="border-b border-forest/10 bg-white/70 backdrop-blur px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-3">
              <Users className="w-3.5 h-3.5 text-ochre" />
              Institutional Cohort Registry
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">
              Student Directory
            </h1>
            <p className="mt-1 text-forest/75 text-sm max-w-xl">
              Manage student digital identities (DIDs), academic records, attached source documents, and issued verifiable credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/university/documents/upload"
              className="px-4 py-2.5 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition shadow flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 text-ochre" />
              Attach Academic Document
            </Link>
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
              placeholder="Search by student name, program, or DID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-forest/20 bg-forest/5 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
            />
          </div>
          <span className="text-xs font-bold text-forest/60">
            {filtered.length} Enrolled Students
          </span>
        </div>

        {/* Students Table */}
        <div className="bg-white border border-forest/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-forest/5 border-b border-forest/10 text-forest/70 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Student Identity</th>
                  <th className="py-3.5 px-6">Program & Department</th>
                  <th className="py-3.5 px-6">Graduation Class</th>
                  <th className="py-3.5 px-6">Source Docs</th>
                  <th className="py-3.5 px-6">Issued Creds</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-forest/5 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-forest text-sm">{s.name}</div>
                      <div className="font-mono text-[10px] text-forest/50 mt-0.5 truncate max-w-xs">
                        {s.did}
                      </div>
                      <div className="text-[11px] text-forest/60">{s.email}</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-forest">{s.program}</div>
                      <div className="text-forest/60 text-[11px]">{s.department}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-medium text-forest">{s.year}</span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-forest/5 font-bold text-forest text-[11px] border border-forest/10">
                        <FileCheck2 className="w-3.5 h-3.5 text-ochre" />
                        {s.documentCount} Documents
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        {s.credentialCount} Credentials
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-forest/10 text-forest/70"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href="/university/documents/upload"
                          className="px-2.5 py-1.5 rounded-lg bg-forest/5 hover:bg-forest/10 border border-forest/10 text-forest font-bold text-xs transition"
                        >
                          + Document
                        </Link>
                        <Link
                          href="/student/passport"
                          className="px-2.5 py-1.5 rounded-lg bg-ochre/10 hover:bg-ochre/20 text-ochre font-bold text-xs transition"
                        >
                          View Passport
                        </Link>
                      </div>
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
