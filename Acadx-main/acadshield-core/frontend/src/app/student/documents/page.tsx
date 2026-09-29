"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  FileCheck2,
  Download,
  Copy,
  CheckCircle2,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar
} from "lucide-react";

export default function StudentDocumentsPage() {
  const { students, documents } = usePlatformState();
  const student = students[0];
  const studentDocs = documents.filter((d) => d.studentName === student.name);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/15 text-xs font-semibold text-forest mb-2">
          <FileCheck2 className="w-3.5 h-3.5 text-ochre" />
          Tamper-Evident Document Safe
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Academic Document Wallet
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Authoritative academic documents registered and cryptographically anchored by your university. Share raw PDFs with employers knowing their hashes match this registry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {studentDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-forest/15 rounded-3xl p-6 shadow-sm space-y-4 hover:border-forest/40 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-forest/50 uppercase tracking-widest font-bold">
                    {doc.documentNumber}
                  </span>
                  <h3 className="text-base font-extrabold text-forest mt-0.5">{doc.documentType}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {doc.status}
                </span>
              </div>

              <div className="p-3.5 bg-forest/5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-forest/60">Issuing University:</span>
                  <span className="font-semibold text-forest">{doc.universityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-forest/60">Conferral Date:</span>
                  <span className="text-forest">{doc.issueDate}</span>
                </div>
                <div className="pt-1">
                  <span className="text-forest/60 block text-[10px] uppercase font-bold">
                    Authoritative SHA-256 Fingerprint:
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-mono text-[11px] bg-white p-2 rounded-lg border border-forest/10 text-forest break-all flex-1">
                      {doc.sha256Hash}
                    </span>
                    <button
                      onClick={() => copyHash(doc.sha256Hash, doc.id)}
                      className="p-2 rounded-lg bg-forest/5 hover:bg-forest/10 text-forest"
                      title="Copy Hash"
                    >
                      {copiedHash === doc.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-forest/10 flex items-center justify-between gap-3 text-xs">
              <span className="text-forest/60 text-[11px]">Size: {doc.fileSize} ({doc.fileName})</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Downloading official sealed PDF...");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-forest text-white font-bold hover:bg-forest/90 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-ochre" />
                Download PDF
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
