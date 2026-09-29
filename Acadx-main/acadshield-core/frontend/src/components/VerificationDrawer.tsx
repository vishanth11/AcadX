"use client";

import React, { useState } from "react";
import type { CredentialRecord } from "../lib/credentials-data";
import { ShieldCheck, AlertTriangle, Clock, XCircle, ExternalLink, Check, Copy, FileText, QrCode } from "lucide-react";
import { demoEnabled } from "@/lib/demo-mode";

interface VerificationDrawerProps {
  credential: CredentialRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VerificationDrawer({ credential, isOpen, onClose }: VerificationDrawerProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showJsonPayload, setShowJsonPayload] = useState(false);

  if (!demoEnabled || !isOpen || !credential) return null;

  const getStatusBadge = () => {
    switch (credential.status) {
      case "ACTIVE":
        return {
          bg: "bg-[#0B251D] text-[#E5B25D]",
          icon: <ShieldCheck className="w-5 h-5 text-[#E5B25D]" />,
          text: "VERIFIED & ACTIVE",
          sub: "Cryptographic hash, issuer status and blockchain proof fully verified.",
        };
      case "REVOKED":
        return {
          bg: "bg-[#7A1C1C] text-[#FDE8E8]",
          icon: <AlertTriangle className="w-5 h-5 text-[#FDE8E8]" />,
          text: "PERMANENTLY REVOKED",
          sub: credential.dates.revocationReason || "Credential revoked by authorized institution committee.",
        };
      case "EXPIRED":
        return {
          bg: "bg-[#7A5210] text-[#FEF3C7]",
          icon: <Clock className="w-5 h-5 text-[#FEF3C7]" />,
          text: "EXPIRED CREDENTIAL",
          sub: `Credential validity ended on ${new Date(credential.dates.expires || "").toLocaleDateString()}.`,
        };
      case "ISSUER_UNVERIFIED":
      default:
        return {
          bg: "bg-[#4B5563] text-white",
          icon: <XCircle className="w-5 h-5 text-white" />,
          text: "ISSUER NOT VERIFIED",
          sub: "Issuing institution is in PENDING review status and cannot issue verified credentials.",
        };
    }
  };

  const badge = getStatusBadge();
  const verifyUrl = `https://acadshield.example/verify/${credential.opaqueId}`;

