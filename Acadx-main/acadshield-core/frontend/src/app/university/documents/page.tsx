"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import { AlertTriangle, Copy, FileCheck2, Plus, Search } from "lucide-react";

type DocumentRecord = { id: string; originalFileName: string; mediaType: string; sizeBytes: string; documentSha256: string; contentFingerprint: string | null; documentType: string | null; status: string; holderReference: string | null; createdAt: string };
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function UniversityDocumentCenterPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/documents`, { credentials: "include", cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active university account to see its document registry." : "Could not load the document registry.");
    setDocuments((body.documents || []) as DocumentRecord[]);
  }, []);

  useEffect(() => { load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load documents.")); }, [load]);
  const filtered = documents.filter((item) => `${item.documentType || ""} ${item.originalFileName} ${item.id} ${item.holderReference || ""} ${item.documentSha256}`.toLowerCase().includes(search.toLowerCase()));
  const counts = { verified: documents.filter((item) => item.status === "VERIFIED").length, review: documents.filter((item) => item.status === "REVIEW_REQUIRED" || item.status === "UPLOADED").length, rejected: documents.filter((item) => item.status === "FAILED").length };

  async function copyHash(hash: string) {
    try { await navigator.clipboard.writeText(hash); setCopied(hash); setTimeout(() => setCopied(""), 1800); }
    catch { setError("Could not copy the fingerprint."); }
  }

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="UNIVERSITY" />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-forest/10 pb-5"><div><div className="inline-flex items-center gap-2 rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold uppercase"><FileCheck2 className="h-4 w-4 text-ochre" />Institution source registry</div><h1 className="mt-3 text-3xl font-extrabold font-serif">University documents</h1><p className="mt-1 text-sm text-forest/70">Live private records uploaded by this institution. Uploads require human review before credential issuance.</p></div><Link href="/university/documents/upload" className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" />Upload source document</Link></header>
        <div className="grid grid-cols-3 gap-3"><div className="rounded-xl bg-white p-4"><div className="text-xs uppercase text-forest/60">Total</div><div className="text-2xl font-black">{documents.length}</div></div><div className="rounded-xl bg-white p-4"><div className="text-xs uppercase text-forest/60">Approved for issuance</div><div className="text-2xl font-black text-emerald-700">{counts.verified}</div></div><div className="rounded-xl bg-white p-4"><div className="text-xs uppercase text-forest/60">Pending / rejected</div><div className="text-2xl font-black text-amber-700">{counts.review} / {counts.rejected}</div></div></div>
        <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-forest/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search filename, type, reference, or SHA-256" className="w-full rounded-xl border border-forest/20 bg-white py-2.5 pl-10 pr-4 text-sm" /></div>
        {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
        <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-forest/5 text-xs uppercase"><tr><th className="p-4">Document</th><th className="p-4">Holder reference</th><th className="p-4">Status</th><th className="p-4">Exact file SHA-256</th><th className="p-4">Uploaded</th></tr></thead><tbody className="divide-y divide-forest/10">
          {filtered.map((item) => <tr key={item.id} className="align-top"><td className="p-4"><div className="font-bold">{item.documentType || "Document type pending"}</div><div className="text-xs text-forest/70">{item.originalFileName}</div><code className="mt-1 block break-all text-[10px] text-forest/50">ID: {item.id}</code></td><td className="p-4 text-xs">{item.holderReference || "Not recorded"}</td><td className="p-4"><span className="rounded-full bg-forest/5 px-2.5 py-1 text-xs font-bold">{item.status}</span><div className="mt-1 text-[10px] text-forest/60">{(Number(item.sizeBytes) / 1024).toFixed(1)} KiB · {item.mediaType}</div></td><td className="p-4"><code className="block max-w-sm break-all text-[10px]">{item.documentSha256}</code><button onClick={() => copyHash(item.documentSha256)} className="mt-1 inline-flex items-center gap-1 text-[10px] underline">{copied === item.documentSha256 ? "Copied" : <><Copy className="h-3 w-3" />Copy hash</>}</button></td><td className="p-4 text-xs">{new Date(item.createdAt).toLocaleString()}</td></tr>)}
          {!filtered.length && <tr><td colSpan={5} className="p-8 text-center text-sm text-forest/60">No source document records found.</td></tr>}
        </tbody></table></div>
      </main>
    </div>
  );
}
