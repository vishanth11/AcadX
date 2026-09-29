"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePlatformState } from "@/lib/platform-state";
import { Ban, ArrowLeft, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function DocumentRevocationPage() {
  const params = useParams();
  const router = useRouter();
  const docId = (params?.id as string) || "doc_mit_degree_001";
  const { documents, revokeCredential } = usePlatformState();

  const doc = documents.find((d) => d.id === docId) || documents[0];

  const [reason, setReason] = useState("Administrative correction");
  const [notes, setNotes] = useState("Official registrar committee integrity review audit resolution.");
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokedComplete, setRevokedComplete] = useState(false);

  const handleRevoke = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRevoking(true);
    setTimeout(() => {
      if (doc.credentialId) {
        revokeCredential(doc.credentialId, `${reason}: ${notes}`);
      }
      setIsRevoking(false);
      setRevokedComplete(true);
    }, 1000);
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-1 pb-6 border-b border-forest/15">
        <Link
          href={`/university/documents/${doc.id}`}
          className="text-xs font-bold text-forest/60 hover:text-forest flex items-center gap-1.5 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Document Dossier
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight headline-shadow font-serif text-red-900">
            Revoke Academic Document Record
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
            HIGH INTEGRITY ACTION
          </span>
        </div>
        <p className="text-xs text-forest/70">
          Revocation updates public verification status immediately to <strong>REVOKED</strong>. Historical registration is permanently preserved on the audit ledger.
        </p>
      </div>

      {!revokedComplete ? (
        <form onSubmit={handleRevoke} className="bg-white border-2 border-red-900/20 rounded-3xl p-8 shadow-sm space-y-6 text-xs">
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-1.5 text-red-950">
            <span className="font-bold uppercase tracking-wider text-[10px] text-red-700 block">
              Target Document for Revocation
            </span>
            <div className="text-base font-bold">{doc.documentType}</div>
            <div>Awarded to: <strong>{doc.studentName}</strong> (DID: {doc.studentDid})</div>
            <div className="font-mono text-[11px]">Serial: {doc.documentNumber} � Hash: {doc.sha256Hash.slice(0, 24)}...</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-forest mb-1">
                Select Mandatory Revocation Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Administrative correction">Administrative correction</option>
                <option value="Duplicate issuance">Duplicate issuance</option>
                <option value="Incorrect information">Incorrect information</option>
                <option value="Credential withdrawn">Credential withdrawn</option>
                <option value="Academic record correction">Academic record correction</option>
                <option value="Institutional disciplinary action">Institutional disciplinary action</option>
                <option value="Other verified cause">Other verified cause</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-forest mb-1">
                Supporting Explanation & Justification *
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-forest/20 bg-forest/5 text-forest text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-forest/5 border border-forest/10 text-forest/70 space-y-1">
            <strong>Audit Transparency Guarantee: </strong>
            Public verification queries will immediately reflect REVOKED status. Verifiers will see that this record was administratively invalidated while preserving historical verification proof.
          </div>

          <div className="flex justify-end pt-4 border-t border-forest/10 gap-3">
            <Link
              href={`/university/documents/${doc.id}`}
              className="px-4 py-2.5 rounded-xl border border-forest/20 font-bold text-xs hover:bg-forest/5 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isRevoking}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              {isRevoking ? "Signing Cryptographic Revocation..." : "Confirm & Inscribe Revocation"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white border-2 border-red-500 rounded-3xl p-10 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <Ban className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-black text-forest">
            Record Revoked � Cryptographic Tombstone Inscribed
          </h2>
          <p className="text-xs text-forest/75 max-w-lg mx-auto leading-relaxed">
            The document <strong>{doc.documentType}</strong> has been revoked. All verifier checks will immediately reflect the revocation status.
          </p>

          <div className="pt-4 flex justify-center gap-3">
            <Link
              href="/university/documents"
              className="px-5 py-2.5 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition shadow"
            >
              Return to Document Center
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
