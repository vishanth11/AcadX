"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";

export default function StudentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <main className="mx-auto max-w-md space-y-6 p-8 text-forest"><h1 className="text-3xl font-bold">Student sign in</h1>
    <p>Your institution must first enroll your account and assign your credential identity.</p>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError("");
      try { await signIn(email, password, "STUDENT"); router.push("/student"); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Sign in failed."); }
      finally { setBusy(false); }
    }}>
      <label className="block">Email<input className="block w-full rounded border p-2" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label className="block">Password<input className="block w-full rounded border p-2" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button disabled={busy} className="rounded bg-forest px-5 py-2 text-white">{busy ? "Signing in…" : "Sign in"}</button>
      {error && <p role="alert">{error}</p>}
    </form></main>;
}
