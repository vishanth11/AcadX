"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePlatformState } from "@/lib/platform-state";
import {
  Award,
  Sparkles,
  QrCode,
  ExternalLink,
  ChevronLeft,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Share2,
  Download,
  Layers
} from "lucide-react";

export default function StudentCredentialDetailPage() {
  const params = useParams();
  const credId = params?.id as string;
  const { credentials } = usePlatformState();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cred = credentials.find((c) => c.id === credId) || credentials[0];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/credentials"
          className="inline-flex items-center gap-2 text-xs font-semibold text-forest/70 hover:text-forest transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Credentials
        </Link>
        <Link
          href={`/verify/${cred.id}`}
          target="_blank"
          className="px-3.5 py-1.5 rounded-xl border border-forest/20 text-xs font-bold text-forest hover:bg-forest/5 flex items-center gap-1.5 transition"
        >
          <ExternalLink className="w-3.5 h-3.5 text-ochre" />
          Public Resolver Link
        </Link>
      </div>

      {/* Main Credential Hero Card */}
      <div className="bg-white/80 backdrop-blur border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest text-ochre flex items-center justify-center font-bold text-2xl border border-ochre/30 shadow">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-forest/50 uppercase tracking-widest font-bold">
                  {cred.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {cred.status}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-forest tracking-tight">
                {cred.title}
              </h1>
              <p className="text-xs text-forest/70 font-medium">
                Conferred by <strong className="text-forest">{cred.universityName}</strong> on {cred.issueDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-forest/5 p-4 rounded-2xl border border-forest/10">
            <div className="w-16 h-16 bg-white p-2 rounded-xl border border-forest/15 shadow-sm flex items-center justify-center">
              <QrCode className="w-12 h-12 text-forest" />
            </div>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-forest block">Instant QR Verification</span>
              <button
                onClick={() => copyToClipboard(`http://localhost:3000/verify/${cred.id}`, "qr")}
                className="text-ochre font-bold hover:underline inline-flex items-center gap-1"
              >
                {copiedKey === "qr" ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-forest/5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest/60 block">
              Non-Fungible Token (ERC-721)
            </span>
            <div className="flex justify-between">
              <span className="text-forest/60">Token ID:</span>
              <span className="font-mono font-bold text-forest">#{cred.blockchain.tokenId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Network:</span>
              <span className="font-semibold text-purple-700">{cred.blockchain.network}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest/60">Contract:</span>
              <span className="font-mono text-[10px] text-forest/80">0x742d35Cc6...</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-forest/5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest/60 block">
              Document Digest
            </span>
            <span className="text-forest/60 text-[11px] block">SHA-256 Registered Hash:</span>
            <div className="font-mono text-[11px] bg-white p-2 rounded-lg border border-forest/10 text-forest break-all">
              {cred.documentHash}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
