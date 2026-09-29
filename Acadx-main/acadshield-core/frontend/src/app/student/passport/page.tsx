"use client";

import React, { useState } from "react";
import { usePlatformState } from "@/lib/platform-state";
import {
  GraduationCap,
  Award,
  FileCheck2,
  Share2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  GitFork,
  Clock
} from "lucide-react";

export default function StudentPassportPage() {
  const { students, documents, credentials } = usePlatformState();
  const student = students[0]; // Alex Vance Morgan

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareDegree, setShareDegree] = useState(true);
  const [shareTranscript, setShareTranscript] = useState(true);
  const [shareSSLC, setShareSSLC] = useState(false);
  const [sharePhone, setSharePhone] = useState(false);
  const [shareAddress, setShareAddress] = useState(false);
  const [shareExpiry, setShareExpiry] = useState("7_DAYS");
  const [copiedLink, setCopiedLink] = useState(false);

  const studentDocs = documents.filter((d) => d.studentId === student.id);
  const studentCreds = credentials.filter((c) => c.studentName === student.name);

  const mockShareUrl = `https://acadshield.network/share/tok_alex_${Math.random().toString(36).substring(2, 8)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mockShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="text-forest pb-24">
      

      {/* Header Banner */}
      <section className="border-b border-forest/10 bg-white/70 backdrop-blur px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-3">
              <GraduationCap className="w-3.5 h-3.5 text-ochre" />
              Student Credential Wallet & Selective Sharing Portal
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">
              {student.name}�s Trust Passport
            </h1>
            <p className="mt-1 text-forest/75 text-sm max-w-xl">
              Decentralized Identity: <code className="font-mono text-xs">{student.did}</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition shadow-md flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-ochre" />
              Selective Disclosure Share
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Trust Graph Card */}
        <div className="bg-white border border-forest/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-forest/10 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-ochre" />
              <h2 className="text-base font-bold text-forest">
                Cryptographic Trust Graph Relationships
              </h2>
            </div>
            <span className="text-xs font-semibold text-forest/60">
              Polygon Amoy Anchor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-forest/5 border border-forest/10 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-forest">
                <Building2 className="w-4 h-4 text-ochre" />
                STUDIED_AT
              </div>
              <div className="font-bold text-sm text-forest">{student.universityName}</div>
              <div className="text-forest/60 text-[11px]">Accredited Higher Ed Authority</div>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ? VERIFIED INSTITUTION
              </span>
            </div>

            <div className="p-4 rounded-xl bg-forest/5 border border-forest/10 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-forest">
                <Award className="w-4 h-4 text-ochre" />
                OWNS_CREDENTIAL
              </div>
              <div className="font-bold text-sm text-forest">B.S. in Computer Science & AI</div>
              <div className="text-forest/60 text-[11px]">Token #101 � Dean Signed</div>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ? VERIFIED DEGREE
              </span>
            </div>

            <div className="p-4 rounded-xl bg-forest/5 border border-forest/10 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-forest">
                <FileCheck2 className="w-4 h-4 text-ochre" />
                OWNS_TRANSCRIPT
              </div>
              <div className="font-bold text-sm text-forest">Official Academic Transcript</div>
              <div className="text-forest/60 text-[11px]">Registrar Certified GPA 4.95</div>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ? VERIFIED TRANSCRIPT
              </span>
            </div>

            <div className="p-4 rounded-xl bg-forest/5 border border-forest/10 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-forest">
                <Briefcase className="w-4 h-4 text-ochre" />
                VERIFIED_BY
              </div>
              <div className="font-bold text-sm text-forest">Anthropic PBC</div>
              <div className="text-forest/60 text-[11px]">Talent Operations Verifier</div>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ? VERIFIED RECORD
              </span>
            </div>
          </div>
        </div>

        {/* Claims Directory: Verified vs Self-Reported */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Institutional Verified Claims */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-forest flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Institution-Issued Verified Records ({studentDocs.length})
            </h2>

            <div className="space-y-3">
              {studentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-forest/10 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-forest/5 text-forest/70 border border-forest/10">
                          {doc.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED BY UNIVERSITY
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-forest mt-1.5">{doc.documentType}</h3>
                      <p className="text-xs text-forest/60">
                        {doc.universityName} � {doc.uploadedBy}
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold text-forest/70">
                      {doc.documentNumber}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-forest/5 font-mono text-[11px] text-forest/80 flex items-center justify-between">
                    <span className="truncate">SHA-256: {doc.sha256Hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Self-Reported & Skills Panel */}
          <div className="space-y-6">
            <div className="bg-white border border-forest/10 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-forest flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Self-Reported Experience
              </h3>
              <p className="text-xs text-forest/70 leading-relaxed">
                Candidate assertions not directly signed by an accredited registrar authority.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-forest/5 border border-forest/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-forest">Distributed Systems Researcher</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      SELF-REPORTED
                    </span>
                  </div>
                  <div className="text-forest/60">Open Source Laboratory � 2024 - 2025</div>
                </div>

                <div className="p-3 rounded-xl bg-forest/5 border border-forest/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-forest">Rust & Cryptography Skill</span>
                    <span className="px-2 py-0.5 rounded bg-forest/10 text-forest/70 text-[10px] font-bold">
                      UNVERIFIED CLAIM
                    </span>
                  </div>
                  <div className="text-forest/60">Self-attested proficiency in zk-SNARKs</div>
                </div>
              </div>
            </div>

            {/* Privacy Promise */}
            <div className="bg-forest text-white rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-ochre" />
                Zero-Knowledge Disclosure
              </h4>
              <p className="text-xs text-white/80 mt-2 leading-relaxed">
                You control exactly which credentials, documents, and personal details employers see when verifying your credentials.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Selective Disclosure Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-forest/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-forest/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-ochre/15 text-ochre flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-forest">
                  Selective Credential Disclosure
                </h3>
                <span className="text-xs text-forest/60">
                  Choose what the employer or verifier can inspect
                </span>
              </div>
            </div>

            {/* Scopes */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-forest uppercase tracking-wider">
                Select Credentials to Include
              </span>

              <label className="flex items-center justify-between p-3 rounded-xl border border-forest/10 bg-forest/5 cursor-pointer">
                <div className="text-xs">
                  <div className="font-bold text-forest">Degree Certificate (Final)</div>
                  <div className="text-forest/60 text-[11px]">MIT EECS Class of 2026</div>
                </div>
                <input
                  type="checkbox"
                  checked={shareDegree}
                  onChange={(e) => setShareDegree(e.target.checked)}
                  className="w-4 h-4 text-ochre rounded focus:ring-ochre"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-forest/10 bg-forest/5 cursor-pointer">
                <div className="text-xs">
                  <div className="font-bold text-forest">Academic Transcript</div>
                  <div className="text-forest/60 text-[11px]">Consolidated Grade Sheet</div>
                </div>
                <input
                  type="checkbox"
                  checked={shareTranscript}
                  onChange={(e) => setShareTranscript(e.target.checked)}
                  className="w-4 h-4 text-ochre rounded focus:ring-ochre"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-forest/10 bg-forest/5 cursor-pointer">
                <div className="text-xs">
                  <div className="font-bold text-forest">SSLC Marksheet (10th Standard)</div>
                  <div className="text-forest/60 text-[11px]">Secondary Education Archive</div>
                </div>
                <input
                  type="checkbox"
                  checked={shareSSLC}
                  onChange={(e) => setShareSSLC(e.target.checked)}
                  className="w-4 h-4 text-ochre rounded focus:ring-ochre"
                />
              </label>
            </div>

            {/* Privacy Redactions */}
            <div className="space-y-2 pt-2 border-t border-forest/10">
              <span className="text-xs font-bold text-forest uppercase tracking-wider">
                Redact Personal Contact Details
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-forest/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!sharePhone}
                    onChange={(e) => setSharePhone(!e.target.checked)}
                    className="w-3.5 h-3.5 text-ochre"
                  />
                  <span>Hide Phone Number</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-forest/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!shareAddress}
                    onChange={(e) => setShareAddress(!e.target.checked)}
                    className="w-3.5 h-3.5 text-ochre"
                  />
                  <span>Hide Street Address</span>
                </label>
              </div>
            </div>

            {/* Generated Link */}
            <div className="p-3 rounded-xl bg-forest/5 border border-forest/10 space-y-1.5">
              <span className="text-[11px] font-bold text-forest/60 block">
                Time-Limited Verification Link (7 Days)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={mockShareUrl}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-forest/20 bg-white text-xs font-mono text-forest"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-forest text-white text-xs font-bold hover:bg-forest/90 transition flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-forest/10">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
