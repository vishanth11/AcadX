"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileCheck2, KeyRound, Search, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [credentialId, setCredentialId] = useState("");
  const [error, setError] = useState("");

  function openResolver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = credentialId.trim();
    if (!value) { setError("Enter a credential ID to check the Core registry."); return; }
    setError("");
    router.push(`/verify/${encodeURIComponent(value)}`);
  }

  return <div className="min-h-screen bg-canvas-texture text-forest">
    <header className="border-b border-forest/10 bg-white/80"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5"><Link href="/" className="text-xl font-black tracking-tight">ACADSHIELD<span className="text-ochre">.X</span></Link><nav className="flex items-center gap-3"><Link href="/login/university" className="rounded-lg border border-forest/20 px-3 py-2 text-xs font-bold">University</Link><Link href="/login/company" className="rounded-lg bg-forest px-3 py-2 text-xs font-bold text-white">Company verifier</Link></nav></div></header>
    <main className="mx-auto max-w-7xl space-y-16 px-6 py-16 sm:py-24">
      <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-ochre">Academic credential registry</p><h1 className="mt-4 max-w-3xl font-serif text-5xl font-extrabold leading-tight sm:text-6xl">Check the record.<br/>Review the evidence.</h1><p className="mt-5 max-w-2xl text-base leading-relaxed text-forest/70">ACADSHIELD Core stores institution-reviewed source documents and signed credentials. Public checks report the issuer signature, registry record, lifecycle, and any configured chain evidence separately.</p><form onSubmit={openResolver} className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-forest/15 bg-white p-3 shadow-sm sm:flex-row"><label className="flex min-w-0 flex-1 items-center gap-3 px-3"><Search className="h-5 w-5 shrink-0 text-forest/45"/><input value={credentialId} onChange={(event) => setCredentialId(event.target.value)} placeholder="Enter credential ID" aria-label="Credential ID" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"/></label><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white">Check registry <ArrowRight className="h-4 w-4"/></button></form>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}<p className="mt-3 text-xs text-forest/55">A registry result is not a guarantee of authenticity. Missing external source checks are shown explicitly.</p></div>
        <aside className="rounded-3xl border border-forest/10 bg-white/90 p-7 shadow-sm"><div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-ochre"/><div><p className="font-bold">Evidence layers</p><p className="text-xs text-forest/55">Each check reports its own status</p></div></div><ul className="mt-6 space-y-4 text-sm">{["Issuer signature and credential lifecycle", "Exact uploaded-file SHA-256 comparison", "Institution source record and review status", "Blockchain receipt when a contract is configured"].map((item) => <li key={item} className="flex gap-3"><FileCheck2 className="h-4 w-4 shrink-0 text-forest/55"/><span>{item}</span></li>)}</ul><div className="mt-6 rounded-xl bg-forest/5 p-4 text-xs leading-relaxed text-forest/70">NAD/DigiLocker and production chain checks require deployment credentials and approved integrations. AI evidence supports review; it does not authenticate a credential.</div></aside>
      </section>
      <section className="grid gap-5 md:grid-cols-3"><article className="rounded-2xl border border-forest/10 bg-white p-6"><KeyRound className="h-6 w-6 text-ochre"/><h2 className="mt-4 font-bold">Institution-controlled issuance</h2><p className="mt-2 text-sm text-forest/65">Universities upload a source record, review analysis evidence, and sign a credential with a configured issuer key.</p></article><article className="rounded-2xl border border-forest/10 bg-white p-6"><ShieldCheck className="h-6 w-6 text-ochre"/><h2 className="mt-4 font-bold">Explicit chain action</h2><p className="mt-2 text-sm text-forest/65">Minting is separate from issuance. The contract generates the token ID and the API stores the confirmed transaction receipt.</p></article><article className="rounded-2xl border border-forest/10 bg-white p-6"><FileCheck2 className="h-6 w-6 text-ochre"/><h2 className="mt-4 font-bold">Reviewable document evidence</h2><p className="mt-2 text-sm text-forest/65">OCR candidates, template differences, and cross-document identity inconsistencies remain review signals for an authorized person.</p></article></section>
    </main>
    <footer className="border-t border-forest/10 bg-white/70 px-6 py-8 text-center text-xs text-forest/55">ACADSHIELD Core · status reflects the configured registry and services</footer>
  </div>;
}
