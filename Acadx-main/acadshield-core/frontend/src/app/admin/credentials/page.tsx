"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  Award,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Building2,
  Users
} from "lucide-react";

export default function AdminCredentialsPage() {
  const { credentials } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredCreds = credentials.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.universityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-xs font-semibold text-red-900 mb-2">
          <Award className="w-3.5 h-3.5 text-red-600" />
          Universal Credential Ledger
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Platform Credentials Registry
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Complete superadmin registry of all W3C Verifiable Credentials and ERC-721 non-fungible tokens minted across the network.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur border border-forest/15 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-forest/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search credentials, students, or institutions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-forest/20 bg-forest/5 focus:outline-none focus:border-forest text-forest font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "ACTIVE", "REVOKED"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === f
                  ? "bg-forest text-white"
                  : "bg-forest/5 text-forest/70 hover:bg-forest/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-forest/15 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest/5 border-b border-forest/10 font-bold uppercase text-[10px] text-forest/70 tracking-wider">
              <tr>
                <th className="py-3 px-4">Credential ID & Title</th>
                <th className="py-3 px-4">Holder</th>
                <th className="py-3 px-4">Issuing University</th>
                <th className="py-3 px-4">Token & Network</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filteredCreds.map((c) => (
                <tr key={c.id} className="hover:bg-forest/[0.02] transition">
                  <td className="py-3.5 px-4 font-bold text-forest">
                    <div>{c.title}</div>
                    <span className="text-[10px] text-forest/50 font-mono">{c.id}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-forest/85">{c.studentName}</td>
                  <td className="py-3.5 px-4 text-forest/70">{c.universityName}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-forest/70">
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold mr-1.5">
                      #{c.blockchain.tokenId}
                    </span>
                    <span>{c.blockchain.network}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link
                      href={`/university/credentials/${c.id}`}
                      className="px-2.5 py-1 rounded bg-forest/10 hover:bg-forest text-forest hover:text-white font-bold text-[11px] transition"
                    >
                      Dossier
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
