"use client";

import React from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import { Binary, ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function UniversityBlockchainPage() {
  const { credentials } = usePlatformState();

  return (
    <div className="p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-forest/15">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-2">
            <Binary className="w-3.5 h-3.5 text-ochre" />
            Decentralized Provenance & State Engine
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">
            On-Chain Blockchain Ledger
          </h1>
          <p className="mt-1 text-forest/75 text-sm max-w-xl">
            Real-time transaction anchors and cryptographic state confirmations recorded to Polygon Amoy testnet.
          </p>
        </div>
      </div>

      {/* Network Status Card */}
      <div className="bg-forest text-white rounded-3xl p-6 shadow-md grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-white/60 block text-[10px] uppercase">Active Network</span>
          <strong className="text-white text-sm">Polygon Amoy (80002)</strong>
        </div>
        <div>
          <span className="text-white/60 block text-[10px] uppercase">Smart Contract</span>
          <strong className="text-ochre text-sm truncate block">0xAcadShieldCoreNFT</strong>
        </div>
        <div>
          <span className="text-white/60 block text-[10px] uppercase">Current Block Height</span>
          <strong className="text-white text-sm">#1420951</strong>
        </div>
        <div>
          <span className="text-white/60 block text-[10px] uppercase">Consensus Status</span>
          <strong className="text-emerald-400 text-sm">100% FINALIZED</strong>
        </div>
      </div>

      {/* On-Chain Transactions Table */}
      <div className="bg-white border border-forest/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest/5 border-b border-forest/10 text-forest/70 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Transaction Hash</th>
                <th className="py-3.5 px-6">Event & Credential</th>
                <th className="py-3.5 px-6">Token ID</th>
                <th className="py-3.5 px-6">Block Height</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Explorer Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10 font-mono">
              {credentials.map((c) => (
                <tr key={c.id} className="hover:bg-forest/5 transition">
                  <td className="py-4 px-6 font-bold text-forest">
                    <div className="truncate max-w-xs">{c.blockchain.txHash}</div>
                  </td>

                  <td className="py-4 px-6 font-sans">
                    <div className="font-bold text-forest">{c.title}</div>
                    <div className="text-[11px] text-forest/60">Minted to: {c.studentName}</div>
                  </td>

                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 rounded bg-forest/5 text-forest font-bold border border-forest/10">
                      #{c.blockchain.tokenId}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    #{c.blockchain.blockNumber}
                  </td>

                  <td className="py-4 px-6 font-sans">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      CONFIRMED
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right font-sans">
                    <a
                      href={`https://amoy.polygonscan.com/tx/${c.blockchain.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ochre font-bold hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      PolygonScan <ExternalLink className="w-3.5 h-3.5" />
                    </a>
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
