"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import { AlertTriangle, ArrowRight, CheckCircle2, FileCheck2, ShieldCheck, Upload } from "lucide-react";

type UploadResult = {
  documentId: string;
  status: string;
  documentType?: string;
  holderReference?: string;
  file: { name: string; mediaType: string; sizeBytes: number; documentSha256: string; hashAlgorithm: string };
  analysis: Record<string, unknown>;
};
type CrossCheckResult = { status: string; documentsCompared: number; mismatches: string[]; comparisons: Array<{ field: string; status: string; values: Array<{ documentId: string; value: string }> }> };

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function UniversityDocumentUploadWizard() {
  const [documentType, setDocumentType] = useState("");
  const [holderReference, setHolderReference] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [crossCheck, setCrossCheck] = useState<CrossCheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) { setError("Select a source document to upload."); return; }
    if (file.size > 10 * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum limit of 10 MB.`);
      return;
    }
    setBusy(true); setError(""); setResult(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("documentType", documentType);
      if (holderReference.trim()) form.set("holderReference", holderReference.trim());
      const response = await fetch(`${apiBase}/documents`, { method: "POST", credentials: "include", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError(body.error === "INSTITUTION_SCOPE_REQUIRED" ? "Your account is not linked to an active institution." : "Sign in with an active university account before uploading.");
        } else if (body.error === "DOCUMENT_TOO_LARGE") {
          setError("File exceeds the maximum allowed size of 10 MB.");
        } else if (body.error === "UNSUPPORTED_OR_INVALID_FILE_SIGNATURE") {
          setError("Unsupported file format. Please upload a valid PDF, PNG, or JPG document.");
        } else if (body.error) {
          setError(`Upload failed: ${body.error}`);
        } else {
          setError("Upload failed. Check the file type and size (max 10 MB), then try again.");
        }
        return;
      }
      setResult(body as UploadResult);
    } catch { setError("Could not reach the document service. Please ensure the backend server is running on http://localhost:4000."); }
    finally { setBusy(false); }
  }

  async function review(decision: "APPROVE" | "REJECT") {
    if (!result) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`${apiBase}/documents/${encodeURIComponent(result.documentId)}/review`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: reviewReason.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setError(body.error === "DOCUMENT_ALREADY_REVIEWED" ? `This record has already been reviewed (${body.status}).` : "The review could not be saved."); return; }
      setResult({ ...result, status: body.status });
    } catch { setError("Could not reach the review service. The review was not saved."); }
    finally { setBusy(false); }
  }

  async function runCrossCheck() {
    if (!result) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`${apiBase}/documents/${encodeURIComponent(result.documentId)}/cross-check`, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setError(body.error === "HOLDER_REFERENCE_REQUIRED" ? "Add an institutional student reference to compare this record with the student's other documents." : "Cross-document comparison could not be run."); return; }
      setCrossCheck(body as CrossCheckResult);
    } catch { setError("Could not reach the cross-document service."); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="UNIVERSITY" />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-7">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-3"><ShieldCheck className="w-3.5 h-3.5 text-ochre" />Institution Source Document</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">Upload and review a document</h1>
          <p className="mt-2 text-forest/75 text-sm">Original bytes are uploaded to the private Core service, hashed on the server, and analyzed as evidence. An authorized university reviewer must approve a document before it can support credential issuance.</p>
        </header>

        <form onSubmit={uploadDocument} className="bg-white/85 border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
          <div className="flex justify-end"><Link href="/university/templates" className="text-xs font-bold underline">Manage institution templates</Link></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label htmlFor="document-type" className="block text-xs font-bold uppercase text-forest/70 mb-2">Document type</label><input id="document-type" value={documentType} onChange={(event) => setDocumentType(event.target.value)} required maxLength={100} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm" placeholder="DEGREE_CERTIFICATE" /><p className="mt-1 text-[11px] text-forest/55">Use the same document type key as its institution template.</p></div>
            <div><label htmlFor="holder-reference" className="block text-xs font-bold uppercase text-forest/70 mb-2">Institutional student reference (optional)</label><input id="holder-reference" value={holderReference} onChange={(event) => setHolderReference(event.target.value)} maxLength={160} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm" placeholder="Your internal student ID" /></div>
          </div>
          <div>
            <label htmlFor="source-file" className="block text-xs font-bold uppercase text-forest/70 mb-2">Original document (Max 10 MB)</label>
            <label htmlFor="source-file" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-forest/30 bg-forest/5 p-5 hover:bg-forest/10"><Upload className="w-5 h-5" /><span className="text-sm">{file ? `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB (${file.size.toLocaleString()} bytes)` : "Choose PDF, PNG, JPEG, or GIF (Max 10 MB)"}</span></label>
            <input id="source-file" type="file" accept="application/pdf,image/png,image/jpeg,image/gif" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </div>
          {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
          <button disabled={busy || !file} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white hover:bg-forest/90 disabled:opacity-50"><FileCheck2 className="h-4 w-4" />{busy ? "Processing…" : "Upload for analysis"}</button>
        </form>

        {result && <section aria-live="polite" className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
          <div className="flex items-start gap-3"><CheckCircle2 className="h-7 w-7 text-emerald-700" /><div><div className="text-xs uppercase font-bold text-forest/50">Registered source document</div><h2 className="text-lg font-extrabold">{result.status}</h2></div></div>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs uppercase font-bold text-forest/50">Document ID</dt><dd className="font-mono break-all">{result.documentId}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">Type</dt><dd>{result.documentType || documentType}</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">File</dt><dd>{result.file.name} · {result.file.sizeBytes.toLocaleString()} bytes</dd></div>
            <div><dt className="text-xs uppercase font-bold text-forest/50">SHA-256</dt><dd className="font-mono break-all">{result.file.documentSha256}</dd></div>
          </dl>
          <details><summary className="cursor-pointer text-sm font-bold text-forest">Analysis evidence (not an authenticity decision)</summary><pre className="mt-3 overflow-auto rounded-xl bg-forest/5 p-4 text-xs">{JSON.stringify(result.analysis, null, 2)}</pre></details>
          {result.status === "REVIEW_REQUIRED" && <div className="space-y-3 border-t border-forest/10 pt-5">
            <p className="text-sm font-semibold">Review the original record and evidence before approving it for credential issuance.</p>
            <label htmlFor="review-reason" className="block text-xs font-bold uppercase text-forest/70">Review note (required)</label>
            <textarea id="review-reason" value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} minLength={5} maxLength={500} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm" rows={3} placeholder="Record what was checked or why it was rejected" />
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={runCrossCheck} className="rounded-xl border border-forest/25 px-5 py-3 text-sm font-bold disabled:opacity-50">Compare holder records</button>
              <button type="button" disabled={busy || reviewReason.trim().length < 5} onClick={() => review("APPROVE")} className="rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Approve source record</button>
              <button type="button" disabled={busy || reviewReason.trim().length < 5} onClick={() => review("REJECT")} className="rounded-xl border border-red-300 px-5 py-3 text-sm font-bold text-red-800 disabled:opacity-50">Reject source record</button>
            </div>
          </div>}
          {result.status === "VERIFIED" && <Link href="/university/credentials/create" className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white">Issue a credential from this document <ArrowRight className="h-4 w-4" /></Link>}
          {crossCheck && <div className="rounded-xl border border-forest/15 bg-forest/5 p-4"><h3 className="font-bold">Cross-document consistency: {crossCheck.status}</h3><p className="mt-1 text-xs text-forest/70">Compared {crossCheck.documentsCompared} records. Any difference is a review signal, not a fraud finding.</p><div className="mt-3 space-y-2">{crossCheck.comparisons.map((item) => <div key={item.field} className="text-sm"><b>{item.field}: {item.status}</b><div className="text-xs">{item.values.map((value) => `${value.documentId.slice(0, 8)}: ${value.value}`).join(" · ")}</div></div>)}</div></div>}
        </section>}
      </main>
    </div>
  );
}
