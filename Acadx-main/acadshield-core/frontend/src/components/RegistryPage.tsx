"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RecordRow = Record<string, unknown>;
type Result = { records: RecordRow[]; unavailable?: string; limit?: number; nextCursor?: string | null };
export const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export async function loadRegistry(endpoint: string, signal?: AbortSignal): Promise<Result> {
  const response = await fetch(`${apiBase}${endpoint}`, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("Your session is unavailable or access was revoked. Sign in again.");
    if (response.status === 404) throw new Error("The requested record was not found.");
    throw new Error("The registry could not be reached. Please retry.");
  }
  const body = await response.json();
  if (Array.isArray(body.records)) return body;
  // Existing document-detail API returns one explicitly selected record.
  if (typeof body.id === "string") return { records: [body] };
  throw new Error("The registry returned an unexpected response.");
}

export default function RegistryPage({ title, endpoint, mintedOnly = false, documentReview = false, credentialActions = false }: {
  title: string; endpoint: string; mintedOnly?: boolean; documentReview?: boolean; credentialActions?: boolean;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [cursor, setCursor] = useState("");
  useEffect(() => { setCursor(""); }, [endpoint]);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError("");
    const target = cursor ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}` : endpoint;
    loadRegistry(target, controller.signal).then((body) => { if (!controller.signal.aborted) setResult(body); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load records."); });
    return () => controller.abort();
  }, [endpoint, revision, cursor]);

  async function act(id: string, action: "APPROVE" | "REJECT" | "revoke") {
    setBusy(true); setActionMessage("");
    try {
      const target = action === "revoke" ? `/credentials/${encodeURIComponent(id)}/revoke` : `/documents/${encodeURIComponent(id)}/review`;
      const response = await fetch(`${apiBase}${target}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "revoke" ? { reason } : { decision: action, reason }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "The change was not confirmed.");
      if (response.status === 202) { setActionMessage(`Blockchain operation pending: ${body.operationId || "check operation history"}. The change is not yet confirmed.`); return; }
      if (body.status === "FAILED") throw new Error("Blockchain transaction failed. No change was confirmed.");
      setReason(""); setActionMessage("Change saved."); setRevision((value) => value + 1);
    } catch (cause) { setActionMessage(cause instanceof Error ? cause.message : "The change was not confirmed."); }
    finally { setBusy(false); }
  }

  const rows = (result?.records || []).filter((row) => !mintedOnly || Boolean(row.transactionHash));
  return <main className="mx-auto max-w-6xl space-y-6 p-6 text-forest">
    <h1 className="font-serif text-3xl font-bold">{title}</h1>
    {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5"><p>{error}</p><button className="mt-3 underline" onClick={() => setRevision((value) => value + 1)}>Retry</button> <Link href="/login">Sign in</Link></div>
      : !result ? <p role="status">Loading registry records…</p>
      : result.unavailable ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5">{result.unavailable}</p>
      : rows.length === 0 ? <p role="status">No records found.</p>
      : <>{result.limit && <p className="text-sm">Showing up to {result.limit} records on this page.</p>}
        {rows.map((row, index) => <article key={String(row.id ?? index)} className="space-y-3 rounded-xl border border-forest/15 bg-white p-5">
          <h2 className="break-all font-bold">{String(row.originalFileName || row.fileName || row.credentialType || row.name || row.action || row.id || "Record")}</h2>
          <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(row).map(([key, value]) => <div key={key}>
            <dt className="text-xs font-semibold">{key}</dt>
            <dd className="whitespace-pre-wrap break-all text-sm">{value === null || value === undefined ? "Not recorded" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}</dd>
          </div>)}</dl>
          {(documentReview || credentialActions) && <div className="space-y-3 border-t pt-4">
            <label className="block">Reason<textarea value={reason} minLength={5} maxLength={500} onChange={(event) => setReason(event.target.value)} className="mt-2 block w-full rounded border p-2" /></label>
            {documentReview && ["REVIEW_REQUIRED", "UPLOADED"].includes(String(row.status)) && <>
              <button disabled={busy || reason.trim().length < 5} onClick={() => act(String(row.id), "APPROVE")} className="mr-4 underline disabled:opacity-40">Approve document</button>
              <button disabled={busy || reason.trim().length < 5} onClick={() => act(String(row.id), "REJECT")} className="underline disabled:opacity-40">Reject document</button></>}
            {credentialActions && row.status !== "REVOKED" && <button disabled={busy || reason.trim().length < 5} onClick={() => act(String(row.id), "revoke")} className="underline disabled:opacity-40">Revoke credential</button>}
          </div>}
        </article>)}</>}
    {actionMessage && <p role="status">{actionMessage}</p>}
    {result && <nav aria-label="Registry pagination" className="flex gap-6">
      {cursor && <button onClick={() => setCursor("")}>First page</button>}
      {result.nextCursor && <button onClick={() => setCursor(result.nextCursor!)}>Next page</button>}
    </nav>}
  </main>;
}
