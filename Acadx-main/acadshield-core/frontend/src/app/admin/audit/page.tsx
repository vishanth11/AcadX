"use client";

import { useCallback, useEffect, useState } from "react";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";

type AuditEntry = { id: string; action: string; entityType: string; entityId: string | null; requestId: string | null; details: unknown; createdAt: string; actor: { email: string; role: string } | null };
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function AdminAuditCenterPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Loading audit rows from Core…");

  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/admin/audit?limit=200`, { credentials: "include" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active administrator account." : "Audit records are unavailable.");
    setEntries(body.entries || []);
    setStatus("Database audit rows loaded. The database does not enforce append-only or tamper-proof storage.");
  }, []);
  useEffect(() => { load().catch((error: Error) => setStatus(error.message)); }, [load]);

  const filtered = entries.filter((entry) => JSON.stringify(entry).toLowerCase().includes(search.toLowerCase()));
  function exportCsv() {
    const cells = [["id", "createdAt", "actor", "role", "action", "entityType", "entityId", "details"], ...filtered.map((row) => [row.id, row.createdAt, row.actor?.email ?? "SYSTEM", row.actor?.role ?? "SYSTEM", row.action, row.entityType, row.entityId ?? "", JSON.stringify(row.details ?? {})])];
    const csv = cells.map((line) => line.map((value) => {
      const raw = String(value);
      const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
      return `"${safe.replace(/"/g, '""')}"`;
    }).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "acadshield-audit.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="min-h-screen bg-canvas-texture pb-20 text-forest"><EnterpriseNavbar activeRole="ADMIN" /><main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
    <header className="rounded-2xl border border-forest/10 bg-white/80 p-6"><p className="text-xs font-bold uppercase tracking-widest text-forest/55">Governance · Database events</p><h1 className="mt-2 font-serif text-4xl font-extrabold">Audit history</h1><p className="mt-2 text-sm text-forest/70">Core action records are shown from the database. This table is not cryptographically chained or protected against database-level edits.</p></header>
    <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{status}</div>
    <section className="flex flex-wrap items-center gap-3 rounded-xl border border-forest/10 bg-white p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search action, actor, entity, or details" className="min-w-64 flex-1 rounded-lg border border-forest/20 px-3 py-2 text-sm" /><button onClick={load} className="rounded-lg border border-forest/20 px-4 py-2 text-sm font-bold">Refresh</button><button onClick={exportCsv} disabled={!filtered.length} className="rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Export CSV</button></section>
    <section className="overflow-x-auto rounded-xl border border-forest/10 bg-white"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-forest/5 uppercase tracking-wide text-forest/60"><tr>{["Time", "Actor", "Action", "Entity", "Details"].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead><tbody>{filtered.map((entry) => <tr key={entry.id} className="border-t border-forest/10 align-top"><td className="p-4 whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</td><td className="p-4">{entry.actor?.email ?? "System"}<div className="text-forest/50">{entry.actor?.role ?? "SYSTEM"}</div></td><td className="p-4 font-bold">{entry.action}<div className="font-normal text-forest/50">event {entry.id}</div></td><td className="p-4">{entry.entityType}<div className="max-w-56 break-all font-mono text-forest/55">{entry.entityId ?? "—"}</div></td><td className="max-w-lg whitespace-pre-wrap break-words p-4">{JSON.stringify(entry.details ?? {})}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-8 text-center text-sm text-forest/55">No audit rows match this search.</p>}</section>
  </main></div>;
}
