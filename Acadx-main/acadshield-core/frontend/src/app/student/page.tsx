"use client";

import React from "react";
import Link from "next/link";
import { usePlatformState } from "@/lib/platform-state";
import {
  GraduationCap,
  FileCheck2,
  Award,
  Sparkles,
  Share2,
  User,
  ArrowRight,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Copy,
  CheckCircle2
} from "lucide-react";

export default function StudentOverviewPage() {
  const { students, documents, credentials } = usePlatformState();
  const student = students[0]; // Current logged in student
  const studentDocs = documents.filter((d) => d.studentName === student.name);
  const studentCreds = credentials.filter((c) => c.studentName === student.name);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Student Welcome Card */}
      <div className="bg-white/80 backdrop-blur border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest text-ochre font-serif text-2xl flex items-center justify-center font-bold border border-ochre/30 shadow">
              {student.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-forest tracking-tight">
                  Welcome, {student.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-900 uppercase">
                  {student.status}
                </span>
              </div>
              <p className="text-forest/70 text-xs font-medium">
                {student.program}   {student.universityName}   Class of {student.year}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-mono text-forest/60">Decentralized ID:</span>
                <span className="text-[11px] font-mono text-forest bg-forest/5 px-2 py-0.5 rounded font-medium">
                  {student.did}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/passport"
              className="px-4 py-2.5 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest/90 transition flex items-center gap-2 shadow-sm"
            >
              <GraduationCap className="w-4 h-4 text-ochre" />
              Open Trust Passport
            </Link>
            <Link
              href="/student/share"
              className="px-4 py-2.5 rounded-xl border border-forest/20 text-forest text-xs font-bold hover:bg-forest/5 transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-ochre" />
              Selective Share
            </Link>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forest/50">Verified Documents</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="block text-3xl font-extrabold text-forest">{studentDocs.length}</span>
          <p className="text-xs text-forest/60">SHA-256 anchored source marksheets and certificates.</p>
          <Link
            href="/student/documents"
            className="inline-flex items-center gap-1 text-xs font-bold text-ochre hover:underline pt-2"
          >
            Open Document Wallet <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forest/50">W3C Credentials</span>
            <Award className="w-4 h-4 text-ochre" />
          </div>
          <span className="block text-3xl font-extrabold text-forest">{studentCreds.length}</span>
          <p className="text-xs text-forest/60">Digitally signed credentials ready for employment verification.</p>
          <Link
            href="/student/credentials"
            className="inline-flex items-center gap-1 text-xs font-bold text-ochre hover:underline pt-2"
          >
            Inspect Credentials <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forest/50">NFT Digital Proofs</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <span className="block text-3xl font-extrabold text-forest">{studentCreds.length}</span>
          <p className="text-xs text-forest/60">ERC-721 tokens anchored on Polygon Amoy network.</p>
          <Link
            href="/student/credentials"
            className="inline-flex items-center gap-1 text-xs font-bold text-ochre hover:underline pt-2"
          >
            View On-Chain Tokens <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Credentials & Sharing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-forest/15 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-forest uppercase tracking-wider">
            Primary Academic Degrees
          </h3>
          <div className="space-y-3">
            {studentCreds.map((cred) => (
              <div key={cred.id} className="p-4 rounded-xl border border-forest/15 bg-forest/[0.02] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-extrabold text-forest">{cred.title}</h4>
                  <p className="text-[11px] text-forest/70">{cred.universityName}</p>
                  <span className="font-mono text-[10px] text-purple-700 font-bold block mt-1">
                    ERC-721 #{cred.blockchain.tokenId}   Polygon Amoy
                  </span>
                </div>
                <Link
                  href={`/student/credentials/${cred.id}`}
                  className="px-3 py-1.5 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest/90 shrink-0"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-forest text-white rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-ochre uppercase font-bold tracking-widest">
              Candidate Trust Passport
            </span>
            <h3 className="text-xl font-extrabold font-serif">
              Share Your Verified Education With Potential Employers
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Employers can immediately check your SHA-256 document fingerprint and Polygon consensus without contacting university registrars.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/student/passport"
              className="px-4 py-2.5 rounded-xl bg-ochre text-forest text-xs font-bold hover:bg-ochre/90 transition shadow"
            >
              Open Interactive Passport
            </Link>
            <Link
              href="/student/share"
              className="px-4 py-2.5 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition"
            >
              Generate Share Link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
