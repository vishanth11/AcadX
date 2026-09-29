"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Server
} from "lucide-react";

export default function CompanyUsagePage() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/15 text-xs font-semibold text-forest mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-ochre" />
          Enterprise Quota & Compute Analytics
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          API Usage & Verification Quotas
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Real-time metrics on candidate document screening velocity, cryptographic hash queries, and API rate limits.
        </p>
      </div>

      {/* Quota Progress Meter Card */}
      <div className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-forest/50 font-bold block">
              Current Billing Cycle (Sep 1   Sep 30)
            </span>
            <h3 className="text-xl font-extrabold text-forest mt-0.5">Enterprise Verification Tier</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold self-start sm:self-auto">
            Active Subscription
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-forest">
            <span>142 Verifications Executed</span>
            <span>1,000 Monthly Included</span>
          </div>
          <div className="w-full h-3 rounded-full bg-forest/10 overflow-hidden">
            <div className="h-full bg-forest rounded-full" style={{ width: "14.2%" }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-forest/60">
            <span>858 verifications remaining</span>
            <span>Resets in 5 days</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forest/50">API Throughput</span>
            <Zap className="w-4 h-4 text-ochre" />
          </div>
          <span className="block text-3xl font-extrabold text-forest">60 / min</span>
          <p className="text-xs text-forest/60">Burst capacity up to 120 req/min for bulk onboarding batches.</p>
        </div>

        <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forest/50">Median Verification Latency</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="block text-3xl font-extrabold text-forest">145 ms</span>
          <p className="text-xs text-forest/60">Edge-cached on-chain state queries across Polygon Amoy nodes.</p>
        </div>

        <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forest/50">System Reliability</span>
            <Server className="w-4 h-4 text-purple-600" />
          </div>
          <span className="block text-3xl font-extrabold text-forest">99.98%</span>
          <p className="text-xs text-forest/60">High-availability decentralized indexers with SLA guarantee.</p>
        </div>
      </div>
    </div>
  );
}
