"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import { AlertTriangle, CheckCircle2, ExternalLink, Plus, QrCode, Search, ShieldCheck, Sparkles, XCircle } from "lucide-react";

type Credential = { id: string; credentialType: string; subjectReference: string; status: string; issuedAt: string | null; expiresAt: string | null; tokenId: string | null; transactionHash: string | null; document: { id: string; originalFileName: string; documentSha256: string; documentType: string | null } | null };
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function UniversityCredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Credential | null>(null);
  const [mintTarget, setMintTarget] = useState<Credential | null>(null);
  const [mintSuccess, setMintSuccess] = useState<{ tokenId: string; txHash: string } | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/credentials`, { credentials: "include", cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active university account to see this registry." : "Could not load credentials.");
    setCredentials((body.credentials || []) as Credential[]);
  }, []);

  useEffect(() => { load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load credentials.")); }, [load]);

  async function mintNFT(credential: Credential) {
    setLoading(true); setError(""); setMintSuccess(null);
    try {
      const response = await fetch(`${apiBase}/credentials/${encodeURIComponent(credential.id)}/mint`, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error === "OPERATION_PENDING" ? `Operation ${body.operationId} is pending in the queue.` : body.error === "BLOCKCHAIN_ISSUER_NOT_CONFIGURED" ? "Blockchain wallet is not configured for automatic minting." : body.error === "BLOCKCHAIN_SIGNER_NOT_AUTHORIZED" ? "The configured wallet lacks ISSUER_ROLE on the NFT contract." : body.error || "Minting failed.");
        return;
      }
      setMintSuccess({ tokenId: String(body.tokenId || ""), txHash: String(body.transactionHash || "") });
      await load();
    } catch {
      setError("Could not reach the blockchain service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function revoke() {
    if (!selected) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`${apiBase}/credentials/${encodeURIComponent(selected.id)}/revoke`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reason.trim() }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error === "BLOCKCHAIN_ISSUER_NOT_CONFIGURED" ? "This credential is on-chain; configure the issuer wallet before revoking so chain and database status stay aligned." : "Revocation failed. No local revocation was recorded.");
        return;
      }
      setSelected(null); setReason(""); await load();
    } catch { setError("Could not reach the issuer service. Revocation was not confirmed."); }
    finally { setLoading(false); }
  }

  const filtered = credentials.filter((item) => `${item.credentialType} ${item.id} ${item.subjectReference} ${item.document?.originalFileName || ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="UNIVERSITY" />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-forest/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-forest/5 px-3 py-1 text-xs font-semibold uppercase"><ShieldCheck className="h-4 w-4 text-ochre" />Credential Registry</div>
            <h1 className="mt-3 text-3xl font-extrabold font-serif">Issued credentials</h1>
            <p className="mt-1 text-sm text-forest/70">Live records issued by this institution. Mint credentials as on-chain NFTs directly or revoke when necessary.</p>
          </div>
          <Link href="/university/credentials/create" className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-forest/90 transition-all"><Plus className="h-4 w-4" />Issue credential</Link>
        </header>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-forest/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search credential, DID, or source file" className="w-full rounded-xl border border-forest/20 bg-white py-2.5 pl-10 pr-4 text-sm" /></div>
          <span className="rounded-xl bg-white px-4 py-2.5 text-sm">{filtered.length} record(s)</span>
        </div>
        {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}

        <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest/5 text-xs uppercase">
              <tr>
                <th className="p-4">Credential</th>
                <th className="p-4">Subject reference</th>
                <th className="p-4">Source document</th>
                <th className="p-4">Lifecycle / chain</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filtered.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="p-4">
                    <div className="font-bold">{item.credentialType}</div>
                    <code className="mt-1 block break-all text-[11px] text-forest/60">{item.id}</code>
                    <div className="mt-1 text-xs text-forest/60">Issued {item.issuedAt ? new Date(item.issuedAt).toLocaleDateString() : "date unavailable"}</div>
                  </td>
                  <td className="p-4 font-mono text-xs break-all">{item.subjectReference}</td>
                  <td className="p-4">
                    {item.document ? (
                      <>
                        <div className="font-medium">{item.document.documentType || "Academic document"}</div>
                        <div className="text-xs text-forest/60 truncate max-w-xs">{item.document.originalFileName}</div>
                      </>
                    ) : "Missing"}
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-1.5 font-bold">
                      <span className={`inline-block w-2 h-2 rounded-full ${item.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {item.status}
                    </div>
                    <div className="mt-1">
                      {item.tokenId ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                          NFT Token #{item.tokenId}
                        </span>
                      ) : (
                        <span className="text-xs text-forest/50">Not minted</span>
                      )}
                    </div>
                    {item.transactionHash && (
                      <code className="mt-1 block max-w-44 truncate text-[10px] text-forest/60" title={item.transactionHash}>
                        {item.transactionHash}
                      </code>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.status === "ACTIVE" && !item.tokenId && (
                        <button
                          onClick={() => { setMintTarget(item); setMintSuccess(null); setError(""); }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-forest text-white hover:bg-forest/90 px-3 py-1.5 text-xs font-bold transition-colors shadow-sm"
                          title="Mint ERC-721 Document NFT on Polygon"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                          Mint NFT
                        </button>
                      )}
                      <Link
                        href={`/verify/${encodeURIComponent(item.id)}`}
                        target="_blank"
                        aria-label="Open public resolver"
                        title="Open public verification page"
                        className="rounded-lg border border-forest/15 p-2 hover:bg-forest/5 text-forest/80 hover:text-forest transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/university/qr"
                        aria-label="Generate QR"
                        title="View QR Code"
                        className="rounded-lg border border-forest/15 p-2 hover:bg-forest/5 text-forest/80 hover:text-forest transition-colors"
                      >
                        <QrCode className="h-4 w-4" />
                      </Link>
                      {item.status === "ACTIVE" && (
                        <button
                          onClick={() => { setSelected(item); setReason(""); }}
                          aria-label="Revoke credential"
                          title="Revoke credential"
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={5} className="p-8 text-center text-sm text-forest/60">No live credential records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>

      {mintTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="mint-title" className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="rounded-xl bg-forest/10 p-3 text-forest">
                <Sparkles className="h-6 w-6 text-ochre" />
              </div>
              <div>
                <h2 id="mint-title" className="text-xl font-extrabold font-serif">Mint Document NFT</h2>
                <p className="text-xs text-forest/60">Polygon Amoy Testnet (Chain ID 80002)</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-forest/5 p-3 space-y-1">
                <div className="text-xs uppercase font-bold text-forest/50">Credential ID</div>
                <code className="block break-all font-mono text-xs">{mintTarget.id}</code>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-forest/60">Type:</span> <strong>{mintTarget.credentialType}</strong></div>
                <div><span className="text-forest/60">Subject:</span> <strong className="truncate font-mono">{mintTarget.subjectReference}</strong></div>
              </div>
              <p className="text-xs text-forest/75 leading-relaxed">
                This will mint an ERC-721 token bound cryptographically to the source document SHA-256 hash and the signed Verifiable Credential.
              </p>
            </div>

            {mintSuccess && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  NFT Successfully Minted!
                </div>
                <div className="text-xs">Token ID: <strong>#{mintSuccess.tokenId}</strong></div>
                <code className="block break-all text-[11px] text-emerald-800">{mintSuccess.txHash}</code>
              </div>
            )}

            {error && <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setMintTarget(null); setMintSuccess(null); }} className="rounded-xl border px-4 py-2.5 text-sm font-bold hover:bg-forest/5">
                {mintSuccess ? "Close" : "Cancel"}
              </button>
              {!mintSuccess && (
                <button
                  disabled={loading}
                  onClick={() => mintNFT(mintTarget)}
                  className="rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-forest/90 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loading ? "Minting on-chain…" : "Confirm & Mint NFT"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="revoke-title" className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
            <div>
              <h2 id="revoke-title" className="text-lg font-extrabold">Revoke credential</h2>
              <p className="mt-1 break-all font-mono text-xs">{selected.id}</p>
            </div>
            <p className="text-sm text-forest/70">For minted credentials, the chain revocation is confirmed before the local registry changes. This action cannot be undone.</p>
            <label htmlFor="revoke-reason" className="block text-xs font-bold uppercase">Required reason</label>
            <textarea id="revoke-reason" minLength={5} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-xl border border-forest/20 bg-forest/5 p-3 text-sm" rows={3} />
            {error && <div role="alert" className="text-sm text-red-700">{error}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="rounded-xl border px-4 py-2 text-sm font-bold">Cancel</button>
              <button disabled={loading || reason.trim().length < 5} onClick={revoke} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{loading ? "Confirming…" : "Confirm revocation"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
