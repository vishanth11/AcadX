"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  Award,
  Sparkles,
  QrCode,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Share2
} from "lucide-react";

export default function StudentCredentialsPage() {
  const { students, credentials } = usePlatformState();
  const student = students[0];
  const studentCreds = credentials.filter((c) => c.studentName === student.name);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/15 text-xs font-semibold text-forest mb-2">
          <Award className="w-3.5 h-3.5 text-ochre" />
          Verifiable Credentials & NFTs
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Credentials & Non-Fungible Tokens
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          W3C standard digital credentials and ERC-721 tokens representing your certified degrees and achievements on Polygon Amoy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {studentCreds.map((cred) => (
          <div
            key={cred.id}
            className="bg-white border border-forest/15 rounded-3xl p-6 shadow-sm space-y-4 hover:border-forest/40 transition flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-forest/50 uppercase tracking-widest font-bold">
                      {cred.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-mono text-[10px] font-bold">
                      ERC-721 #{cred.blockchain.tokenId}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-forest mt-1">{cred.title}</h3>
                  <p className="text-xs text-forest/70">{cred.type}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {cred.status}
                </span>
              </div>

              <div className="p-4 bg-forest/5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-forest/60">Issuing Institution:</span>
                  <span className="font-semibold text-forest">{cred.universityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest/60">Issue Date:</span>
                  <span className="text-forest">{cred.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest/60">Network:</span>
                  <span className="font-mono text-purple-700 font-bold">{cred.blockchain.network}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-forest/10 flex items-center justify-between gap-3 text-xs">
              <a
                href={`https://amoy.polygonscan.com/tx/${cred.blockchain.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-ochre hover:underline flex items-center gap-1"
              >
                PolygonScan <ExternalLink className="w-3 h-3" />
              </a>

              <Link
                href={`/student/credentials/${cred.id}`}
                className="px-3.5 py-1.5 rounded-xl bg-forest text-white font-bold hover:bg-forest/90 transition flex items-center gap-1.5"
              >
                Inspect Credential <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
