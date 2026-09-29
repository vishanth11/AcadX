"use client";
import { useEffect, useRef, useState } from "react";
import { apiBase } from "./RegistryPage";

export default function SharedSummary() {
  const token = useRef("");
  const [records, setRecords] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    if (!token.current) token.current = window.location.hash.slice(1);
    // Keep the capability out of history, referrers and subsequent navigation.
    window.history.replaceState(null, "", window.location.pathname);
    setError(""); setRecords(null);
    fetch(`${apiBase}/shares/resolve`, { method: "POST", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.current }) })
      .then(async response => { if (!response.ok) throw new Error(response.status === 404 ? "This share has expired, was revoked or is unavailable." : "Could not load this share."); return response.json(); })
      .then(body => { if (!controller.signal.aborted) setRecords(body.records); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [revision]);
  return <main className="mx-auto max-w-3xl space-y-6 p-6 text-forest"><h1 className="text-3xl font-bold">Shared credential summaries</h1>
    <p>These are live issuer-registry summaries, not proof of authenticity. Run a credential verification for a verification report.</p>
    {error ? <div role="alert">{error} <button className="underline" onClick={() => setRevision(value => value + 1)}>Retry</button></div> : !records ? <p role="status">Loading share…</p> : !records.length ? <p>No shared credentials are available.</p> : records.map(record => <article className="rounded border p-4" key={String(record.id)}><dl>{Object.entries(record).map(([key, value]) => <div key={key}><dt className="font-bold">{key}</dt><dd className="break-all">{value == null ? "Not recorded" : String(value)}</dd></div>)}</dl></article>)}
  </main>;
}
