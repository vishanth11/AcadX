"use client";
import { useState } from "react";
import { apiBase } from "./RegistryPage";

export default function StudentEnrollment() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subjectReference, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <main className="mx-auto max-w-3xl space-y-5 p-6 text-forest"><h1 className="text-3xl font-bold">Enroll a student</h1>
    <p>Verify the student’s identity first. The subject DID must exactly match the credentials your institution issued. This grants access to those credential summaries and sharing controls. Deliver account credentials through your institution’s secure channel.</p>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const response = await fetch(`${apiBase}/students`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, subjectReference }) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Enrollment failed.");
        setPassword(""); setMessage(`Student enrolled: ${body.id}. They can sign in at /login/student.`);
      } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Enrollment failed."); }
      finally { setBusy(false); }
    }}>
      <label className="block">Student email<input className="block w-full rounded border p-2" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label className="block">Credential subject DID<input className="block w-full rounded border p-2" required pattern="did:.+" maxLength={160} value={subjectReference} onChange={event => setSubject(event.target.value)} /></label>
      <label className="block">Initial password (12–72 characters)<input className="block w-full rounded border p-2" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button className="underline" disabled={busy}>Enroll student</button>
    </form>{message && <p role="status">{message}</p>}
  </main>;
}
