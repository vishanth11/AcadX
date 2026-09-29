"use client";

import { useCallback, useEffect, useState } from "react";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";

type Company = {
  id: string;
  name: string;
  domain: string | null;
  status: string;
  createdAt: string;
  users: Array<{ id: string; email: string; role: string; status: string }>;
  _count: { users: number; verifications: number };
};
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState("Loading companies…");
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/admin/companies`, { credentials: "include" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active administrator account." : "Company registry is unavailable.");
    setCompanies(body.companies || []); setMessage("");
  }, []);

  useEffect(() => { load().catch((error: Error) => setMessage(error.message)); }, [load]);

  async function activate(company: Company) {
    setBusy(company.id); setMessage("");
    try {
      const response = await fetch(`${apiBase}/admin/companies/${encodeURIComponent(company.id)}/activate`, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Company could not be activated.");
      await load(); setMessage(`${company.name} is active.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Company could not be activated."); }
    finally { setBusy(null); }
  }

  async function suspend(company: Company) {
    setBusy(company.id); setMessage("");
    try {
      const response = await fetch(`${apiBase}/admin/companies/${encodeURIComponent(company.id)}/suspend`, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Company could not be suspended.");
      await load(); setMessage(`${company.name} is suspended.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Company could not be suspended."); }
    finally { setBusy(null); }
  }

  return (
    <div className="min-h-screen bg-canvas-texture pb-20 text-forest">
      <EnterpriseNavbar activeRole="ADMIN" />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <header className="rounded-2xl border border-forest/10 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-forest/55">Administration · Core registry</p>
          <h1 className="mt-2 font-serif text-4xl font-extrabold">Companies</h1>
          <p className="mt-2 text-sm text-forest/70">Company accounts and verification counts from PostgreSQL.</p>
        </header>

        {message && <div role="status" className="rounded-xl border border-forest/10 bg-white p-4 text-sm">{message}</div>}

        <section className="space-y-3">
          {companies.map((company) => {
            const isExpanded = expandedId === company.id;

            return (
              <article key={company.id} className="rounded-xl border border-forest/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : company.id)} className="flex-1 text-left">
                    <h2 className="font-bold">{company.name}</h2>
                    <p className="text-xs text-forest/60">{company.domain || "No domain"} · {company._count.users} users · {company._count.verifications} verifications</p>
                    <code className="text-[10px] text-forest/50">{company.id}</code>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-bold">{company.status}</span>
                    {company.status === "PENDING" && (
                      <button disabled={busy !== null} onClick={() => activate(company)} className="rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                        {busy === company.id ? "Activating…" : "Activate"}
                      </button>
                    )}
                    {company.status === "ACTIVE" && (
                      <button disabled={busy !== null} onClick={() => suspend(company)} className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 disabled:opacity-50">
                        {busy === company.id ? "Suspending…" : "Suspend"}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-forest/10 pt-4">
                    <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="rounded-xl bg-forest/5 p-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-forest/55">Company domain</dt>
                        <dd className="mt-1 font-medium">{company.domain || "Not provided"}</dd>
                      </div>
                      <div className="rounded-xl bg-forest/5 p-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-forest/55">Created</dt>
                        <dd className="mt-1 font-medium">{new Date(company.createdAt).toLocaleString()}</dd>
                      </div>
                      <div className="rounded-xl bg-forest/5 p-3 sm:col-span-2">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-forest/55">Administrator contacts</dt>
                        <dd className="mt-2 space-y-1">
                          {company.users.length > 0 ? company.users.map((user) => (
                            <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-2 py-1 text-xs">
                              <span>{user.email}</span>
                              <span className="rounded-full bg-forest/5 px-2 py-0.5 text-[10px] font-bold uppercase">{user.role} · {user.status}</span>
                            </div>
                          )) : <span className="text-forest/60">No administrator account attached yet.</span>}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </article>
            );
          })}

          {companies.length === 0 && !message && <p className="rounded-xl bg-white p-5 text-sm text-forest/60">No company records.</p>}
        </section>
      </main>
    </div>
  );
}
