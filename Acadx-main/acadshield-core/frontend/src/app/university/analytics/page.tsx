"use client";

import React from "react";
import { usePlatformState } from "@/lib/platform-state";
import { TrendingUp, Award, FileCheck2, Users, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function UniversityAnalyticsPage() {
  const { documents, credentials } = usePlatformState();

  return (
    <div className="p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-forest/15">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-ochre" />
            Institutional Issuance Analytics
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">
            Issuance & Verification Analytics
          </h1>
          <p className="mt-1 text-forest/75 text-sm max-w-xl">
            Real-time analytics covering attached source documents, on-chain credential minting, and external verification velocity.
          </p>
        </div>
      </div>

      {/* Top Velocity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-forest/10 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-forest/60 uppercase tracking-wider block">
            Annual Issuance Velocity
          </span>
          <div className="text-3xl font-black text-forest mt-2">1,248 Records</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +24.8% vs previous academic cohort
          </div>
        </div>

        <div className="bg-white border border-forest/10 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-forest/60 uppercase tracking-wider block">
            Employer Verification Volume
          </span>
          <div className="text-3xl font-black text-emerald-700 mt-2">389 Checks</div>
          <div className="text-xs text-forest/60 mt-1">
            100% cryptographic SHA-256 integrity rate
          </div>
        </div>

        <div className="bg-white border border-forest/10 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-bold text-forest/60 uppercase tracking-wider block">
            Revocation Tombstones
          </span>
          <div className="text-3xl font-black text-red-700 mt-2">1 Record</div>
          <div className="text-xs text-red-700/80 mt-1">
            0.08% institutional audit correction rate
          </div>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Categories Breakdown */}
        <div className="bg-white border border-forest/10 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-forest">
            Issuance by Academic Document Type
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-forest mb-1">
                <span>Final Degree Certificates</span>
                <span>48%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-forest/10 overflow-hidden">
                <div className="h-full bg-forest rounded-full" style={{ width: "48%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-forest mb-1">
                <span>Academic Transcripts</span>
                <span>28%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-forest/10 overflow-hidden">
                <div className="h-full bg-ochre rounded-full" style={{ width: "28%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-forest mb-1">
                <span>Secondary School Marksheets (SSLC/HSC)</span>
                <span>16%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-forest/10 overflow-hidden">
                <div className="h-full bg-emerald-700 rounded-full" style={{ width: "16%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-forest mb-1">
                <span>Internships & Certificates</span>
                <span>8%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-forest/10 overflow-hidden">
                <div className="h-full bg-forest/40 rounded-full" style={{ width: "8%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Traffic Heatmap Simulation */}
        <div className="bg-white border border-forest/10 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-forest">
            Top Verifier Organizations
          </h3>
          <div className="divide-y divide-forest/10 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <strong className="text-forest">Anthropic PBC</strong>
                <span className="text-forest/50 block text-[11px]">AI Research & Safety</span>
              </div>
              <span className="font-mono font-bold text-forest">142 Inquiries</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <strong className="text-forest">Google LLC</strong>
                <span className="text-forest/50 block text-[11px]">Cloud & Systems Engineering</span>
              </div>
              <span className="font-mono font-bold text-forest">118 Inquiries</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <strong className="text-forest">Stripe Inc.</strong>
                <span className="text-forest/50 block text-[11px]">Financial Infrastructure</span>
              </div>
              <span className="font-mono font-bold text-forest">84 Inquiries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
