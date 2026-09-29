"use client";

import React, { useState } from "react";
import { Upload, CheckCircle2, Shield, Loader2, ArrowRight } from "lucide-react";
import { demoEnabled } from "@/lib/demo-mode";

export default function IssuerSimulationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "hashing" | "minting" | "success">("form");
  const [fileName, setFileName] = useState("");
  const [computedHash, setComputedHash] = useState("");
  const [candidateName, setCandidateName] = useState("Eleanor Hughes");
  const [credentialType, setCredentialType] = useState("DEGREE");
  const [credentialTitle, setCredentialTitle] = useState("Master of Science in Cybersecurity");

  if (!demoEnabled || !isOpen) return null;

  // Real SHA-256 hash computation in the browser using Web Crypto API
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    setComputedHash(hashHex);
  };

  const handleSimulateIssuance = () => {
    if (!computedHash) {
      setComputedHash("0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join(""));
    }
    setStep("hashing");
    setTimeout(() => {
      setStep("minting");
      setTimeout(() => {
        setStep("success");
      }, 1600);
    }, 1200);
  };

  const reset = () => {
    setStep("form");
    setFileName("");
    setComputedHash("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0B251D]/65 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#FAF7F2] border-2 border-[#0B251D] rounded-3xl shadow-2xl p-6 sm:p-8 text-[#0B251D]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#0B251D]/15">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#E5B25D]" />
            <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#0B251D]">
              AUTHORIZED ISSUER CONSOLE SIMULATOR
            </span>
          </div>
          <button onClick={reset} className="text-xl leading-none text-[#0B251D]/50 hover:text-[#0B251D]">&times;</button>
        </div>

        {step === "form" && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase font-mono tracking-wider text-[#0B251D]/70 font-semibold block mb-1">
                SELECT CREDENTIAL TYPE
              </label>
              <select
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#0B251D]/25 rounded-xl font-medium text-sm focus:outline-none focus:border-[#0B251D]"
              >
                <option value="DEGREE">DEGREE — Bachelor, Master, PhD</option>
                <option value="DIPLOMA">DIPLOMA — Polytechnic & Technical</option>
                <option value="PROFESSIONAL_CERTIFICATION">PROFESSIONAL CERTIFICATION</option>
                <option value="COURSE_CERTIFICATE">COURSE COMPLETION CERTIFICATE</option>
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-mono tracking-wider text-[#0B251D]/70 font-semibold block mb-1">
                CREDENTIAL TITLE
              </label>
              <input
                type="text"
                value={credentialTitle}
                onChange={(e) => setCredentialTitle(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#0B251D]/25 rounded-xl font-medium text-sm focus:outline-none focus:border-[#0B251D]"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-mono tracking-wider text-[#0B251D]/70 font-semibold block mb-1">
                STUDENT RECIPIENT NAME
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#0B251D]/25 rounded-xl font-medium text-sm focus:outline-none focus:border-[#0B251D]"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-mono tracking-wider text-[#0B251D]/70 font-semibold block mb-1">
                UPLOAD CERTIFICATE DOCUMENT (PDF / IMAGE)
              </label>
              <div className="border-2 border-dashed border-[#0B251D]/30 rounded-xl p-4 text-center bg-white/50 hover:bg-white transition-colors cursor-pointer relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-6 h-6 text-[#C88A32] mx-auto mb-1" />
                <div className="text-xs font-semibold text-[#0B251D]">
                  {fileName ? fileName : "Click to select certificate file for SHA-256 calculation"}
                </div>
                <div className="text-[11px] text-[#0B251D]/50 font-mono mt-0.5">
                  Computes real bit-for-bit SHA-256 in browser
                </div>
              </div>
            </div>

            {computedHash && (
              <div className="p-3 bg-[#0B251D]/5 rounded-xl border border-[#0B251D]/10">
                <div className="text-[11px] font-mono text-[#0B251D]/70 font-semibold mb-0.5">COMPUTED SHA-256 HASH</div>
                <div className="text-xs font-mono text-[#0B251D] break-all">{computedHash}</div>
              </div>
            )}

            <button
              onClick={handleSimulateIssuance}
              className="w-full mt-4 py-3 bg-[#0B251D] text-[#FAF7F2] hover:bg-[#0B251D]/90 rounded-xl font-bold tracking-wider uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              Anchor to Blockchain & Mint Credential <ArrowRight className="w-4 h-4 text-[#E5B25D]" />
            </button>
          </div>
        )}

        {(step === "hashing" || step === "minting") && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-[#E5B25D] animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-[#0B251D]">
              {step === "hashing" ? "Pinning Canonical W3C Metadata to IPFS..." : "Broadcasting Transaction to Polygon Amoy..."}
            </h3>
            <p className="text-xs font-mono text-[#0B251D]/70 max-w-sm mx-auto">
              Invoking CredentialNFT.sol :: mintCredential() with document SHA-256 hash.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-[#0B251D] mx-auto animate-bounce" />
            <h3 className="text-2xl font-black text-[#0B251D]">Credential Minted & Active!</h3>
            <p className="text-xs text-[#0B251D]/75 max-w-md mx-auto">
              The verifiable credential for <strong>{candidateName}</strong> has been confirmed on Polygon Amoy with status <strong>ACTIVE</strong>.
            </p>

            <div className="p-4 bg-white rounded-xl border border-[#0B251D]/15 text-left font-mono text-xs space-y-2 mt-4">
              <div><span className="text-[#0B251D]/60 font-semibold">TOKEN ID:</span> #105 (ERC-721)</div>
              <div><span className="text-[#0B251D]/60 font-semibold">NETWORK:</span> Polygon Amoy (Chain ID 80002)</div>
              <div className="break-all"><span className="text-[#0B251D]/60 font-semibold">SHA-256:</span> {computedHash}</div>
              <div><span className="text-[#0B251D]/60 font-semibold">QR VERIFICATION:</span> https://verify.acadshield.example/c/cuid_sim_105</div>
            </div>

            <button
              onClick={reset}
              className="w-full mt-4 py-3 bg-[#0B251D] text-[#FAF7F2] rounded-xl font-bold tracking-wider uppercase text-xs"
            >
              Done / Return to Console
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
