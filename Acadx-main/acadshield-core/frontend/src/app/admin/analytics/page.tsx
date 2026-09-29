"use client";

import React from "react";
import { usePlatformState } from "@/lib/platform-state";
import {
  TrendingUp,
  Building2,
  Briefcase,
  Users,
  Award,
  Binary,
  FileCheck2,
  Sparkles,
  BarChart3
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const { institutions, companies, students, documents, credentials, verifications } = usePlatformState();

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-xs font-semibold text-red-900 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-red-600" />
          Network Velocity & Growth Intelligence
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Platform Network Analytics
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Macro-telemetry showing adoption across higher education ecosystems, corporate verifier API requests, and blockchain throughput.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Universities</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">{institutions.length}</span>
          <span className="text-[10px] text-emerald-700 font-bold">+100% YoY</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Enterprises</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">{companies.length}</span>
          <span className="text-[10px] text-emerald-700 font-bold">+150% YoY</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Active DIDs</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">{students.length}</span>
          <span className="text-[10px] text-forest/60">Self-sovereign</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Documents</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">{documents.length}</span>
          <span className="text-[10px] text-forest/60">SHA-256 anchored</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Credentials</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">{credentials.length}</span>
          <span className="text-[10px] text-purple-700 font-bold">ERC-721 tokenized</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Verifications</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">{verifications.length}</span>
          <span className="text-[10px] text-emerald-700 font-bold">Automated checks</span>
        </div>
      </div>

      {/* Network Health & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-forest/15 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-forest uppercase tracking-wider">
            Document Type Distribution
          </h3>
          <div className="space-y-3">
            {[
              { type: "Degree Certificate (Undergraduate / Graduate)", count: 2, pct: "40%" },
              { type: "Academic Transcript / Consolidated Marksheet", count: 2, pct: "40%" },
              { type: "SSLC / HSC Secondary Education Marksheet", count: 1, pct: "20%" },
            ].map((d) => (
              <div key={d.type} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-forest">
                  <span>{d.type}</span>
                  <span className="font-mono text-forest/70">{d.count} ({d.pct})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-forest/10 overflow-hidden">
                  <div className="h-full bg-forest rounded-full" style={{ width: d.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-forest/15 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-forest uppercase tracking-wider">
            Verification Outcome Distribution
          </h3>
          <div className="space-y-3">
            {[
              { label: "VERIFIED (Bit-for-Bit Fingerprint Match)", count: 2, pct: "67%", color: "bg-emerald-600" },
              { label: "HASH_MISMATCH (Submitted File Differs from Anchor)", count: 1, pct: "33%", color: "bg-red-600" },
            ].map((o) => (
              <div key={o.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-forest">
                  <span>{o.label}</span>
                  <span className="font-mono text-forest/70">{o.count} ({o.pct})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-forest/10 overflow-hidden">
                  <div className={`h-full ${o.color} rounded-full`} style={{ width: o.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
