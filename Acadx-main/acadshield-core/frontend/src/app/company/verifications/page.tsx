"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import { AlertTriangle, ExternalLink, FileCheck2, Search } from "lucide-react";

type Verification = { id: string; credentialId: string | null; decision: string; deterministicEvidence: Record<string, unknown>; aiEvidence: unknown; sourceStatus: string | null; createdAt: string; credential: { id: string; credentialType: string; document: { documentType: string | null; originalFileName: string; documentSha256: string } | null } | null };
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function CompanyVerificationsHistoryPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState("ALL");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/company/verifications`, { credentials: "include", cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active company account to see your verification history." : "Could not load verification history.");
    setVerifications((body.verifications || []) as Verification[]);
  }, []);

  useEffect(() => { load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load history.")); }, [load]);
  const filtered = verifications.filter((item) => (decision === "ALL" || item.decision === decision) && `${item.id} ${item.credentialId || ""} ${item.credential?.credentialType || ""} ${item.credential?.document?.originalFileName || ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="COMPANY" />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-forest/10 pb-5"><div><div className="inline-flex items-center gap-2 rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold uppercase"><FileCheck2 className="h-4 w-4 text-ochre" />Private verification history</div><h1 className="mt-3 text-3xl font-extrabold font-serif">Verification records</h1><p className="mt-1 text-sm text-forest/70">Recent checks performed by your organization, with deterministic evidence preserved.</p></div><Link href="/company/verify/document" className="rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white">New verification</Link></header>
        <div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-forest/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search verification, credential, or file" className="w-full rounded-xl border border-forest/20 bg-white py-2.5 pl-10 pr-4 text-sm" /></div><select value={decision} onChange={(event) => setDecision(event.target.value)} className="rounded-xl border border-forest/20 bg-white px-4 py-2.5 text-sm"><option value="ALL">All decisions</option>{["VERIFIED", "REVIEW_REQUIRED", "MISMATCH", "REVOKED", "EXPIRED", "INVALID", "SOURCE_UNAVAILABLE", "FAILED"].map((item) => <option key={item}>{item}</option>)}</select></div>
        {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
        <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-forest/5 text-xs uppercase"><tr><th className="p-4">Verification / time</th><th className="p-4">Credential</th><th className="p-4">Source file</th><th className="p-4">Decision</th><th className="p-4">Evidence</th></tr></thead><tbody className="divide-y divide-forest/10">
          {filtered.map((item) => <tr key={item.id}><td className="p-4"><code className="block break-all text-xs">{item.id}</code><div className="mt-1 text-xs text-forest/60">{new Date(item.createdAt).toLocaleString()}</div></td><td className="p-4"><div>{item.credential?.credentialType || "Credential unavailable"}</div><code className="text-[10px] text-forest/60">{item.credentialId || "No credential ID"}</code></td><td className="p-4"><div>{item.credential?.document?.documentType || "Academic document"}</div><div className="text-xs text-forest/60">{item.credential?.document?.originalFileName || "File metadata unavailable"}</div></td><td className="p-4"><span className="rounded-full bg-forest/5 px-2.5 py-1 text-xs font-bold">{item.decision}</span><div className="mt-1 text-[10px] text-forest/60">Source: {item.sourceStatus || "not checked"}</div></td><td className="p-4"><Link href={`/company/verifications/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-1 text-xs font-bold underline">Open evidence <ExternalLink className="h-3.5 w-3.5" /></Link></td></tr>)}
          {!filtered.length && <tr><td colSpan={5} className="p-8 text-center text-sm text-forest/60">No verification records found.</td></tr>}
        </tbody></table></div>
      </main>
    </div>
  );
}
