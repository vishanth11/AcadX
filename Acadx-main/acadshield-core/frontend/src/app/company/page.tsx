"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";

type Verification = { id: string; decision: string; createdAt: string; credential?: { id: string; credentialType: string } | null };
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function CompanyDashboardPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [message, setMessage] = useState("Loading company verification history…");
  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/company/verifications`, { credentials: "include", cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active company account." : "Company history is unavailable.");
    setVerifications(body.verifications || []); setMessage("");
  }, []);
  useEffect(() => { load().catch((error: Error) => setMessage(error.message)); }, [load]);
  return <div className="min-h-screen bg-canvas-texture pb-20 text-forest"><EnterpriseNavbar activeRole="COMPANY"/><main className="mx-auto max-w-6xl space-y-7 px-6 py-8"><header className="rounded-2xl border border-forest/10 bg-white p-6"><p className="text-xs font-bold uppercase tracking-widest text-forest/55">Company · Core registry</p><h1 className="mt-2 font-serif text-4xl font-extrabold">Verification workspace</h1><p className="mt-2 text-sm text-forest/70">Review checks run against Core credential, source, file-hash, and available chain evidence. AI analysis is not an authenticity decision.</p></header><Link href="/company/verify/document" className="inline-block rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white">Verify a submitted file</Link>{message && <div role="status" className="rounded-xl border border-forest/10 bg-white p-4 text-sm">{message}</div>}{!message && <><div className="rounded-xl bg-white p-5"><p className="text-xs uppercase text-forest/55">Stored verifications</p><p className="mt-1 text-3xl font-extrabold">{verifications.length}</p></div><section className="space-y-3"><h2 className="text-xl font-bold">Recent checks</h2>{verifications.slice(0, 10).map((row) => <Link key={row.id} href={`/company/verifications/${encodeURIComponent(row.id)}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest/10 bg-white p-4"><div><b>{row.credential?.credentialType || "Credential check"}</b><p className="font-mono text-xs text-forest/55">{row.credential?.id || row.id}</p></div><div className="text-right"><b className="text-sm">{row.decision}</b><p className="text-xs text-forest/55">{new Date(row.createdAt).toLocaleString()}</p></div></Link>)}{verifications.length === 0 && <p className="rounded-xl bg-white p-5 text-sm text-forest/60">No verifications have been submitted.</p>}<Link href="/company/verifications" className="inline-block text-sm font-bold underline">Open verification history</Link></section></>}</main></div>;
}