  const copyToClipboard = (text: string, type: "link" | "hash") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0B251D]/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#FAF7F2] border-2 border-[#0B251D] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#0B251D]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#0B251D]/20">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E5B25D] animate-ping" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#0B251D]/70 font-semibold">
              PUBLIC VERIFICATION AUDIT RECORD
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#0B251D]/60 hover:text-[#0B251D] hover:bg-[#0B251D]/5 rounded-full transition-colors"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Status Callout Banner */}
        <div className={`mt-5 p-4 rounded-xl flex items-start gap-3.5 ${badge.bg}`}>
          <div className="mt-0.5">{badge.icon}</div>
          <div className="flex-1">
            <div className="font-bold tracking-wide text-base">{badge.text}</div>
            <div className="text-xs opacity-90 mt-0.5">{badge.sub}</div>
          </div>
        </div>

        {/* Primary Credential Details */}
        <div className="mt-6 space-y-4">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-[#0B251D]/60 font-semibold">
              CREDENTIAL TITLE
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[#0B251D] mt-0.5">
              {credential.title}
            </h2>
            <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#0B251D]/10 text-[#0B251D]">
              {credential.type}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#0B251D]/10">
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-[#0B251D]/60">ISSUING INSTITUTION</div>
              <div className="font-bold text-base mt-0.5 flex items-center gap-1.5">
                {credential.issuer.name}
                {credential.issuer.verified && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#0B251D] bg-[#E5B25D] px-2 py-0.2 rounded-full">
                    <Check className="w-3 h-3" /> VERIFIED
                  </span>
                )}
              </div>
              <div className="text-xs text-[#0B251D]/70 font-mono mt-0.5">{credential.issuer.domain} · {credential.issuer.country}</div>
            </div>

            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-[#0B251D]/60">CREDENTIAL HOLDER</div>
              <div className="font-bold text-base mt-0.5">{credential.holder.name}</div>
              <div className="text-xs font-mono text-[#0B251D]/70 truncate mt-0.5">
                DID: {credential.holder.did}
              </div>
            </div>
          </div>
        </div>

        {/* 8-Point Cryptographic Checklist */}
        <div className="mt-6 p-4 rounded-xl bg-white/70 border border-[#0B251D]/15">
          <div className="text-xs uppercase font-mono tracking-wider font-bold text-[#0B251D] mb-3">
            8-POINT AUDIT PROOF VERIFICATION
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0B251D]" />
              <span>Record Exists in Primary Registry</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0B251D]" />
              <span>Accredited Institution Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0B251D]" />
              <span>Digital Key Signature Valid (EIP-712)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0B251D]" />
              <span>Polygon Amoy On-Chain Proof Matched</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0B251D]" />
              <span>Document SHA-256 Hash Unaltered</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0B251D]" />
              <span>IPFS CID Content Addressed</span>
            </div>
            <div className="flex items-center gap-2">
              {credential.status === "REVOKED" ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Check className="w-4 h-4 text-[#0B251D]" />
              )}
              <span>Lifecycle State: {credential.status}</span>
            </div>
            <div className="flex items-center gap-2">
              {credential.status === "EXPIRED" ? (
                <XCircle className="w-4 h-4 text-amber-600" />
              ) : (
                <Check className="w-4 h-4 text-[#0B251D]" />
              )}
              <span>Expiration Date Evaluation</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Hash Comparison & Blockchain Anchors */}
        <div className="mt-6 space-y-3 font-mono text-xs">
          <div className="p-3 bg-[#0B251D]/5 rounded-lg border border-[#0B251D]/10">
            <div className="flex justify-between items-center text-[#0B251D]/70 font-semibold mb-1">
              <span>DOCUMENT SHA-256 HASH PROOF</span>
              <button 
                onClick={() => copyToClipboard(credential.integrity.documentHash, "hash")}
                className="flex items-center gap-1 hover:text-[#0B251D] text-[#0B251D]/60"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedHash ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="break-all font-mono text-[#0B251D] bg-white p-2 rounded border border-[#0B251D]/10">
              {credential.integrity.documentHash}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-[#0B251D]/5 rounded-lg border border-[#0B251D]/10">
              <div className="text-[#0B251D]/70 font-semibold mb-1">POLYGON AMOY TOKEN ID</div>
              <div className="text-sm font-bold text-[#0B251D]">#{credential.blockchain.tokenId} (ERC-721)</div>
              <div className="text-[11px] text-[#0B251D]/60 mt-1">Block #{credential.blockchain.blockNumber}</div>
            </div>

            <div className="p-3 bg-[#0B251D]/5 rounded-lg border border-[#0B251D]/10">
              <div className="text-[#0B251D]/70 font-semibold mb-1">TRANSACTION HASH</div>
              <div className="truncate font-bold text-[#0B251D]">{credential.blockchain.transactionHash}</div>
              <a 
                href={`https://amoy.polygonscan.com/tx/${credential.blockchain.transactionHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#C88A32] hover:underline flex items-center gap-1 mt-1 font-sans font-medium"
              >
                Polygonscan Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* QR Code and Sharing Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#FAF7F2] border-2 border-[#0B251D]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-[#0B251D]/20 shadow-sm">
              <QrCode className="w-12 h-12 text-[#0B251D]" />
            </div>
            <div>
              <div className="font-bold text-sm">Instant Public QR Verification</div>
              <div className="text-xs text-[#0B251D]/70">Zero-login required for employers & verifiers.</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => copyToClipboard(verifyUrl, "link")}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#0B251D] text-[#FAF7F2] hover:bg-[#0B251D]/90 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#E5B25D]" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? "Link Copied" : "Copy Link"}
            </button>

            <button
              onClick={() => setShowJsonPayload(!showJsonPayload)}
              className="px-3.5 py-2 border border-[#0B251D]/30 hover:border-[#0B251D] rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {showJsonPayload ? "Hide JSON" : "W3C VC JSON"}
            </button>
          </div>
        </div>

        {/* W3C VC JSON-LD Viewer */}
        {showJsonPayload && (
          <div className="mt-4 p-4 bg-[#0B251D] text-[#FAF7F2] rounded-xl font-mono text-xs overflow-x-auto">
            <div className="text-[#E5B25D] font-bold mb-2">W3C Verifiable Credential Payload</div>
            <pre className="whitespace-pre">{JSON.stringify(credential.w3cPayload, null, 2)}</pre>
          </div>
        )}

      </div>
    </div>
  );
}
