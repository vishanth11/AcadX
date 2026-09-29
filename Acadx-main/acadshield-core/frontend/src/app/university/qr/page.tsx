"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, Copy, Download, ExternalLink, QrCode } from "lucide-react";

type Credential = { id: string; credentialType: string; status: string; tokenId: string | null; transactionHash: string | null; document: { originalFileName: string } | null };
type QrResult = { credentialId: string; verificationUrl: string; qrDataUrl: string };
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function UniversityQRPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialId, setCredentialId] = useState("");
  const [qr, setQr] = useState<QrResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/credentials`, { credentials: "include", cache: "no-store" }).then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("Sign in with a university account to load your credentials.");
      return (body.credentials || []) as Credential[];
    }).then((items) => { if (active) { setCredentials(items); setCredentialId(items[0]?.id || ""); } }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Credential list unavailable."); });
    return () => { active = false; };
  }, []);

  async function generate() {
    if (!credentialId) return;
    setLoading(true); setError(""); setQr(null);
    try {
      const response = await fetch(`${apiBase}/credentials/${encodeURIComponent(credentialId)}/qr`, { credentials: "include", cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error === "PUBLIC_RESOLVER_URL_NOT_CONFIGURED" ? "Set VERIFY_BASE_URL to enable QR generation." : "QR generation failed for this credential.");
      setQr(body as QrResult);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "QR generation failed."); }
    finally { setLoading(false); }
  }

  const selected = credentials.find((item) => item.id === credentialId);
  async function copyUrl() {
    if (!qr) return;
    try { await navigator.clipboard.writeText(qr.verificationUrl); } catch { setError("Could not copy the URL. Select and copy it from the field."); }
  }

  return (
    <main className="p-6 sm:p-10 space-y-8 max-w-4xl">
      <header className="space-y-2 pb-6 border-b border-forest/15">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80"><QrCode className="w-3.5 h-3.5 text-ochre" />Public Resolver QR</div>
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">Credential verification QR</h1>
        <p className="text-sm text-forest/70">The QR encodes the public resolver URL. It does not itself prove the credential is valid.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-2 border-forest/15 rounded-3xl p-8 shadow-sm">
        <div className="space-y-4 text-sm">
          <label htmlFor="credential" className="block font-bold text-forest">Select credential</label>
          <select id="credential" value={credentialId} onChange={(event) => { setCredentialId(event.target.value); setQr(null); }} className="w-full px-3.5 py-3 rounded-xl border border-forest/20 bg-forest/5 text-forest" disabled={!credentials.length}>
            <option value="">{credentials.length ? "Choose credential" : "No credentials available"}</option>
            {credentials.map((item) => <option key={item.id} value={item.id}>{item.credentialType} · {item.id}</option>)}
          </select>
          {selected && <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 space-y-2 text-xs"><div>Credential ID: <span className="font-mono break-all">{selected.id}</span></div><div>Source: {selected.document?.originalFileName || "Not linked"}</div><div>Status: <strong>{selected.status}</strong></div><div>Token ID: {selected.tokenId ? `#${selected.tokenId}` : "Not minted"}</div><div>Transaction: <span className="font-mono break-all">{selected.transactionHash || "Not recorded"}</span></div></div>}
          <button type="button" onClick={generate} disabled={!credentialId || loading} className="rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? "Generating…" : "Generate QR code"}</button>
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-forest/5 border border-forest/10 text-center space-y-4 min-h-72">
          {qr ? <>
            <Image src={qr.qrDataUrl} alt={`Credential resolver QR for ${qr.credentialId}`} width={224} height={224} unoptimized className="rounded-xl border border-forest/20 bg-white p-2" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a href={qr.qrDataUrl} download={`acadshield-${qr.credentialId}-qr.png`} className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white"><Download className="h-4 w-4" />Download PNG</a>
              <button type="button" onClick={copyUrl} className="inline-flex items-center gap-2 rounded-xl border border-forest/20 px-4 py-2 text-xs font-bold"><Copy className="h-4 w-4" />Copy link</button>
            </div>
            <a href={qr.verificationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-xs text-forest underline">{qr.verificationUrl}<ExternalLink className="h-3 w-3 shrink-0" /></a>
          </> : <div className="text-sm text-forest/60">Choose a credential and generate its server-created QR code.</div>}
        </div>
      </section>
      {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
      <Link href="/university/credentials" className="text-sm font-semibold text-forest underline">Back to Credentials</Link>
    </main>
  );
}
