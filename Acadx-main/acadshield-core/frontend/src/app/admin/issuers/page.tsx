"use client";

import React, { useState } from "react";
import { usePlatformState } from "@/lib/platform-state";
import {
  KeyRound,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Lock,
  ExternalLink
} from "lucide-react";

export default function AdminIssuersPage() {
  const { institutions } = usePlatformState();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const issuersList = institutions.map((inst, idx) => ({
    id: `iss_${inst.id}`,
    institutionName: inst.legalName,
    delegateName: idx === 0 ? "Dr. Eleanor Vance (University Registrar)" : "Dean Marcus Sterling (Academic Affairs)",
    email: inst.email,
    issuerDid: `did:acadshield:issuer:${inst.id}`,
    publicKey: "0x04bf689e4726...928c0b78e12d4",
    status: inst.status === "VERIFIED" ? "AUTHORIZED" : "SUSPENDED",
    keyType: "Ed25519VerificationKey2020",
    lastSignatureAt: "2024-09-18 14:22:10 UTC"
  }));

  const copyKey = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-xs font-semibold text-red-900 mb-2">
          <KeyRound className="w-3.5 h-3.5 text-red-600" />
          Cryptographic Authority Roster
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Accredited Issuers & Signing Delegates
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Authorized institutional signers, registrar delegate keys, and public verification methods registered in the smart contract registry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {issuersList.map((iss) => (
          <div
            key={iss.id}
            className="bg-white border border-forest/15 rounded-3xl p-6 shadow-sm space-y-4 hover:border-forest/40 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-forest text-ochre font-serif text-lg flex items-center justify-center font-bold">
                  {iss.institutionName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-forest">{iss.institutionName}</h3>
                  <p className="text-xs text-forest/70">{iss.delegateName}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  iss.status === "AUTHORIZED"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {iss.status}
              </span>
            </div>

            <div className="p-3.5 bg-forest/5 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-forest/60">Algorithm:</span>
                <span className="font-mono font-bold text-forest">{iss.keyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest/60">Official Email:</span>
                <span className="font-semibold text-forest">{iss.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-forest/60">Last Signature:</span>
                <span className="text-forest">{iss.lastSignatureAt}</span>
              </div>
              <div className="pt-1">
                <span className="text-forest/60 block text-[10px] uppercase font-bold">Issuer DID:</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono text-[11px] text-forest truncate">{iss.issuerDid}</span>
                  <button
                    onClick={() => copyKey(iss.issuerDid, iss.id)}
                    className="text-forest/50 hover:text-forest"
                  >
                    {copiedKey === iss.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
