"use client";

import { useCallback, useEffect, useState } from "react";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";

type Institution = {
  id: string;
  name: string;
  code: string;
  country: string | null;
  website: string | null;
  status: string;
  createdAt: string;
  users: Array<{ id: string; email: string; role: string; status: string }>;
  _count: { users: number; documents: number; credentials: number };
};
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function AdminUniversitiesPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [message, setMessage] = useState("Loading institutions…");
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/admin/institutions`, { credentials: "include" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active administrator account." : "Institution registry is unavailable.");
    setInstitutions(body.institutions || []); setMessage("");
  }, []);

  useEffect(() => { load().catch((error: Error) => setMessage(error.message)); }, [load]);

  async function activate(institution: Institution) {
    setBusy(institution.id); setMessage("");
    try {
      const response = await fetch(`${apiBase}/admin/institutions/${encodeURIComponent(institution.id)}/activate`, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Institution could not be activated.");
      await load(); setMessage(`${institution.name} is active. Issuer signing configured: ${body.issuerSigningConfigured ? "yes" : "no"}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Institution could not be activated."); }
    finally { setBusy(null); }
  }

  async function suspend(institution: Institution) {
    setBusy(institution.id); setMessage("");
    try {
      const response = await fetch(`${apiBase}/admin/institutions/${encodeURIComponent(institution.id)}/suspend`, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Institution could not be suspended.");
      await load(); setMessage(`${institution.name} is suspended.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Institution could not be suspended."); }
    finally { setBusy(null); }
  }

  return (
    <div className="min-h-screen bg-canvas-texture pb-20 text-forest">
      <EnterpriseNavbar activeRole="ADMIN" />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <header className="rounded-2xl border border-forest/10 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-forest/55">Administration · Core registry</p>
          <h1 className="mt-2 font-serif text-4xl font-extrabold">Institutions</h1>
          <p className="mt-2 text-sm text-forest/70">Institution accounts and issued-record counts from PostgreSQL. Activation does not represent external accreditation.</p>
        </header>

        {message && <div role="status" className="rounded-xl border border-forest/10 bg-white p-4 text-sm">{message}</div>}

        <section className="space-y-3">
          {institutions.map((institution) => {
            const isExpanded = expandedId === institution.id;

            return (
              <article key={institution.id} className="rounded-xl border border-forest/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button type="button" onClick={() => setExpandedId(isExpanded ? null : institution.id)} className="flex-1 text-left">
                    <h2 className="font-bold">{institution.name} <span className="font-mono text-xs font-normal">({institution.code})</span></h2>
                    <p className="text-xs text-forest/60">{[institution.country, institution.website].filter(Boolean).join(" · ") || "No country or website"} · {institution._count.users} users · {institution._count.documents} documents · {institution._count.credentials} credentials</p>
                    <code className="text-[10px] text-forest/50">{institution.id}</code>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-bold">{institution.status}</span>
                    {institution.status === "PENDING" && (
                      <button disabled={busy !== null} onClick={() => activate(institution)} className="rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                        {busy === institution.id ? "Activating…" : "Activate"}
                      </button>
                    )}
                    {institution.status === "ACTIVE" && (
                      <button disabled={busy !== null} onClick={() => suspend(institution)} className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 disabled:opacity-50">
                        {busy === institution.id ? "Suspending…" : "Suspend"}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-forest/10 pt-4">
                    <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="rounded-xl bg-forest/5 p-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-forest/55">Country</dt>
                        <dd className="mt-1 font-medium">{institution.country || "Not supplied"}</dd>
                      </div>
                      <div className="rounded-xl bg-forest/5 p-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-forest/55">Website</dt>
                        <dd className="mt-1 font-medium">{institution.website || "Not supplied"}</dd>
                      </div>
                      <div className="rounded-xl bg-forest/5 p-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-forest/55">Created</dt>
                        <dd className="mt-1 font-medium">{new Date(institution.createdAt).toLocaleString()}</dd>
                      </div>
                      <div className="rounded-xl bg-forest/5 p-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-forest/55">Institution code</dt>
                        <dd className="mt-1 font-medium">{institution.code}</dd>
                      </div>
                      <div className="rounded-xl bg-forest/5 p-3 sm:col-span-2">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-forest/55">Administrator contacts</dt>
                        <dd className="mt-2 space-y-1">
                          {institution.users.length > 0 ? institution.users.map((user) => (
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

          {institutions.length === 0 && !message && <p className="rounded-xl bg-white p-5 text-sm text-forest/60">No institution records.</p>}
        </section>
      </main>
    </div>
  );
}
