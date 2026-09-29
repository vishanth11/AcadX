"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronLeft, ExternalLink, KeyRound, Search, ShieldCheck, XCircle } from "lucide-react";

type ResolverResult = {
  credentialId: string;
  credentialType: string;
  issuer: { name: string; status: string };
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  documentSha256: string | null;
  decision: string;
  checks: { issuer: string; credentialProof: string; sourceRecord: string; blockchain: string };
};

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function CompanyVerifyCredentialPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResolverResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const response = await fetch(`${apiBase}/verify/${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(response.status === 404 ? "No credential record was found for this identifier." : "Credential lookup is unavailable. Try again later.");
        return;
      }
      setResult(body as ResolverResult);
    } catch {
      setError("Could not reach the credential verification service.");
    } finally {
      setLoading(false);
    }
  }

  const positive = result?.decision === "VERIFIED";
  const negative = result && ["INVALID", "MISMATCH", "REVOKED", "EXPIRED"].includes(result.decision);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/company/verify" className="inline-flex items-center gap-2 text-xs font-semibold text-forest/70 hover:text-forest transition">
          <ChevronLeft className="w-4 h-4" /> Back to Verification Hub
        </Link>
        <Link href="/company/verify/document" className="px-3.5 py-1.5 rounded-xl border border-forest/20 text-xs font-bold text-forest hover:bg-forest/5">
          Verify a Submitted Document
        </Link>
      </div>

      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/15 text-xs font-semibold text-forest mb-2">
          <KeyRound className="w-3.5 h-3.5 text-ochre" /> Public Credential Resolver
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">Verify a Credential ID</h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">Looks up a credential in the AcadShield Core database and shows the checks the service actually performed. A review-required result is not a verification.</p>
      </div>

      <div className="bg-white/80 border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm">
        <form onSubmit={handleVerify} className="space-y-3">
          <label htmlFor="credential-id" className="block text-xs font-bold text-forest uppercase tracking-wider">Credential UUID</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input id="credential-id" type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter credential ID" className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-forest/20 bg-forest/5 text-forest font-mono text-sm focus:outline-none focus:border-forest" required />
            </div>
            <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-forest hover:bg-forest/90 disabled:opacity-50 text-white font-bold text-sm">
              {loading ? "Checking…" : "Resolve"}
            </button>
          </div>
        </form>
      </div>

      {error && <div role="alert" className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex gap-3 text-sm text-amber-950"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}

      {result && (
        <section aria-live="polite" className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-3 pb-5 border-b border-forest/10">
            {positive ? <CheckCircle2 className="w-8 h-8 text-emerald-700" /> : negative ? <XCircle className="w-8 h-8 text-red-700" /> : <ShieldCheck className="w-8 h-8 text-amber-700" />}
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-forest/50">Decision</div>
              <h2 className="text-xl font-extrabold text-forest">{result.decision}</h2>
              {!positive && <p className="text-sm text-forest/70 mt-1">The configured source and chain checks are incomplete. Do not treat this record as independently verified.</p>}
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs uppercase font-bold text-forest/50">Credential ID</dt><dd className="font-mono break-all text-forest">{result.credentialId}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Credential type</dt><dd className="text-forest">{result.credentialType}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Issuer</dt><dd className="text-forest">{result.issuer.name} · {result.issuer.status}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Lifecycle</dt><dd className="text-forest">{result.status}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Issued</dt><dd className="text-forest">{new Date(result.issuedAt).toLocaleString()}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Expires</dt><dd className="text-forest">{result.expiresAt ? new Date(result.expiresAt).toLocaleString() : "No expiry recorded"}</dd></div>
          </dl>

          <div className="rounded-2xl border border-forest/10 overflow-hidden">
            <h3 className="px-4 py-3 bg-forest/5 text-xs font-bold uppercase tracking-wide text-forest">Evidence checks</h3>
            <dl className="divide-y divide-forest/10 text-sm">
              {Object.entries(result.checks).map(([name, value]) => <div key={name} className="px-4 py-3 flex justify-between gap-4"><dt className="capitalize text-forest/70">{name.replace(/([A-Z])/g, " $1")}</dt><dd className="font-mono text-right text-forest">{value}</dd></div>)}
            </dl>
          </div>

          {result.documentSha256 && <div><div className="text-xs uppercase font-bold text-forest/50 mb-2">Registered document SHA-256</div><code className="block break-all rounded-xl bg-forest/5 p-4 text-xs text-forest">{result.documentSha256}</code></div>}
          <Link href={`/verify/${encodeURIComponent(result.credentialId)}`} target="_blank" className="inline-flex items-center gap-2 text-xs font-bold text-forest hover:underline"><ExternalLink className="w-4 h-4" />Open public resolver</Link>
        </section>
      )}
    </div>
  );
}
