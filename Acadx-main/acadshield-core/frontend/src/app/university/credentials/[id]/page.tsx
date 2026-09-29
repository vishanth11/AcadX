"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePlatformState } from "@/lib/platform-state";
import {
  Award,
  FileCheck2,
  Binary,
  ShieldCheck,
  QrCode,
  ExternalLink,
  ChevronLeft,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Share2,
  Lock,
  Layers,
  Sparkles,
  Download,
  Flame
} from "lucide-react";

export default function UniversityCredentialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const credId = params?.id as string;
  const { credentials, documents, revokeCredential } = usePlatformState();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("Administrative error during transcription");
  const [showJson, setShowJson] = useState(false);

  const credential = credentials.find((c) => c.id === credId) || credentials[0];
  const linkedDoc = documents.find((d) => d.id === credential.documentId);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRevoke = () => {
    revokeCredential(credential.id, revokeReason);
    setShowRevokeModal(false);
  };

  // Mock W3C Verifiable Credential Payload
  const vcPayload = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://acadshield.network/contexts/credentials/v2"
    ],
    id: `urn:uuid:${credential.id}`,
    type: ["VerifiableCredential", "AcademicDegreeCredential"],
    issuer: {
      id: "did:acadshield:issuer:univ-harvard",
      name: credential.universityName,
      accreditationBody: "NECHE Institutional Accreditation"
    },
    issuanceDate: credential.issueDate,
    credentialSubject: {
      id: credential.studentDid,
      name: credential.studentName,
      degree: {
        type: credential.type,
        name: credential.title,
        status: "COMPLETED"
      },
      documentHash: credential.documentHash
    },
    evidence: [
      {
        id: `urn:acadshield:doc:${credential.documentId}`,
        type: ["DocumentVerificationEvidence"],
        documentFingerprint: credential.documentHash,
        fingerprintAlgorithm: "SHA-256",
        ipfsStorage: "ipfs://QmZtmD2qtWBS7W1T7jya"
      }
    ],
    proof: {
      type: "Ed25519Signature2020",
      created: credential.issueDate,
      proofPurpose: "assertionMethod",
      verificationMethod: "did:acadshield:issuer:univ-harvard#key-1",
      jws: "eyJhbGciOiJFRDI1NTE5Ii...Njc4"
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/university/credentials"
          className="inline-flex items-center gap-2 text-xs font-semibold text-forest/70 hover:text-forest transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Credentials Registry
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/verify/${credential.id}`}
            target="_blank"
            className="px-3 py-1.5 rounded-xl border border-forest/20 text-xs font-semibold hover:bg-forest/5 flex items-center gap-1.5 text-forest"
          >
            <ExternalLink className="w-3.5 h-3.5 text-ochre" />
            Public Verification Resolver
          </Link>
          {credential.status === "ACTIVE" && (
            <button
              onClick={() => setShowRevokeModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              Revoke Credential
            </button>
          )}
        </div>
      </div>

      {/* Main Dossier Header */}
      <div className="bg-white/80 backdrop-blur border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest text-ochre flex items-center justify-center font-bold text-2xl border border-ochre/30 shadow">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-forest/50 font-bold uppercase tracking-wider">
                  {credential.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    credential.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}
                >
                  {credential.status}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-forest tracking-tight">
                {credential.title}
              </h1>
              <p className="text-xs text-forest/70 font-medium">
                Conferred upon <strong className="text-forest">{credential.studentName}</strong> by{" "}
                <strong className="text-forest">{credential.universityName}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-forest/5 p-4 rounded-2xl border border-forest/10">
            <div className="w-20 h-20 bg-white p-2 rounded-xl border border-forest/15 shadow-sm flex items-center justify-center">
              <QrCode className="w-16 h-16 text-forest" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-mono uppercase text-forest/60 font-bold block">
                Instant Verification QR
              </span>
              <p className="text-[11px] text-forest/80 max-w-[180px]">
                Scan to verify on-chain integrity without authentication.
              </p>
              <button
                onClick={() => copyToClipboard(`http://localhost:3000/verify/${credential.id}`, "qrUrl")}
                className="text-[11px] font-bold text-ochre hover:underline inline-flex items-center gap-1"
              >
                {copiedKey === "qrUrl" ? "Copied Link!" : "Copy Verification URL"}
              </button>
            </div>
          </div>
        </div>

        {credential.status === "REVOKED" && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <strong className="block font-bold">Credential Revoked</strong>
              Reason: {credential.revocationReason || "Revoked by institutional registrar"} on{" "}
              {credential.revokedAt ? new Date(credential.revokedAt).toLocaleString() : "Record file"}
            </div>
          </div>
        )}
      </div>

      {/* Grid of Proofs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Technical Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Source Document Card */}
          <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-forest">Authoritative Source Document</h3>
              </div>
              {linkedDoc && (
                <Link
                  href={`/university/documents/${linkedDoc.id}`}
                  className="text-xs font-bold text-ochre hover:underline flex items-center gap-1"
                >
                  View Document Dossier <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-forest/60 block text-[11px]">Document Title:</span>
                <span className="font-bold text-forest">{linkedDoc?.documentType || "Academic Record"}</span>
              </div>
              <div>
                <span className="text-forest/60 block text-[11px]">Document ID:</span>
                <span className="font-mono font-semibold text-forest">{credential.documentId}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-forest/60 block text-[11px]">Registered SHA-256 Fingerprint:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[11px] bg-forest/5 p-2 rounded-lg text-forest break-all border border-forest/10">
                    {credential.documentHash}
                  </span>
                  <button
                    onClick={() => copyToClipboard(credential.documentHash, "hash")}
                    className="p-1.5 rounded bg-forest/5 hover:bg-forest/10 text-forest shrink-0"
                    title="Copy SHA-256"
                  >
                    {copiedKey === "hash" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ERC-721 NFT & Blockchain Provenance */}
          <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-forest/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-forest">Non-Fungible Credential Token (ERC-721)</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-mono text-[10px] font-bold">
                Polygon Amoy Testnet
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-forest/60 block text-[11px]">Token Identifier:</span>
                <span className="font-mono font-extrabold text-forest text-sm">#{credential.blockchain.tokenId}</span>
              </div>
              <div>
                <span className="text-forest/60 block text-[11px]">Contract Address:</span>
                <span className="font-mono text-[11px] text-forest/80">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-forest/60 block text-[11px]">Transaction Hash:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[11px] bg-forest/5 p-2 rounded-lg text-forest break-all border border-forest/10">
                    {credential.blockchain.txHash}
                  </span>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${credential.blockchain.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded bg-forest text-white hover:bg-forest/90 shrink-0 text-[11px] font-bold flex items-center gap-1"
                  >
                    PolygonScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div>
                <span className="text-forest/60 block text-[11px]">Block Height:</span>
                <span className="font-mono font-bold text-forest">{credential.blockchain.blockNumber}</span>
              </div>
              <div>
                <span className="text-forest/60 block text-[11px]">Consensus Status:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed (128+ confirmations)
                </span>
              </div>
            </div>
          </div>

          {/* W3C Verifiable Credential Payload */}
          <div className="bg-white border border-forest/15 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-forest" />
                <h3 className="text-sm font-bold text-forest">W3C Verifiable Credential Payload</h3>
              </div>
              <button
                onClick={() => setShowJson(!showJson)}
                className="text-xs font-bold text-ochre hover:underline"
              >
                {showJson ? "Collapse JSON" : "Expand JSON Proof"}
              </button>
            </div>

            {showJson && (
              <pre className="p-4 rounded-xl bg-forest/95 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80 border border-forest/20">
                {JSON.stringify(vcPayload, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Right Column: Identity & Issuer Authority */}
        <div className="space-y-6">
          {/* Credential Holder */}
          <div className="bg-white border border-forest/15 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-forest uppercase tracking-wider">Credential Holder</h4>
            <div className="p-3 bg-forest/5 rounded-xl space-y-1.5 text-xs">
              <span className="font-extrabold text-forest block text-sm">{credential.studentName}</span>
              <span className="text-[11px] font-mono text-forest/70 break-all block">{credential.studentDid}</span>
              <div className="pt-2">
                <Link
                  href={`/university/students/STU-001`}
                  className="text-xs font-bold text-ochre hover:underline flex items-center gap-1"
                >
                  View Student Portfolio <ChevronLeft className="w-3 h-3 rotate-180" />
                </Link>
              </div>
            </div>
          </div>

          {/* Institutional Issuer */}
          <div className="bg-white border border-forest/15 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-forest uppercase tracking-wider">Accredited Issuing Authority</h4>
            <div className="p-3 bg-forest/5 rounded-xl space-y-2 text-xs">
              <span className="font-extrabold text-forest block">{credential.universityName}</span>
              <span className="text-forest/70 block">Authorized Signer: {credential.issuerName}</span>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                Verified Institutional Key
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revocation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-red-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-forest">Revoke Verifiable Credential</h3>
              <p className="text-xs text-forest/70 mt-1">
                Revoking this credential updates the on-chain status registry and invalidates future verifications. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-forest">Revocation Reason (Mandatory):</label>
              <select
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-forest/20 bg-forest/5 font-medium"
              >
                <option value="Administrative error during transcription">Administrative error during transcription</option>
                <option value="Student transfer to secondary institution">Student transfer to secondary institution</option>
                <option value="Superseded by re-evaluated academic transcript">Superseded by re-evaluated academic transcript</option>
                <option value="Academic misconduct or disciplinary revocation">Academic misconduct or disciplinary revocation</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-forest/10">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 rounded-xl border border-forest/20 text-xs font-bold text-forest hover:bg-forest/5"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
