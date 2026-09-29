"use client";
import { useState } from "react";
import RegistryPage, { apiBase } from "./RegistryPage";

export default function EmployerReports() {
  const [id, setId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <main className="mx-auto max-w-5xl p-6 text-forest"><h1 className="text-3xl font-bold">Employer verification reports</h1>
    <p className="my-4">Export recorded evidence from your company’s verifications. Reports show results at verification time, not a guarantee of current validity.</p>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError("");
      try {
        const response = await fetch(`${apiBase}/company/reports/${encodeURIComponent(id)}`, { credentials: "include", cache: "no-store" });
        if (!response.ok) throw new Error(response.status === 404 ? "Report not found." : "Report export failed. Check your session and retry.");
        const url = URL.createObjectURL(await response.blob());
        const anchor = document.createElement("a"); anchor.href = url; anchor.download = `verification-${id}.json`; anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Report export failed."); }
      finally { setBusy(false); }
    }}><label className="block">Verification ID<input className="block w-full rounded border p-2" required value={id} onChange={event => setId(event.target.value)} /></label><button className="underline" disabled={busy}>Download JSON report</button></form>
    {error && <p role="alert">{error}</p>}
    <RegistryPage title="Available reports" endpoint="/company/reports" />
  </main>;
}
