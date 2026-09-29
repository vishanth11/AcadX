"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownRight, ArrowRight, Award, Building2, BriefcaseBusiness, Clock3, FileCheck2, RefreshCw, ShieldCheck } from "lucide-react";

type Counts = Record<string, number>;
type Overview = { generatedAt: string; institutions: Counts; companies: Counts; documents: Counts; credentials: Counts; verifications: Counts };
type AuditEntry = { id: string; action: string; entityType: string; entityId: string | null; createdAt: string; actor: { email: string; role: string } | null };
type ChainStatus = { writeIntegrationConfigured: boolean; configuredChainId: string | null; storedReceiptCount: number; note: string };
type Readiness = { status: string; database: string };

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
const apiOrigin = apiBase.replace(/\/api\/v1\/?$/, "");
const cards: Array<{ key: keyof Omit<Overview, "generatedAt">; title: string; href: string; icon: typeof Building2; accent: string }> = [
  { key: "institutions", title: "Institutions", href: "/admin/universities", icon: Building2, accent: "bg-emerald-50 text-emerald-800" },
  { key: "companies", title: "Companies", href: "/admin/companies", icon: BriefcaseBusiness, accent: "bg-sky-50 text-sky-800" },
  { key: "documents", title: "Source documents", href: "/admin/documents", icon: FileCheck2, accent: "bg-amber-50 text-amber-900" },
  { key: "credentials", title: "Credentials", href: "/admin/credentials", icon: Award, accent: "bg-violet-50 text-violet-800" },
  { key: "verifications", title: "Verifications", href: "/admin/verifications", icon: ShieldCheck, accent: "bg-teal-50 text-teal-800" },
];

