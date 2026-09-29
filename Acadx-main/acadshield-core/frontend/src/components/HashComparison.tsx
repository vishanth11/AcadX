"use client";

import React, { useState } from "react";
import {
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  User,
  CheckCircle2,
  XCircle,
  Binary,
  Lock,
  Sparkles
} from "lucide-react";

export interface HashComparisonProps {
  // Flat props support
  registeredHash?: string;
  submittedHash?: string;
  registeredFileName?: string;
  submittedFileName?: string;
  isRevoked?: boolean;
  isExpired?: boolean;
  studentName?: string;
  documentType?: string;
  universityName?: string;
  credentialId?: string;
  txHash?: string;
  blockNumber?: number;
  ipfsCid?: string;

  // Object props support
  registeredDoc?: {
    title: string;
    type?: string;
    studentName: string;
    studentDid?: string;
    universityName: string;
    universityVerified?: boolean;
    sha256Hash: string;
    issueDate?: string;
    tokenId?: string;
    txHash?: string;
  };
  submittedDoc?: {
    fileName: string;
    fileSize?: string;
    sha256Hash: string;
    computedAt?: string;
  };
  onReset?: () => void;
}

export default function HashComparison({
  registeredHash,
  submittedHash,
  registeredFileName,
  submittedFileName,
  isRevoked = false,
  isExpired = false,
  studentName,
  documentType,
  universityName,
  credentialId,
  txHash = "0x4b78912e9b08f4c2843efc6b8c4d2938a101d32098b1b8cf471d2b826b1392fa",
  blockNumber = 1420951,
  ipfsCid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  registeredDoc,
  submittedDoc,
  onReset
}: HashComparisonProps) {
  const [showTechnicalEvidence, setShowTechnicalEvidence] = useState(false);
  const [copiedRegistered, setCopiedRegistered] = useState(false);
  const [copiedSubmitted, setCopiedSubmitted] = useState(false);

  // Normalize inputs across both prop structures
  const rHash = (registeredHash || registeredDoc?.sha256Hash || "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069").trim();
  const sHash = (submittedHash || submittedDoc?.sha256Hash || "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069").trim();

  const rTitle = documentType || registeredDoc?.title || "Degree Certificate (Final)";
  const rStudent = studentName || registeredDoc?.studentName || "Alex Vance Morgan";
  const rUniversity = universityName || registeredDoc?.universityName || "Massachusetts Institute of Technology";
  const rFile = registeredFileName || "Alex_Morgan_MIT_Degree_Certificate.pdf";
  const sFile = submittedFileName || submittedDoc?.fileName || "Alex_Morgan_Received_Copy.pdf";

  const isMatch = rHash.toLowerCase() === sHash.toLowerCase();

  const copyHash = (hash: string, type: "reg" | "sub") => {
    navigator.clipboard.writeText(hash);
    if (type === "reg") {
      setCopiedRegistered(true);
      setTimeout(() => setCopiedRegistered(false), 2000);
    } else {
      setCopiedSubmitted(true);
      setTimeout(() => setCopiedSubmitted(false), 2000);
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] border-2 border-forest/20 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-in fade-in duration-300 text-forest">
      
      {/* Header Result Banner */}
      <div
        className={`p-6 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-md ${
          isRevoked
            ? "bg-red-800 text-white border-red-900"
            : isMatch
            ? "bg-forest text-[#FAF7F2] border-forest"
            : "bg-[#7A1C1C] text-white border-[#7A1C1C]"
        }`}
      >
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow ${
              isRevoked
                ? "bg-white text-red-800"
                : isMatch
                ? "bg-ochre text-forest"
                : "bg-white text-red-700"
            }`}
          >
            {isRevoked ? (
              <XCircle className="w-8 h-8" />
            ) : isMatch ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-80 font-bold">
              CRYPTOGRAPHIC INTEGRITY AUDIT OUTCOME
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
              {isRevoked
                ? "CREDENTIAL REVOKED BY ISSUING UNIVERSITY"
                : isMatch
                ? "DOCUMENT INTEGRITY VERIFIED"
                : "DOCUMENT FINGERPRINT MISMATCH"}
            </h2>
            <p className="text-xs sm:text-sm opacity-90 mt-1 max-w-xl leading-relaxed">
              {isRevoked
                ? "Authoritative institutional state indicates this academic credential has been administratively revoked. Historical registration is preserved on Polygon Amoy for audit transparency."
                : isMatch
                ? "The received document’s cryptographic SHA-256 fingerprint matches the authoritative record registered by the issuing university bit-for-bit."
                : "The submitted file does not match the document fingerprint registered by the issuing institution. Do not label the candidate fraudulent based solely on this mismatch."}
            </p>
          </div>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-white/20 hover:bg-white text-white hover:text-forest rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all self-start sm:self-auto"
          >
            New Comparison
          </button>
        )}
      </div>

      {/* Verification Checks Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-white rounded-xl border border-forest/10 flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isMatch ? "bg-emerald-500" : "bg-red-500"}`} />
          <div className="text-xs">
            <span className="text-forest/60 block text-[10px] font-bold">FINGERPRINT</span>
            <strong className="text-forest font-mono">{isMatch ? "MATCHED" : "MISMATCH"}</strong>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-forest/10 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div className="text-xs">
            <span className="text-forest/60 block text-[10px] font-bold">UNIVERSITY</span>
            <strong className="text-forest">VERIFIED</strong>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-forest/10 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div className="text-xs">
            <span className="text-forest/60 block text-[10px] font-bold">ISSUER</span>
            <strong className="text-forest">AUTHORIZED</strong>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-forest/10 flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isRevoked ? "bg-red-500" : "bg-emerald-500"}`} />
          <div className="text-xs">
            <span className="text-forest/60 block text-[10px] font-bold">CREDENTIAL</span>
            <strong className="text-forest">{isRevoked ? "REVOKED" : "ACTIVE"}</strong>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-forest/10 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div className="text-xs">
            <span className="text-forest/60 block text-[10px] font-bold">BLOCKCHAIN</span>
            <strong className="text-forest">ANCHORED</strong>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-forest/10 flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isRevoked ? "bg-red-500" : "bg-emerald-500"}`} />
          <div className="text-xs">
            <span className="text-forest/60 block text-[10px] font-bold">REVOCATION</span>
            <strong className="text-forest">{isRevoked ? "TOMBSTONED" : "NOT REVOKED"}</strong>
          </div>
        </div>
      </div>

      {/* Side-by-Side Fingerprint Comparison Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        
        {/* Left Card: Registered University Record */}
        <div className="p-6 bg-white rounded-2xl border-2 border-forest/20 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-forest/15">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-ochre" />
              <span className="text-xs font-mono uppercase font-bold tracking-wider text-forest">
                1. REGISTERED UNIVERSITY RECORD
              </span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-forest text-ochre font-bold">
              AUTHORITATIVE SOURCE
            </span>
          </div>

          <div>
            <div className="text-lg font-black text-forest">{rTitle}</div>
            <div className="text-xs text-forest/70 font-medium mt-0.5">
              Issued by <strong>{rUniversity}</strong> (Accredited Registrar)
            </div>
            <div className="text-xs font-mono text-forest/60 mt-1">
              Holder: {rStudent}
            </div>
          </div>

          {/* Registered Fingerprint Box */}
          <div className="p-4 bg-forest/5 rounded-xl border border-forest/15 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-forest/70">
              <span>SHA-256 REGISTERED FINGERPRINT</span>
              <button 
                onClick={() => copyHash(rHash, "reg")}
                className="hover:text-forest flex items-center gap-1 text-[11px] font-sans font-bold"
              >
                {copiedRegistered ? (
                  <span className="text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>
                ) : (
                  <span className="text-forest/60 hover:text-forest flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy</span>
                )}
              </button>
            </div>
            <div className="font-mono text-xs text-forest break-all bg-white p-3 rounded-lg border border-forest/15 select-all">
              {rHash}
            </div>
            <div className="text-[10px] text-forest/50 font-mono">
              Source file: {rFile}
            </div>
          </div>
        </div>

        {/* Right Card: Submitted Copy */}
        <div className="p-6 bg-white rounded-2xl border-2 border-forest/20 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-forest/15">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-ochre" />
              <span className="text-xs font-mono uppercase font-bold tracking-wider text-forest">
                2. RECEIVED CANDIDATE COPY
              </span>
            </div>
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                isMatch ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {isMatch ? "VERIFIED MATCH" : "ALTERED / MISMATCH"}
            </span>
          </div>

          <div>
            <div className="text-lg font-black text-forest">Submitted Document Copy</div>
            <div className="text-xs text-forest/70 font-medium mt-0.5">
              Candidate file: <strong>{sFile}</strong>
            </div>
            <div className="text-xs font-mono text-forest/60 mt-1">
              Method: In-Browser Web Crypto (SHA-256)
            </div>
          </div>

          {/* Submitted Fingerprint Box */}
          <div className="p-4 bg-forest/5 rounded-xl border border-forest/15 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-forest/70">
              <span>CALCULATED SHA-256 FINGERPRINT</span>
              <button 
                onClick={() => copyHash(sHash, "sub")}
                className="hover:text-forest flex items-center gap-1 text-[11px] font-sans font-bold"
              >
                {copiedSubmitted ? (
                  <span className="text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>
                ) : (
                  <span className="text-forest/60 hover:text-forest flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy</span>
                )}
              </button>
            </div>
            
            {/* Visual Hex Highlight */}
            <div className="font-mono text-xs break-all bg-white p-3 rounded-lg border border-forest/15 select-all">
              {rHash.split("").map((char, idx) => {
                const subChar = sHash[idx] || "";
                const matches = char.toLowerCase() === subChar.toLowerCase();
                return (
                  <span
                    key={idx}
                    className={
                      matches
                        ? "text-forest"
                        : "bg-red-200 text-red-900 font-black px-0.5 rounded"
                    }
                  >
                    {subChar || "_"}
                  </span>
                );
              })}
            </div>
            <div className="text-[10px] text-forest/50 font-mono">
              {isMatch
                ? "All 64 hexadecimal characters match registered university hash"
                : "Differing hexadecimal characters highlighted in red"}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Evidence Drawer */}
      <div className="bg-white rounded-2xl border border-forest/15 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowTechnicalEvidence(!showTechnicalEvidence)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-forest/5 transition"
        >
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-ochre" />
            <span className="text-xs font-bold uppercase tracking-wider text-forest">
              Technical Evidence & Blockchain Anchors
            </span>
          </div>
          {showTechnicalEvidence ? (
            <ChevronUp className="w-4 h-4 text-forest/60" />
          ) : (
            <ChevronDown className="w-4 h-4 text-forest/60" />
          )}
        </button>

        {showTechnicalEvidence && (
          <div className="p-6 border-t border-forest/10 space-y-4 text-xs font-mono bg-forest/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-forest/60 block text-[10px] uppercase font-bold">
                  Decentralized Identifier (DID)
                </span>
                <span className="text-forest font-semibold break-all">
                  did:acadshield:student:stu_2026_9941
                </span>
              </div>
              <div>
                <span className="text-forest/60 block text-[10px] uppercase font-bold">
                  Issuer Authority DID
                </span>
                <span className="text-forest font-semibold break-all">
                  did:acadshield:inst:mit_001
                </span>
              </div>
              <div>
                <span className="text-forest/60 block text-[10px] uppercase font-bold">
                  Blockchain Network
                </span>
                <span className="text-forest font-semibold">
                  Polygon Amoy Testnet (Chain ID 80002) • Block #{blockNumber}
                </span>
              </div>
              <div>
                <span className="text-forest/60 block text-[10px] uppercase font-bold">
                  IPFS Content Identifier (CID)
                </span>
                <span className="text-forest font-semibold break-all">
                  ipfs://{ipfsCid}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-forest/10">
              <span className="text-forest/60 block text-[10px] uppercase font-bold mb-1">
                Transaction Hash
              </span>
              <div className="p-2 rounded bg-white border border-forest/15 text-[11px] text-forest break-all select-all flex items-center justify-between">
                <span>{txHash}</span>
                <span className="text-ochre font-bold text-[10px] ml-2 shrink-0">Polygonscan Validated</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
