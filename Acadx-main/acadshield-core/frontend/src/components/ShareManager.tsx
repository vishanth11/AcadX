"use client";
import { useState } from "react";
import { apiBase } from "./RegistryPage";
import RegistryPage from "./RegistryPage";

export default function ShareManager() {
  const [ids, setIds] = useState("");
  const [purpose, setPurpose] = useState("");
  const [consent, setConsent] = useState(false);
  const [grantId, setGrantId] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  async function submit(revoke: boolean) {
    setBusy(true); setMessage(""); setLink("");
    try {
      const response = await fetch(`${apiBase}/student/shares${revoke ? `/${encodeURIComponent(grantId)}/revoke` : ""}`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(revoke ? {} : { credentialIds: ids.split(",").map(id => id.trim()).filter(Boolean), purpose, consent, expiresAt: new Date(Date.now() + 86400000).toISOString() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Change not saved.");
      if (body.token) setLink(`${window.location.origin}/p/view#${body.token}`);
      setMessage(revoke ? "Sharing revoked. Previously downloaded information cannot be recalled." : "Link created for 24 hours. Copy it now; it will not be shown again.");
      setRevision(value => value + 1);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Request failed."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-5xl space-y-5 p-6 text-forest"><h1 className="text-3xl font-bold">Consent-based credential sharing</h1>
    <p>Shares only credential ID, type, issuer, lifecycle status and dates—not documents, grades, names or signed credentials. Anyone with the link can view it. This is not an authenticity report.</p>
    <form className="space-y-3" onSubmit={event => { event.preventDefault(); void submit(false); }}>
      <label className="block">Credential IDs (comma separated)<input className="block w-full rounded border p-2" required value={ids} onChange={event => setIds(event.target.value)} /></label>
      <label className="block">Purpose<input className="block w-full rounded border p-2" required minLength={5} maxLength={200} value={purpose} onChange={event => setPurpose(event.target.value)} /></label>
      <label className="block"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /> I consent to these summaries being accessible through this link for 24 hours.</label>
      <button className="underline" disabled={busy || !consent}>Create sharing link</button>
    </form>
    {link && <label className="block">Private sharing link<input className="block w-full rounded border p-2" readOnly value={link} onFocus={event => event.target.select()} /></label>}
    <form onSubmit={event => { event.preventDefault(); void submit(true); }} className="space-y-3">
      <label className="block">Share ID to revoke<input className="block w-full rounded border p-2" required value={grantId} onChange={event => setGrantId(event.target.value)} /></label>
      <button className="underline" disabled={busy}>Revoke sharing</button>
    </form>
    {message && <p role="status">{message}</p>}
    <RegistryPage key={revision} title="Your sharing history" endpoint="/student/shares" />
    <RegistryPage title="Your credentials" endpoint="/student/credentials" />
  </main>;
}
