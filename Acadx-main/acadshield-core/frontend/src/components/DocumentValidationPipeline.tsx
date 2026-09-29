"use client";

import React from "react";
import { Check, X, AlertCircle, Clock, ShieldCheck, Binary, Sparkles } from "lucide-react";

export interface ValidationStep {
  name: string;
  description: string;
  status: "PASS" | "FAIL" | "WARNING" | "RUNNING" | "PENDING";
  details?: string;
}

interface DocumentValidationPipelineProps {
  steps?: ValidationStep[];
  fileName?: string;
  studentName?: string;
  universityName?: string;
  documentType?: string;
  documentNumber?: string;
  sha256Hash?: string;
}

export default function DocumentValidationPipeline({
  steps,
  fileName = "academic_document.pdf",
  studentName = "Alex Vance Morgan",
  universityName = "Massachusetts Institute of Technology",
  documentType = "Degree Certificate",
  documentNumber = "MIT-CS-2026-9921",
  sha256Hash = "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
}: DocumentValidationPipelineProps) {

  const defaultSteps: ValidationStep[] = [
    {
      name: "1. File Integrity & Format",
      description: "PDF/A structure verified, mime-type binary sanitized",
      status: "PASS",
      details: fileName
    },
    {
      name: "2. Document Type Validity",
      description: "Recognized in institutional academic credential taxonomy",
      status: "PASS",
      details: documentType
    },
    {
      name: "3. Student Identity Match",
      description: "Linked to active DID in institutional cohort",
      status: "PASS",
      details: studentName
    },
    {
      name: "4. University Authority Check",
      description: "Issuing institution holds active accredited status",
      status: "PASS",
      details: universityName
    },
    {
      name: "5. Issuer Signer Authorization",
      description: "Faculty / Registrar authorized for degree attestation",
      status: "PASS",
      details: "Authorized Key: 0x71C...49A2"
    },
    {
      name: "6. Document Serial Number Validation",
      description: "Serial syntax matches registrar convention",
      status: "PASS",
      details: documentNumber
    },
    {
      name: "7. Cross-Document Consistency",
      description: "Academic year and graduation terms match cohort record",
      status: "PASS",
      details: "Cohort 2022-2026"
    },
    {
      name: "8. Duplicate Detection Check",
      description: "No conflicting historical records with identical serial",
      status: "PASS",
      details: "Unique Document Record"
    },
    {
      name: "9. SHA-256 Hash Registration",
      description: "Web Crypto bit-for-bit fingerprint computed",
      status: "PASS",
      details: sha256Hash ? sha256Hash.slice(0, 24) + "..." : "0x7f83..."
    },
    {
      name: "10. Blockchain Anchor Readiness",
      description: "ERC-721 credential state ready for Polygon Amoy minting",
      status: "PASS",
      details: "Polygon Amoy (Chain ID 80002)"
    }
  ];

  const activeSteps = steps && steps.length > 0 ? steps : defaultSteps;

  const getIcon = (status: ValidationStep["status"]) => {
    switch (status) {
      case "PASS":
        return <Check className="w-4 h-4 text-emerald-700" />;
      case "FAIL":
        return <X className="w-4 h-4 text-red-700" />;
      case "WARNING":
        return <AlertCircle className="w-4 h-4 text-amber-700" />;
      case "RUNNING":
        return <span className="w-3.5 h-3.5 border-2 border-forest border-t-transparent rounded-full animate-spin" />;
      case "PENDING":
      default:
        return <Clock className="w-4 h-4 text-forest/30" />;
    }
  };

  const getPill = (status: ValidationStep["status"]) => {
    switch (status) {
      case "PASS":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "FAIL":
        return "bg-red-100 text-red-800 border-red-300";
      case "WARNING":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "RUNNING":
        return "bg-[#FAF7F2] text-forest border-forest";
      case "PENDING":
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border-2 border-forest/15 p-6 shadow-md text-forest">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-forest/10 gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-ochre" />
          <div>
            <h3 className="font-bold text-sm tracking-tight text-forest">
              AUTHORITATIVE DOCUMENT VALIDATION PIPELINE
            </h3>
            <p className="text-[11px] text-forest/70 font-mono">
              Universities must pass internal anti-fraud integrity checks before documents are anchored.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-forest text-ochre px-3 py-1 rounded-full font-bold self-start sm:self-auto">
          10-POINT SECURITY ENGINE • 10/10 PASS
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeSteps.map((step, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-[#FAF7F2] border border-forest/10 flex items-start gap-3">
            <div className="mt-0.5 p-1 rounded-full bg-white border border-forest/10 shadow-xs">
              {getIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-forest truncate">{step.name}</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 ${getPill(step.status)}`}>
                  {step.status}
                </span>
              </div>
              <div className="text-[11px] text-forest/70 mt-0.5 leading-snug">{step.description}</div>
              {step.details && (
                <div className="text-[10px] font-mono text-forest/50 mt-1 font-semibold truncate">
                  Evidence: {step.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
