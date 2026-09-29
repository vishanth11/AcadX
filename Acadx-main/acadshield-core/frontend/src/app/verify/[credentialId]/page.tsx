"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, XCircle } from "lucide-react";

type ResolverResult = {
  credentialId: string;
  credentialType: string;
  issuer: { name: string; status: string };
  status: string;
  issuedAt: string | null;
  expiresAt: string | null;
  documentSha256: string | null;
  sourceProvider: { status: string; provider: string; evidence: string[]; checkedAt: string };
  decision: string;
  checks: { issuer: string; credentialProof: string; sourceRecord: string; blockchain: string };
  chainProof: { chainId: number | null; contractAddress: string | null; tokenId: string | null; transactionHash: string | null; blockNumber: string | null; mintedAt: string | null; metadataCid: string | null; metadataUri: string | null } | null;
};
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function PublicCredentialResolverPage() {
  const params = useParams<{ credentialId: string }>();
  const credentialId = params.credentialId;
  const [result, setResult] = useState<ResolverResult | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/verify/${encodeURIComponent(credentialId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("resolver unavailable");
        return await response.json() as ResolverResult;
      })
      .then((body) => { if (active) { setResult(body); setState(body ? "ready" : "missing"); } })
      .catch(() => { if (active) setState("unavailable"); });
    return () => { active = false; };
  }, [credentialId]);

  const verified = result?.decision === "VERIFIED";
  const adverse = result && ["INVALID", "MISMATCH", "REVOKED", "EXPIRED"].includes(result.decision);
  const Icon = verified ? CheckCircle2 : adverse ? XCircle : state === "ready" ? AlertTriangle : ShieldCheck;

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-20">
      <header className="border-b border-forest/15 bg-white/80 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-extrabold tracking-tight text-forest">ACADSHIELD X</Link>
          <Link href="/login" className="rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white">Sign In</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-10 space-y-6">
        {state === "loading" ? <div role="status" className="rounded-3xl border bg-white p-8">Checking the credential registry…</div> : null}
        {state === "missing" ? <section className="rounded-3xl border border-forest/15 bg-white p-8 text-center"><XCircle className="mx-auto h-12 w-12 text-red-600" /><h1 className="mt-4 text-2xl font-extrabold">Credential not found</h1><p className="mt-2 text-sm text-forest/70">No Core registry record matches this ID.</p></section> : null}
        {state === "unavailable" ? <section role="alert" className="rounded-3xl border border-amber-300 bg-amber-50 p-8 text-center"><AlertTriangle className="mx-auto h-10 w-10 text-amber-700" /><h1 className="mt-4 text-xl font-extrabold">Verification service unavailable</h1><p className="mt-2 text-sm">The credential has not been verified. Try again later.</p></section> : null}
        {result ? <>
          <section className={`rounded-3xl border p-6 lg:p-8 ${verified ? "border-emerald-300 bg-emerald-50" : adverse ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
            <div className="flex items-start gap-4"><Icon className="h-10 w-10 shrink-0" /><div><div className="text-xs font-mono uppercase tracking-widest opacity-70">Core verification decision</div><h1 className="text-2xl font-extrabold">{result.decision}</h1><p className="mt-2 text-sm">{verified ? "The issuer signature and registered credential are valid. See each evidence check below." : "This record is not independently verified. Review the reported evidence and missing checks."}</p></div></div>
          </section>
          <section className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
            <h2 className="text-lg font-extrabold">Credential record</h2>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs uppercase font-bold text-forest/50">Credential ID</dt><dd className="font-mono break-all">{result.credentialId}</dd></div>
              <div><dt className="text-xs uppercase font-bold text-forest/50">Type</dt><dd>{result.credentialType}</dd></div>
              <div><dt className="text-xs uppercase font-bold text-forest/50">Issuer</dt><dd>{result.issuer.name} · {result.issuer.status}</dd></div>
              <div><dt className="text-xs uppercase font-bold text-forest/50">Lifecycle</dt><dd>{result.status}</dd></div>
              <div><dt className="text-xs uppercase font-bold text-forest/50">Issued</dt><dd>{result.issuedAt ? new Date(result.issuedAt).toLocaleString() : "Not recorded"}</dd></div>
              <div><dt className="text-xs uppercase font-bold text-forest/50">Expires</dt><dd>{result.expiresAt ? new Date(result.expiresAt).toLocaleString() : "No expiry recorded"}</dd></div>
            </dl>
            <div className="rounded-2xl border border-forest/10 overflow-hidden"><h3 className="bg-forest/5 px-4 py-3 text-xs font-bold uppercase">Evidence checks</h3><dl className="divide-y divide-forest/10 text-sm">{Object.entries(result.checks).map(([name, value]) => <div key={name} className="px-4 py-3 flex justify-between gap-4"><dt className="capitalize">{name.replace(/([A-Z])/g, " $1")}</dt><dd className="font-mono">{value}</dd></div>)}<div className="px-4 py-3 flex justify-between gap-4"><dt>External source provider</dt><dd className="font-mono">{result.sourceProvider.provider}: {result.sourceProvider.status}</dd></div></dl></div>
            {result.chainProof && <div className="rounded-2xl border border-forest/10 p-4 space-y-2 text-sm"><h3 className="font-bold">Recorded chain receipt</h3><div>Chain {result.chainProof.chainId} · token #{result.chainProof.tokenId} · block {result.chainProof.blockNumber || "unavailable"}</div><code className="block break-all text-xs">Transaction: {result.chainProof.transactionHash}</code><code className="block break-all text-xs">Contract: {result.chainProof.contractAddress}</code>{result.chainProof.metadataCid && <code className="block break-all text-xs">Metadata: {result.chainProof.metadataUri}</code>}</div>}
            {result.documentSha256 && <div><div className="text-xs uppercase font-bold text-forest/50 mb-2">Registered document SHA-256</div><code className="block break-all rounded-xl bg-forest/5 p-4 text-xs">{result.documentSha256}</code></div>}
            <p className="text-xs text-forest/60">This resolver does not expose holder personal data. Compare a submitted file through an authenticated company verification workflow.</p>
            <Link href="/company/verify/document" className="inline-flex items-center gap-2 text-xs font-bold underline">Company file verification <ExternalLink className="h-3.5 w-3.5" /></Link>
          </section>
        </> : null}
      </main>
    </div>
  );
}
