"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  Share2,
  CheckCircle2,
  Copy,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  Award,
  Layers,
  Sparkles
} from "lucide-react";

export default function StudentShareConsolePage() {
  const { students, documents, credentials } = usePlatformState();
  const student = students[0];

  const [selectedItems, setSelectedItems] = useState<string[]>(["DOC-001", "CRED-2024-001"]);
  const [expiryDays, setExpiryDays] = useState("30");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((i) => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleGenerate = () => {
    const slug = "p_pres_" + Math.random().toString(36).substring(2, 8);
    setGeneratedLink(`http://localhost:3000/p/${slug}`);
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/15 text-xs font-semibold text-forest mb-2">
          <Share2 className="w-3.5 h-3.5 text-ochre" />
          Zero-Knowledge & Selective Disclosure
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Selective Disclosure Console
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Generate cryptographic verifiable presentations for job applications. Share only the degrees and certificates you select, with time-bound access revocable at any time.
        </p>
      </div>

      {/* Select Credentials Box */}
      <div className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-forest">Select Verified Claims to Include</h3>
          <p className="text-xs text-forest/70 mt-0.5">
            Check the credentials and documents you wish to bundle into this verifiable presentation.
          </p>
        </div>

        <div className="space-y-3">
          {credentials.map((cred) => (
            <label
              key={cred.id}
              className={`p-4 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                selectedItems.includes(cred.id)
                  ? "border-forest bg-forest/5"
                  : "border-forest/15 bg-white hover:bg-forest/[0.02]"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(cred.id)}
                  onChange={() => toggleItem(cred.id)}
                  className="rounded border-forest/30 text-forest focus:ring-forest w-4 h-4"
                />
                <div>
                  <h4 className="text-sm font-bold text-forest">{cred.title}</h4>
                  <p className="text-xs text-forest/60">
                    {cred.universityName}   ERC-721 #{cred.blockchain.tokenId}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                W3C CREDENTIAL
              </span>
            </label>
          ))}
        </div>

        {/* Expiration Settings */}
        <div className="border-t border-forest/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-forest block">Presentation Expiry Window:</label>
            <p className="text-[11px] text-forest/60">Links automatically expire after this period.</p>
          </div>
          <select
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-forest/20 bg-forest/5 font-semibold text-forest self-start sm:self-auto"
          >
            <option value="7">7 Days</option>
            <option value="30">30 Days (Recommended)</option>
            <option value="90">90 Days</option>
            <option value="never">Permanent (Revocable)</option>
          </select>
        </div>

        <div className="border-t border-forest/10 pt-4 flex justify-end">
          <button
            onClick={handleGenerate}
            className="px-5 py-3 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest/90 transition flex items-center gap-2 shadow"
          >
            <Sparkles className="w-4 h-4 text-ochre" />
            Generate Verifiable Presentation Link
          </button>
        </div>

        {/* Generated Result Box */}
        {generatedLink && (
          <div className="p-5 rounded-2xl bg-forest/5 border border-forest/15 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-forest/60 block">
              Active Shareable Link (Copy & Paste to Recruiter / Application Form):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 font-mono text-xs bg-white p-3 rounded-xl border border-forest/15 text-forest"
              />
              <button
                onClick={copyLink}
                className="px-4 py-3 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest/90 transition flex items-center gap-1.5 shrink-0"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>Copy Link</span>
              </button>
            </div>
            <p className="text-[11px] text-forest/60">
              Anyone with this link can view your selected claims and independently verify their cryptographic signatures without logging in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
