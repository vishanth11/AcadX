"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePlatformState } from "@/lib/platform-state";
import DocumentValidationPipeline from "@/components/DocumentValidationPipeline";
import {
  FileCheck2,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Binary,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Edit3,
  Ban,
  History,
  FileSearch,
  Sparkles,
  ArrowLeft
} from "lucide-react";

export default function UniversityDocumentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params?.id as string;
  const { documents, credentials } = usePlatformState();
  const [copied, setCopied] = useState(false);

  const doc = documents.find((d) => d.id === docId);
  if (!doc) {
    return <div className="m-8 rounded-2xl border border-forest/15 bg-white p-8 text-center"><h1 className="text-xl font-bold">Document not found</h1><p className="mt-2 text-sm text-forest/70">No document record matches this identifier.</p><Link className="mt-4 inline-block text-sm font-bold underline" href="/university/documents">Return to documents</Link></div>;
  }
  const cred = credentials.find((c) => c.documentId === doc.id || c.id === doc.credentialId);

  const copyHash = () => {
    navigator.clipboard.writeText(doc.sha256Hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-10 space-y-8">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest/15">
        <div className="space-y-1">
          <Link
            href="/university/documents"
            className="text-xs font-bold text-forest/60 hover:text-forest flex items-center gap-1.5 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Document Center
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight headline-shadow font-serif">
              {doc.documentType}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                doc.status === "VERIFIED"
                  ? "bg-emerald-100 text-emerald-800"
                  : doc.status === "REVOKED"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {doc.status}
            </span>
          </div>
          <p className="text-xs text-forest/70 font-mono">
            Document ID: {doc.id} � Serial: {doc.documentNumber}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/university/documents/${doc.id}/analysis`}
            className="px-3.5 py-2 rounded-xl bg-forest/5 hover:bg-forest/10 border border-forest/20 text-xs font-bold text-forest flex items-center gap-1.5 transition"
          >
            <FileSearch className="w-3.5 h-3.5 text-ochre" />
            AI & Forensic Analysis
          </Link>
          <Link
            href={`/university/documents/${doc.id}/edit`}
            className="px-3.5 py-2 rounded-xl bg-forest/5 hover:bg-forest/10 border border-forest/20 text-xs font-bold text-forest flex items-center gap-1.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-ochre" />
            Version Update
          </Link>
          <Link
            href={`/university/documents/${doc.id}/revoke`}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-1.5 transition"
          >
            <Ban className="w-3.5 h-3.5" />
            Revoke
          </Link>
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Document File & Cryptographic Fingerprint */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Preview Box */}
          <div className="bg-white border-2 border-forest/15 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-forest/10">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-ochre" />
                <span className="text-xs font-bold uppercase tracking-wider text-forest">
                  Archival Document Inspection
                </span>
              </div>
              <span className="text-xs text-forest/60 font-mono">
                {doc.fileName} ({doc.fileSize})
              </span>
            </div>

            {/* Document Digital Replica Frame */}
            <div className="p-8 bg-[#FAF7F2] border border-forest/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-forest/10 flex items-center justify-center text-forest">
                <FileCheck2 className="w-8 h-8 text-ochre" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-forest font-serif">{doc.documentType}</h3>
                <p className="text-xs text-forest/60 mt-0.5">
                  Conferred by {doc.universityName} � {doc.academicYear}
                </p>
                <div className="text-xs font-bold text-forest mt-2">
                  Awarded to: {doc.studentName}
                </div>
              </div>
              <div className="text-[11px] font-mono text-forest/50">
                Registrar Signed � Serial #{doc.documentNumber} � Issued {doc.issueDate}
              </div>
            </div>

            {/* SHA-256 Fingerprint Box */}
            <div className="p-4 rounded-xl bg-forest/5 border border-forest/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-forest flex items-center gap-1.5">
                  <Binary className="w-4 h-4 text-ochre" />
                  Cryptographic Document Fingerprint (SHA-256)
                </span>
                <button
                  onClick={copyHash}
                  className="text-forest hover:text-ochre font-bold flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Hash"}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-forest/10 font-mono text-xs text-forest break-all select-all">
                {doc.sha256Hash}
              </div>
              <p className="text-[11px] text-forest/60">
                This fingerprint uniquely represents this exact document file. Any altered byte alters the entire SHA-256 hash.
              </p>
            </div>
          </div>

          {/* 10-Point Internal Validation Engine */}
          <DocumentValidationPipeline
            fileName={doc.fileName}
            studentName={doc.studentName}
            universityName={doc.universityName}
            documentType={doc.documentType}
            documentNumber={doc.documentNumber}
            sha256Hash={doc.sha256Hash}
          />
        </div>

        {/* Right Column: Identity, Blockchain & NFT Provenance */}
        <div className="space-y-6">
          {/* Student Identity Card */}
          <div className="bg-white border border-forest/10 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-forest/60 block text-[10px]">
              Student Holder Identity
            </span>
            <div>
              <div className="text-base font-bold text-forest">{doc.studentName}</div>
              <div className="font-mono text-forest/50 text-[10px] truncate">{doc.studentDid}</div>
            </div>
            <div className="pt-2 border-t border-forest/10 flex items-center justify-between text-[11px]">
              <span className="text-forest/60">Issuing Registrar:</span>
              <strong className="text-forest">{doc.uploadedBy}</strong>
            </div>
          </div>

          {/* Linked VC & NFT Digital Credential Card */}
          <div className="bg-forest text-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ochre font-bold">
                NFT / Digital Asset
              </span>
              <span className="px-2 py-0.5 rounded bg-white/20 text-white font-mono text-[10px] font-bold">
                ERC-721
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold">{doc.documentType}</h4>
              <div className="font-mono text-ochre text-xs mt-1">
                Token ID: #{cred?.blockchain.tokenId || "101"}
              </div>
            </div>

            <div className="space-y-2 text-xs text-white/80 pt-2 border-t border-white/10 font-mono">
              <div className="flex items-center justify-between">
                <span>Network:</span>
                <span className="text-white">Polygon Amoy (80002)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Block:</span>
                <span className="text-white">#{cred?.blockchain.blockNumber || 1420951}</span>
              </div>
              <div>
                <span className="block text-white/50 text-[10px]">Tx Hash:</span>
                <span className="text-white text-[10px] break-all">
                  {cred?.blockchain.txHash || "0x4b78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fa"}
                </span>
              </div>
            </div>
          </div>

          {/* IPFS CID Reference */}
          <div className="bg-white border border-forest/10 rounded-2xl p-5 shadow-sm space-y-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-forest/60 block text-[10px]">
              Decentralized Storage (IPFS)
            </span>
            <div className="font-mono text-[11px] text-forest/80 break-all p-2 rounded bg-forest/5">
              ipfs://{doc.ipfsCid}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
