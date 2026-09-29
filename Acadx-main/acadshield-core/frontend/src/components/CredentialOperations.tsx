"use client";
import { useState } from "react";
import RegistryPage, { apiBase } from "./RegistryPage";

export default function CredentialOperations() {
  const [id, setId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  return <main className="mx-auto max-w-5xl space-y-5 p-6 text-forest"><h1 className="text-3xl font-bold">Blockchain operations</h1>
    <p>Reconciliation checks the saved transaction and may rebroadcast those same signed bytes. It does not create a new transaction. A pending result is not confirmation.</p>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const response = await fetch(`${apiBase}/credential-operations/${encodeURIComponent(id)}/reconcile`, { method: "POST", credentials: "include" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Reconciliation unavailable.");
        setMessage(`Operation ${body.operationId}: ${body.status}. Transaction: ${body.transactionHash}`); setRevision(value => value + 1);
      } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Reconciliation failed."); }
      finally { setBusy(false); }
    }}><label className="block">Operation ID<input className="block w-full rounded border p-2" required value={id} onChange={event => setId(event.target.value)} /></label><button className="underline" disabled={busy}>Reconcile operation</button></form>
    {message && <p role="status">{message}</p>}
    <RegistryPage key={revision} title="Pending operations (oldest first)" endpoint="/credential-operations" />
    <RegistryPage title="Recorded mints" endpoint="/registry/credentials" mintedOnly />
  </main>;
}
