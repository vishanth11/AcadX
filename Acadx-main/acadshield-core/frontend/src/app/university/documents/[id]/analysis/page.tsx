"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePlatformState } from "@/lib/platform-state";
import {
  FileSearch,
  Scan,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Layers,
  FileCheck2,
  Eye
} from "lucide-react";

export default function DocumentAnalysisPage() {
  const params = useParams();
  const docId = (params?.id as string) || "doc_mit_degree_001";
  const { documents } = usePlatformState();

  const doc = documents.find((d) => d.id === docId) || documents[0];

  return (
    <div className="p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest/15">
        <div>
          <Link
            href={`/university/documents/${doc.id}`}
            className="text-xs font-bold text-forest/60 hover:text-forest flex items-center gap-1.5 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Document Dossier
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight headline-shadow font-serif">
              Document Forensics & AI Analysis
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-forest text-ochre">
              MODEL v1.4 � ACTIVE
            </span>
          </div>
          <p className="text-xs text-forest/70 font-mono">
            Target Record: {doc.documentType} ({doc.documentNumber}) � Student: {doc.studentName}
          </p>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual Layout & OCR Bounding Boxes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border-2 border-forest/15 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-forest/10">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-ochre" />
                <span className="text-xs font-bold uppercase tracking-wider text-forest">
                  Computer Vision & Region Detection
                </span>
              </div>
              <span className="text-xs text-forest/60 font-mono">PaddleOCR + LayoutLMv3</span>
            </div>

            {/* Simulated OCR Canvas */}
            <div className="relative p-8 bg-[#FAF7F2] border border-forest/20 rounded-2xl min-h-[340px] flex flex-col justify-between font-serif text-forest select-none">
              {/* Seal Region Box */}
              <div className="absolute top-6 right-6 border-2 border-emerald-500 bg-emerald-50/70 p-3 rounded-xl text-center">
                <span className="text-[10px] font-mono text-emerald-800 font-bold block">
                  [SEAL_REGION: 99.4%]
                </span>
                <span className="text-xs font-bold text-emerald-900">MIT Registrar Seal</span>
              </div>

              {/* Title Bounding Box */}
              <div className="border border-ochre bg-ochre/10 p-3 rounded-lg max-w-md">
                <span className="text-[9px] font-mono text-ochre block font-bold">
                  [TITLE_REGION: 98.9%]
                </span>
                <div className="text-xl font-bold">{doc.documentType}</div>
              </div>

              {/* Recipient Bounding Box */}
              <div className="border border-emerald-500 bg-emerald-50/60 p-3 rounded-lg max-w-sm mt-4">
                <span className="text-[9px] font-mono text-emerald-700 block font-bold">
                  [HOLDER_NAME: 99.8%]
                </span>
                <div className="text-base font-bold">{doc.studentName}</div>
              </div>

              {/* Signature Region Box */}
              <div className="border-2 border-emerald-500 bg-emerald-50/70 p-3 rounded-xl max-w-xs mt-6 self-end">
                <span className="text-[10px] font-mono text-emerald-800 font-bold block">
                  [SIGNATURE_REGION: 97.2%]
                </span>
                <div className="text-xs font-bold text-forest">
                  Prof. Arthur Pendelton (Dean of Engineering)
                </div>
              </div>
            </div>

            {/* Extracted Fields Table */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-forest/60 block">
                Extracted Structured Fields
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-forest/5 border border-forest/10">
                  <span className="text-forest/50 text-[10px] block">DOCUMENT_TYPE</span>
                  <strong className="text-forest truncate block">{doc.documentType}</strong>
                </div>
                <div className="p-3 rounded-xl bg-forest/5 border border-forest/10">
                  <span className="text-forest/50 text-[10px] block">SERIAL_NO</span>
                  <strong className="text-forest truncate block">{doc.documentNumber}</strong>
                </div>
                <div className="p-3 rounded-xl bg-forest/5 border border-forest/10">
                  <span className="text-forest/50 text-[10px] block">ISSUE_DATE</span>
                  <strong className="text-forest truncate block">{doc.issueDate}</strong>
                </div>
                <div className="p-3 rounded-xl bg-forest/5 border border-forest/10">
                  <span className="text-forest/50 text-[10px] block">ACADEMIC_YEAR</span>
                  <strong className="text-forest truncate block">{doc.academicYear}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Anomaly Evaluation & Consistency Matrix */}
        <div className="space-y-6">
          {/* Anomaly Assessment Card */}
          <div className="bg-white border border-forest/10 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-forest/10">
              <span className="text-xs font-bold uppercase tracking-wider text-forest/60">
                AI Anomaly Assessment
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                LOW RISK (NOMINAL)
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-forest/70">Layout Consistency:</span>
                <strong className="text-emerald-700">99.1% (Standard MIT Template)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forest/70">Font Alignment:</span>
                <strong className="text-emerald-700">Uniform Sans-Serif</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forest/70">Tamper Artifacts:</span>
                <strong className="text-emerald-700">None Detected</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forest/70">Visual Splicing:</span>
                <strong className="text-emerald-700">Negative</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-forest/5 border border-forest/10 text-[11px] text-forest/70 leading-relaxed">
              <strong>Forensic Rule: </strong> AcadShield never presents AI inference as definitive proof of authenticity. Cryptographic SHA-256 matching and authoritative institutional registration remain the sole basis of legal validity.
            </div>
          </div>

          {/* Cross-Document Consistency Matrix */}
          <div className="bg-white border border-forest/10 rounded-2xl p-6 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-forest/60 block">
              Cross-Document Consistency
            </span>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-forest/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-forest">Student Name Across Records</div>
                  <div className="text-[10px] text-forest/50">Matches SSLC, Transcript & Degree</div>
                </div>
                <span className="font-bold text-emerald-700">? MATCH</span>
              </div>

              <div className="p-2.5 rounded-xl bg-forest/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-forest">Cohort Graduation Term</div>
                  <div className="text-[10px] text-forest/50">Consistent: Class of 2026</div>
                </div>
                <span className="font-bold text-emerald-700">? MATCH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
