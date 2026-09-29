"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, Building2, CheckCircle2, FileCheck2, Plus, RefreshCw, ShieldCheck } from "lucide-react";

type DocumentRecord = { id: string; originalFileName: string; documentSha256: string; documentType: string | null; status: string; createdAt: string };
type CredentialRecord = { id: string; credentialType: string; status: string; issuedAt: string | null; transactionHash: string | null; document: { originalFileName: string; documentType: string | null } | null };

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function UniversityDashboardPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`${apiBase}/documents`, { credentials: "include", cache: "no-store" }),
      fetch(`${apiBase}/credentials`, { credentials: "include", cache: "no-store" }),
    ])
      .then(async ([documentResponse, credentialResponse]) => {
        const [documentBody, credentialBody] = await Promise.all([documentResponse.json(), credentialResponse.json()]);
        if (!documentResponse.ok || !credentialResponse.ok) {
          throw new Error(documentResponse.status === 401 || documentResponse.status === 403 || credentialResponse.status === 401 || credentialResponse.status === 403
            ? "Your university session expired. Sign in again."
            : "Could not load the institutional registry.");
        }
        if (active) {
          setDocuments((documentBody.documents || []) as DocumentRecord[]);
          setCredentials((credentialBody.credentials || []) as CredentialRecord[]);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load the institutional registry.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const metrics = [
    { label: "Source documents", value: documents.length, note: "Institution records", icon: FileCheck2, color: "text-forest" },
    { label: "Approved", value: documents.filter((item) => item.status === "VERIFIED").length, note: "Reviewed source files", icon: CheckCircle2, color: "text-emerald-700" },
    { label: "Needs review", value: documents.filter((item) => item.status === "REVIEW_REQUIRED" || item.status === "UPLOADED").length, note: "Awaiting a decision", icon: Building2, color: "text-amber-700" },
    { label: "Active credentials", value: credentials.filter((item) => item.status === "ACTIVE").length, note: "Registry credentials", icon: Award, color: "text-emerald-700" },
    { label: "Revoked", value: credentials.filter((item) => item.status === "REVOKED").length, note: "Credential lifecycle", icon: ShieldCheck, color: "text-red-700" },
    { label: "On-chain receipts", value: credentials.filter((item) => Boolean(item.transactionHash)).length, note: "Confirmed transactions", icon: Building2, color: "text-forest" },
  ];

  return (
    <div className="p-6 sm:p-10 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-forest/15">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" /> LIVE INSTITUTION REGISTRY
          </div>
          <h1 className="mt-3 text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">University overview</h1>
          <p className="mt-1 text-forest/75 text-sm">Source documents and credentials belonging to your institution.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-forest/20 bg-white px-4 py-3 text-xs font-bold text-forest disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <Link href="/university/documents/upload" className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-forest/90">
            <Plus className="h-4 w-4 text-ochre" /> Upload source document
          </Link>
          <Link href="/university/credentials/create" className="inline-flex items-center gap-2 rounded-xl border border-forest/20 px-4 py-3 text-xs font-bold text-forest hover:bg-forest/5">
            <Award className="h-4 w-4 text-ochre" /> Issue credential
          </Link>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{error}</div>}

      <section aria-label="Institution registry totals" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map(({ label, value, note, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm">
            <Icon className={`h-5 w-5 ${color}`} />
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-forest/60">{label}</p>
            <p className={`mt-1 text-2xl font-black ${color}`}>{loading ? "—" : value}</p>
            <p className="mt-1 text-[11px] text-forest/50">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-forest/10 pb-4">
            <div><h2 className="font-bold text-forest">Recent source documents</h2><p className="mt-1 text-xs text-forest/60">Live records from your institutional registry</p></div>
            <Link href="/university/documents" className="inline-flex items-center gap-1 text-xs font-bold text-ochre">Document center <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {documents.length ? <ul className="divide-y divide-forest/10">
            {documents.slice(0, 5).map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0"><p className="truncate text-sm font-bold text-forest">{document.originalFileName}</p><p className="text-xs text-forest/65">{document.documentType || "Academic document"}</p><code className="block truncate text-[10px] text-forest/45">SHA-256 {document.documentSha256}</code></div>
                <div className="shrink-0 text-right"><span className="rounded-full bg-forest/5 px-2.5 py-1 text-[10px] font-bold">{document.status}</span><p className="mt-1 text-[10px] text-forest/45">{new Date(document.createdAt).toLocaleDateString()}</p></div>
              </li>
            ))}
          </ul> : <p className="py-8 text-center text-sm text-forest/60">{loading ? "Loading documents…" : "No source documents have been uploaded."}</p>}
        </article>

        <article className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-forest/10 pb-4">
            <div><h2 className="font-bold text-forest">Recent credentials</h2><p className="mt-1 text-xs text-forest/60">Issued credentials and confirmed chain receipts</p></div>
            <Link href="/university/credentials" className="inline-flex items-center gap-1 text-xs font-bold text-ochre">Credential registry <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {credentials.length ? <ul className="divide-y divide-forest/10">
            {credentials.slice(0, 5).map((credential) => (
              <li key={credential.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0"><p className="truncate text-sm font-bold text-forest">{credential.credentialType}</p><p className="text-xs text-forest/65">{credential.document?.originalFileName || "No source filename"}</p><code className="block truncate text-[10px] text-forest/45">{credential.id}</code></div>
                <div className="shrink-0 text-right"><span className="rounded-full bg-forest/5 px-2.5 py-1 text-[10px] font-bold">{credential.status}</span><p className="mt-1 text-[10px] text-forest/45">{credential.transactionHash ? "On-chain receipt" : "Not minted"}</p></div>
              </li>
            ))}
          </ul> : <p className="py-8 text-center text-sm text-forest/60">{loading ? "Loading credentials…" : "No credentials have been issued."}</p>}
        </article>
      </section>

      <section className="rounded-2xl bg-forest p-6 text-white">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Building2 className="h-4 w-4 text-ochre" /> Issuer workflow</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/80">A source document must be reviewed and approved before it can support credential issuance. On-chain minting is a separate action and is shown only when a transaction receipt exists.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold">
          <Link href="/university/templates" className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">Manage templates</Link>
          <Link href="/university/qr" className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10">Credential QR</Link>
        </div>
      </section>
    </div>
  );
}
