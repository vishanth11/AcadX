"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileCheck2, ShieldCheck, Upload, XCircle } from "lucide-react";

type VerificationResult = {
  verificationId: string;
  credentialId: string;
  decision: string;
  submittedFile: { mediaType: string; sizeBytes: number; sha256: string; hashAlgorithm: string };
  exactHashMatch: boolean;
  credentialProofStatus: string;
  sourceStatus: string;
  sourceProvider: { provider: string; status: string };
  blockchainStatus: string;
  aiAnalysis: string;
};

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function DocumentVerificationPage() {
  const [credentialId, setCredentialId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose the document file you want to verify.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("credentialId", credentialId.trim());
      form.set("file", file);
      const response = await fetch(`${apiBase}/company/verifications`, { method: "POST", credentials: "include", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(response.status === 401 || response.status === 403 ? "Sign in with an active company account before verifying documents." : body.error === "CREDENTIAL_ID_AND_FILE_REQUIRED" ? "Enter a credential UUID and select a file." : "Verification could not be completed. Check the credential ID and file, then try again.");
        return;
      }
      setResult(body as VerificationResult);
    } catch {
      setError("Could not reach the verification service. Your file was not verified.");
    } finally {
      setLoading(false);
    }
  }

  const confirmed = result?.decision === "VERIFIED";
  const adverse = result && ["INVALID", "MISMATCH", "REVOKED", "EXPIRED"].includes(result.decision);

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="COMPANY" />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-7">
        <Link href="/company/verify" className="inline-flex items-center gap-2 text-sm font-semibold text-forest/70 hover:text-forest"><ArrowLeft className="w-4 h-4" />Back to Verification Hub</Link>
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-3"><ShieldCheck className="w-3.5 h-3.5 text-ochre" />Company Verification</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">Verify a submitted document</h1>
          <p className="mt-2 text-forest/75 text-sm leading-relaxed">The server hashes the uploaded bytes and checks the credential record. Source and blockchain checks are reported separately and may be unavailable.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white/85 border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
          <div>
            <label htmlFor="credential-id" className="block text-xs font-bold text-forest uppercase tracking-wide mb-2">Credential UUID</label>
            <input id="credential-id" value={credentialId} onChange={(event) => setCredentialId(event.target.value)} required className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 font-mono text-sm focus:outline-none focus:border-forest" placeholder="Enter the credential ID" />
          </div>
          <div>
            <label htmlFor="document-file" className="block text-xs font-bold text-forest uppercase tracking-wide mb-2">Candidate document</label>
            <label htmlFor="document-file" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-forest/30 bg-forest/5 p-5 hover:bg-forest/10">
              <Upload className="w-5 h-5 text-forest/60" />
              <span className="text-sm text-forest">{file ? `${file.name} · ${file.size.toLocaleString()} bytes` : "Choose a PDF, PNG, JPEG, or GIF"}</span>
            </label>
            <input id="document-file" type="file" accept="application/pdf,image/png,image/jpeg,image/gif" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </div>
          {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
          <button disabled={loading || !file} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white hover:bg-forest/90 disabled:opacity-50"><FileCheck2 className="h-4 w-4" />{loading ? "Checking…" : "Verify document"}</button>
        </form>

        {result && <section aria-live="polite" className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
          <div className="flex items-start gap-3 border-b border-forest/10 pb-4">
            {confirmed ? <CheckCircle2 className="h-8 w-8 text-emerald-700" /> : adverse ? <XCircle className="h-8 w-8 text-red-700" /> : <ShieldCheck className="h-8 w-8 text-amber-700" />}
            <div><span className="block text-xs uppercase tracking-widest text-forest/50">Verification decision</span><h2 className="text-xl font-extrabold text-forest">{result.decision}</h2><p className="mt-1 text-xs text-forest/70">An exact hash match is only one check; the outcome is not an authenticity guarantee.</p></div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs uppercase font-bold text-forest/50">Verification record</dt><dd className="font-mono break-all">{result.verificationId}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Credential</dt><dd className="font-mono break-all">{result.credentialId}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Exact hash comparison</dt><dd>{result.exactHashMatch ? "Match" : "No matching registered file hash"}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Credential proof</dt><dd>{result.credentialProofStatus}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Core source record</dt><dd>{result.sourceStatus}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">External source provider</dt><dd>{result.sourceProvider.provider}: {result.sourceProvider.status}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Blockchain</dt><dd>{result.blockchainStatus}</dd></div>
          </dl>
          <div><div className="text-xs uppercase font-bold text-forest/50 mb-2">Submitted file SHA-256</div><code className="block break-all rounded-xl bg-forest/5 p-4 text-xs">{result.submittedFile.sha256}</code></div>
          <p className="text-xs text-forest/60">AI analysis: {result.aiAnalysis}. AI evidence cannot override deterministic credential, issuer, lifecycle, source, or blockchain checks.</p>
        </section>}
      </main>
    </div>
  );
}