async function readJson<T>(url: string, authenticated = true): Promise<T> {
  const response = await fetch(url, { credentials: authenticated ? "include" : "same-origin", cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Your admin session expired. Sign in again." : "Could not load current registry data.");
  return body as T;
}

function total(counts: Counts): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [chain, setChain] = useState<ChainStatus | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const [overviewResult, auditResult, chainResult, readyResult] = await Promise.allSettled([
      readJson<Overview>(`${apiBase}/admin/overview`),
      readJson<{ entries: AuditEntry[] }>(`${apiBase}/admin/audit?limit=6`),
      readJson<ChainStatus>(`${apiBase}/admin/blockchain`),
      readJson<Readiness>(`${apiOrigin}/ready`, false),
    ]);
    if (overviewResult.status === "fulfilled") setOverview(overviewResult.value);
    else setError(overviewResult.reason instanceof Error ? overviewResult.reason.message : "Registry counts are unavailable.");
    if (auditResult.status === "fulfilled") setAudit(auditResult.value.entries || []);
    if (chainResult.status === "fulfilled") setChain(chainResult.value);
    if (readyResult.status === "fulfilled") setReadiness(readyResult.value);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return <main className="mx-auto max-w-7xl space-y-7 px-5 py-7 sm:px-8">
    <header className="relative overflow-hidden rounded-3xl bg-forest p-6 text-white shadow-lg sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[32px] border-white/5" />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/85"><Activity className="h-3.5 w-3.5 text-ochre"/>Live Core registry</div>
          <h1 className="mt-4 font-serif text-3xl font-extrabold tracking-tight sm:text-4xl">Admin overview</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">A current snapshot of registry records, recent database audit events, and configured chain evidence.</p>
        </div>
        <button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white px-4 py-2.5 text-sm font-bold text-forest shadow-sm transition hover:bg-amber-50 disabled:cursor-wait disabled:opacity-70"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/>{loading ? "Refreshing" : "Refresh snapshot"}</button>
      </div>
      <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs text-white/75">
        <span className="inline-flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${readiness?.status === "READY" ? "bg-emerald-300" : "bg-amber-300"}`}/>{readiness?.status === "READY" ? "Core API and database ready" : "Core readiness unavailable"}</span>
        {overview?.generatedAt && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5"/>Snapshot {new Date(overview.generatedAt).toLocaleString()}</span>}
      </div>
    </header>

    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><span>{error}</span><Link href="/login/admin" className="font-bold underline">Go to admin sign in</Link></div>}

    <section aria-label="Registry totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, title, href, icon: Icon, accent }) => {
        const counts = overview?.[key] || {};
        return <Link key={key} href={href} className="group rounded-2xl border border-forest/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest/25 hover:shadow-md">
          <div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${accent}`}><Icon className="h-5 w-5"/></span><ArrowRight className="h-4 w-4 text-forest/30 transition group-hover:translate-x-1 group-hover:text-forest"/></div>
          <p className="mt-5 text-sm font-semibold text-forest/65">{title}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-forest">{overview ? total(counts) : "—"}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {Object.entries(counts).length ? Object.entries(counts).slice(0, 3).map(([status, count]) => <span key={status} className="rounded-full bg-forest/5 px-2.5 py-1 text-[10px] font-bold text-forest/70">{status.toLowerCase().replaceAll("_", " ")} · {count}</span>) : <span className="text-xs text-forest/45">{overview ? "No records yet" : "Loading live totals…"}</span>}
          </div>
        </Link>;
      })}
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
      <article className="overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forest/10 px-5 py-4"><div><h2 className="font-bold text-forest">Recent audit activity</h2><p className="mt-1 text-xs text-forest/55">Latest Core database events</p></div><Link href="/admin/audit" className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-ochre">Open audit history <ArrowRight className="h-3.5 w-3.5"/></Link></div>
        {audit.length ? <ol className="divide-y divide-forest/5">{audit.map((entry) => <li key={entry.id} className="flex gap-3 px-5 py-4"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest/5 text-forest/65"><ArrowDownRight className="h-4 w-4"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1"><p className="truncate text-sm font-bold text-forest">{entry.action.toLowerCase().replaceAll("_", " ")}</p><time className="text-[11px] text-forest/50">{new Date(entry.createdAt).toLocaleString()}</time></div><p className="mt-1 truncate text-xs text-forest/60">{entry.actor?.email || "System"} · {entry.entityType}{entry.entityId ? ` · ${entry.entityId}` : ""}</p></div></li>)}</ol> : <div className="p-8 text-center"><p className="text-sm font-semibold text-forest">{loading ? "Loading audit events…" : "No audit activity yet"}</p><p className="mt-1 text-xs text-forest/55">Events will appear here as administrators and institutions use Core.</p></div>}
        <div className="border-t border-amber-100 bg-amber-50/70 px-5 py-3 text-[11px] leading-relaxed text-amber-950">Audit rows are stored in PostgreSQL. Append-only and tamper-proof database enforcement is not configured.</div>
      </article>

      <aside className="space-y-4">
        <article className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-800"><Activity className="h-5 w-5"/></span><div><h2 className="font-bold">Runtime status</h2><p className="text-xs text-forest/55">Readiness endpoint</p></div></div><div className="mt-5 flex items-center justify-between border-t border-forest/10 pt-4 text-sm"><span className="text-forest/65">Database</span><b>{readiness?.database || "Checking…"}</b></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-forest/65">Core API</span><b>{readiness?.status || "Checking…"}</b></div></article>
        <article className="rounded-2xl border border-forest/10 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-800"><Award className="h-5 w-5"/></span><div><h2 className="font-bold">Chain evidence</h2><p className="text-xs text-forest/55">Stored receipts and configuration</p></div></div><div className="mt-5 flex items-center justify-between border-t border-forest/10 pt-4 text-sm"><span className="text-forest/65">Write integration</span><b>{chain ? chain.writeIntegrationConfigured ? "Configured" : "Not configured" : "Checking…"}</b></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-forest/65">Stored receipts</span><b>{chain?.storedReceiptCount ?? "—"}</b></div>{chain?.configuredChainId && <div className="mt-2 text-xs text-forest/55">Configured chain ID: {chain.configuredChainId}</div>}<Link href="/admin/blockchain" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-ochre">Inspect chain records <ArrowRight className="h-3.5 w-3.5"/></Link></article>
      </aside>
    </section>

    <nav aria-label="Admin shortcuts" className="grid gap-3 sm:grid-cols-3"><Link href="/admin/universities" className="rounded-xl border border-forest/10 bg-white p-4 text-sm font-bold shadow-sm transition hover:border-forest/30">Institution directory <span className="mt-1 block text-xs font-normal text-forest/55">Review registered institutions</span></Link><Link href="/admin/companies" className="rounded-xl border border-forest/10 bg-white p-4 text-sm font-bold shadow-sm transition hover:border-forest/30">Company directory <span className="mt-1 block text-xs font-normal text-forest/55">Review company accounts</span></Link><Link href="/admin/audit" className="rounded-xl border border-forest/10 bg-white p-4 text-sm font-bold shadow-sm transition hover:border-forest/30">Audit history <span className="mt-1 block text-xs font-normal text-forest/55">Search and export recorded events</span></Link></nav>
  </main>;
}
