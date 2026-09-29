"use client";

import React, { useState } from "react";
import { usePlatformState } from "@/lib/platform-state";
import {
  User,
  ShieldCheck,
  Copy,
  CheckCircle2,
  KeyRound,
  ExternalLink,
  Layers,
  Sparkles,
  Lock
} from "lucide-react";

export default function StudentIdentityPage() {
  const { students } = usePlatformState();
  const student = students[0];
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDidJson, setShowDidJson] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const didDocument = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    id: student.did,
    controller: student.did,
    verificationMethod: [
      {
        id: `${student.did}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: student.did,
        publicKeyMultibase: "z6MkmL6e9D8b74G2jW1uK4xZ7yP3nL0q"
      }
    ],
    authentication: [`${student.did}#key-1`],
    assertionMethod: [`${student.did}#key-1`]
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/15 text-xs font-semibold text-forest mb-2">
          <User className="w-3.5 h-3.5 text-ochre" />
          Self-Sovereign Identity (SSI)
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Decentralized Identity & Keypair
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Your W3C-compliant digital identity. You own your educational claims and determine which employers receive verifiable presentations.
        </p>
      </div>

      {/* DID Identity Card */}
      <div className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-forest/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-forest text-ochre flex items-center justify-center font-bold text-xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-forest/50 font-bold block">
                Holder Decentralized Identifier
              </span>
              <h2 className="text-lg font-extrabold text-forest">{student.name}</h2>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold self-start sm:self-auto">
            W3C DID Active
          </span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-forest uppercase tracking-wider block">
            Public DID String:
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-xs bg-forest/5 p-3.5 rounded-xl border border-forest/10 text-forest break-all">
              {student.did}
            </div>
            <button
              onClick={() => copyToClipboard(student.did, "did")}
              className="p-3.5 rounded-xl bg-forest text-white hover:bg-forest/90 transition text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              {copiedKey === "did" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>Copy</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-forest/5 space-y-1">
            <span className="text-forest/60 text-[11px] block">Cryptographic Suite:</span>
            <span className="font-mono font-bold text-forest">Ed25519VerificationKey2020</span>
          </div>
          <div className="p-4 rounded-xl bg-forest/5 space-y-1">
            <span className="text-forest/60 text-[11px] block">Institutional Sponsor:</span>
            <span className="font-bold text-forest">{student.universityName}</span>
          </div>
        </div>

        {/* DID Document Collapsible */}
        <div className="border-t border-forest/10 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-forest uppercase tracking-wider">
              W3C DID Document Specification
            </span>
            <button
              onClick={() => setShowDidJson(!showDidJson)}
              className="text-xs font-bold text-ochre hover:underline"
            >
              {showDidJson ? "Collapse JSON" : "Inspect W3C JSON"}
            </button>
          </div>

          {showDidJson && (
            <pre className="p-4 rounded-xl bg-forest/95 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-forest/20">
              {JSON.stringify(didDocument, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
