"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  Sparkles,
  Search,
  ExternalLink,
  Copy,
  CheckCircle2,
  Building2,
  Award,
  Binary
} from "lucide-react";

export default function AdminNftsPage() {
  const { credentials } = usePlatformState();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const filteredNfts = credentials.filter(
    (c) =>
      c.blockchain.tokenId.includes(searchTerm) ||
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.universityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.blockchain.txHash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyTx = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-xs font-semibold text-red-900 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-red-600" />
          Cross-Institutional Token Registry
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          NFT Credentials Registry (ERC-721)
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Universal index of non-fungible digital tokens minted to certify authentic higher education degrees on Polygon Amoy.
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur border border-forest/15 p-4 rounded-2xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-forest/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Token ID, holder, or transaction hash..."
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
                <th className="py-3 px-4">Token ID</th>
                <th className="py-3 px-4">Degree / Title</th>
                <th className="py-3 px-4">Holder</th>
                <th className="py-3 px-4">University Issuer</th>
                <th className="py-3 px-4">Transaction Hash</th>
                <th className="py-3 px-4 text-right">PolygonScan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filteredNfts.map((c) => (
                <tr key={c.id} className="hover:bg-forest/[0.02] transition">
                  <td className="py-3.5 px-4 font-mono font-extrabold text-forest text-sm">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                      #{c.blockchain.tokenId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-forest">{c.title}</td>
                  <td className="py-3.5 px-4 font-medium text-forest/80">{c.studentName}</td>
                  <td className="py-3.5 px-4 text-forest/70">{c.universityName}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-forest/60">
                    <div className="flex items-center gap-1.5">
                      <span>{c.blockchain.txHash.substring(0, 16)}...</span>
                      <button
                        onClick={() => copyTx(c.blockchain.txHash)}
                        className="text-forest/40 hover:text-forest"
                        title="Copy Tx Hash"
                      >
                        {copiedTx === c.blockchain.txHash ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={`https://amoy.polygonscan.com/tx/${c.blockchain.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-forest text-white hover:bg-forest/90 font-bold text-[11px] transition inline-flex items-center gap-1"
                    >
                      Scan <ExternalLink className="w-3 h-3" />
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
