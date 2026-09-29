"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import { Award, ShieldCheck, Binary, ExternalLink, Search, CheckCircle2 } from "lucide-react";

export default function UniversityNFTCenterPage() {
  const { credentials } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = credentials.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.blockchain.tokenId.includes(searchTerm)
  );

  return (
    <div className="p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-forest/15">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-2">
            <Award className="w-3.5 h-3.5 text-ochre" />
            Digital Credential Asset Ledger
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">
            University NFT Credential Center
          </h1>
          <p className="mt-1 text-forest/75 text-sm max-w-xl">
            Inspect all non-fungible educational tokens (ERC-721) minted by Massachusetts Institute of Technology on Polygon Amoy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/university/credentials/create"
            className="px-5 py-3 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition shadow flex items-center gap-2"
          >
            <Award className="w-4 h-4 text-ochre" />
            Mint New Credential NFT
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-forest/10 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Token ID, credential title, or student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-forest/20 bg-forest/5 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
          />
        </div>
        <span className="text-xs font-bold text-forest/60">
          Network: Polygon Amoy (Chain ID 80002)
        </span>
      </div>

      {/* NFT Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cred) => (
          <div
            key={cred.id}
            className="bg-white border-2 border-forest/15 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-forest text-ochre">
                  Token #{cred.blockchain.tokenId}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    cred.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {cred.status}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-forest font-serif leading-snug">
                  {cred.title}
                </h3>
                <div className="text-xs text-forest/70 mt-1">
                  Recipient: <strong>{cred.studentName}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-forest/5 font-mono text-[11px] space-y-1 text-forest/80">
                <div className="truncate">Contract: 0xAcadShieldCoreNFT</div>
                <div className="truncate">Tx: {cred.blockchain.txHash.slice(0, 20)}...</div>
                <div>Block Height: #{cred.blockchain.blockNumber}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-forest/10 flex items-center justify-between text-xs">
              <span className="text-forest/50 font-mono text-[10px]">ERC-721 Asset</span>
              <a
                href={`https://amoy.polygonscan.com/tx/${cred.blockchain.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-ochre font-bold hover:underline flex items-center gap-1"
              >
                PolygonScan <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
