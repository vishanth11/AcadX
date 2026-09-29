"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Download, FileCheck2 } from "lucide-react";

type Verification = { id: string; credentialId: string | null; documentId: string | null; decision: string; deterministicEvidence: Record<string, unknown>; aiEvidence: unknown; sourceStatus: string | null; createdAt: string; credential: { id: string; credentialType: string; issuerDid: string; credentialSha256: string; document: { documentType: string | null; originalFileName: string; documentSha256: string } | null } | null };
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function VerificationDossierPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<Verification | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/company/verifications/${encodeURIComponent(params.id)}`, { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(response.status === 404 ? "Verification record not found for this company." : "Could not retrieve verification evidence.");
        return body.verification as Verification;
      })
      .then((body) => { if (active) setRecord(body); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not retrieve evidence."); });
    return () => { active = false; };
  }, [params.id]);

  function exportEvidence() {
    if (!record) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `verification-${record.id}.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  return (
    <main className="p-6 lg:p-8 space-y-7 max-w-5xl mx-auto">
      <div className="flex items-center justify-between"><Link href="/company/verifications" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" />Back to history</Link>{record && <button onClick={exportEvidence} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold"><Download className="h-4 w-4" />Export evidence JSON</button>}</div>
      {error && <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm flex gap-3"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</section>}
      {!record && !error && <div role="status" className="rounded-2xl border bg-white p-6">Loading verification record…</div>}
      {record && <>
        <section className="rounded-3xl border border-forest/15 bg-white p-6 lg:p-8 shadow-sm"><div className="flex items-start gap-3"><FileCheck2 className="h-8 w-8 text-ochre" /><div><div className="text-xs uppercase font-bold text-forest/50">Stored verification decision</div><h1 className="text-2xl font-extrabold">{record.decision}</h1><div className="mt-1 text-xs text-forest/60">{new Date(record.createdAt).toLocaleString()} · {record.id}</div></div></div></section>
        <section className="rounded-3xl border border-forest/15 bg-white p-6 lg:p-8 shadow-sm space-y-5"><h2 className="text-lg font-extrabold">Credential and source</h2><dl className="grid sm:grid-cols-2 gap-4 text-sm"><div><dt className="text-xs uppercase font-bold text-forest/50">Credential ID</dt><dd className="font-mono break-all">{record.credentialId || "Not found"}</dd></div><div><dt className="text-xs uppercase font-bold text-forest/50">Document ID</dt><dd className="font-mono break-all">{record.documentId || "Not found"}</dd></div><div><dt className="text-xs uppercase font-bold text-forest/50">Credential type</dt><dd>{record.credential?.credentialType || "Unavailable"}</dd></div><div><dt className="text-xs uppercase font-bold text-forest/50">Source</dt><dd>{record.sourceStatus || "Not checked"}</dd></div><div><dt className="text-xs uppercase font-bold text-forest/50">Submitted file SHA-256</dt><dd className="font-mono break-all">{String(record.deterministicEvidence.submittedFileSha256 || "Not recorded")}</dd></div><div><dt className="text-xs uppercase font-bold text-forest/50">Registered file SHA-256</dt><dd className="font-mono break-all">{record.credential?.document?.documentSha256 || "Not recorded"}</dd></div></dl></section>
        <section className="rounded-3xl border border-forest/15 bg-white p-6 lg:p-8 shadow-sm space-y-5"><h2 className="text-lg font-extrabold">Deterministic evidence</h2><pre className="overflow-auto rounded-xl bg-forest/5 p-4 text-xs">{JSON.stringify(record.deterministicEvidence, null, 2)}</pre><h2 className="text-lg font-extrabold">AI evidence</h2><pre className="overflow-auto rounded-xl bg-forest/5 p-4 text-xs">{JSON.stringify(record.aiEvidence, null, 2)}</pre><p className="text-xs text-forest/60">AI evidence provides risk context only; it does not override issuer signature, lifecycle, hash, source, or chain results.</p></section>
      </>}
    </main>
  );
}
