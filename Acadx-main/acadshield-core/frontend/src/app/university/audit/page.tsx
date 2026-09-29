"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Award,
  Sparkles,
  Download,
  Copy,
  ExternalLink
} from "lucide-react";

export default function UniversityAuditPage() {
  const { auditLogs } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter logs for university operations
  const universityLogs = auditLogs.filter(
    (log) =>
      log.role === "UNIVERSITY" ||
      log.role === "ISSUER" ||
      log.actor.toLowerCase().includes("university") ||
      log.actor.toLowerCase().includes("registrar")
  );

  const filteredLogs = universityLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      actionFilter === "ALL" ||
      (actionFilter === "UPLOADS" && log.action.includes("UPLOAD")) ||
      (actionFilter === "CREDENTIALS" && log.action.includes("CREDENTIAL")) ||
      (actionFilter === "REVOCATIONS" && log.action.includes("REVOK"));

    return matchesSearch && matchesAction;
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/15 text-xs font-semibold text-forest mb-2">
            <History className="w-3.5 h-3.5 text-ochre" />
            Append-Only Institutional Audit Trail
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
            Institutional Audit Ledger
          </h1>
          <p className="text-forest/70 text-sm mt-1">
            Tamper-evident record of all authoritative document uploads, credential issuances, and cryptographic lifecycle events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `acadshield-audit-${new Date().toISOString().split("T")[0]}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-3.5 py-2 rounded-xl border border-forest/20 text-xs font-bold text-forest hover:bg-forest/5 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-ochre" />
            Export Audit JSON
          </button>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Total Log Entries</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">{universityLogs.length}</span>
          <span className="text-[11px] text-forest/60">Cryptographically signed</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Documents Registered</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">
            {universityLogs.filter((l) => l.action.includes("UPLOAD") || l.action.includes("DOC")).length}
          </span>
          <span className="text-[11px] text-forest/60">SHA-256 fingerprint verified</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Credentials Minted</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">
            {universityLogs.filter((l) => l.action.includes("CREDENTIAL") && !l.action.includes("REVOK")).length}
          </span>
          <span className="text-[11px] text-purple-700 font-semibold">ERC-721 tokenized</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Revocation Events</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">
            {universityLogs.filter((l) => l.action.includes("REVOK")).length}
          </span>
          <span className="text-[11px] text-amber-700 font-semibold">Lifecycle invalidated</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 backdrop-blur border border-forest/15 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-forest/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, action, or entity ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-forest/20 bg-forest/5 focus:outline-none focus:border-forest text-forest placeholder:text-forest/40 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "UPLOADS", "CREDENTIALS", "REVOCATIONS"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActionFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                actionFilter === filter
                  ? "bg-forest text-white shadow-sm"
                  : "bg-forest/5 text-forest/70 hover:bg-forest/10 hover:text-forest"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-forest/15 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest/5 border-b border-forest/10 font-bold uppercase text-[10px] text-forest/70 tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-forest/50">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-forest/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-forest/70 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-forest">
                      <div>{log.actor}</div>
                      <span className="text-[10px] font-mono text-forest/50 uppercase font-semibold">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-extrabold text-forest">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-forest/5 text-forest/80 font-mono text-[10px] font-bold">
                        {log.entity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-forest/70">
                      <div className="flex items-center gap-1.5">
                        <span>{log.entityId}</span>
                        <button
                          onClick={() => copyToClipboard(log.entityId, log.id)}
                          className="text-forest/40 hover:text-forest"
                          title="Copy ID"
                        >
                          {copiedId === log.id ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.result === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800"
                            : log.result === "WARNING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-forest/80 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
