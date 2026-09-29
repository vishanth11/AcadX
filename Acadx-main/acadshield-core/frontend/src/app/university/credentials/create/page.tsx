"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

type SourceDocument = { id: string; originalFileName: string; documentType: string | null; documentSha256: string; status: string };
type PriorCredential = { id: string; credentialType: string; subjectReference: string; status: string; transactionHash: string | null; supersedesId: string | null };
type IssuedCredential = { credentialId: string; status: string; issuerDid: string; subjectDid: string; credentialSha256: string; proof: { format: string; algorithm: string; verificationStatus: string }; blockchain: { status: string } };
type MintReceipt = { tokenId: string; transactionHash: string; blockNumber: string; chainId: number; contractAddress: string; status: string };

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function CreateCredentialPage() {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [priorCredentials, setPriorCredentials] = useState<PriorCredential[]>([]);
  const [supersedesId, setSupersedesId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [credentialType, setCredentialType] = useState("AcademicCredential");
  const [subjectDid, setSubjectDid] = useState("");
  const [holderName, setHolderName] = useState("");
  const [qualification, setQualification] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [issued, setIssued] = useState<IssuedCredential | null>(null);
  const [minted, setMinted] = useState<MintReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/documents`, { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active university account to issue credentials." : "Could not load source documents.");
        return (body.documents || []) as SourceDocument[];
      })
      .then((items) => { if (active) { const approved = items.filter((item) => item.status === "VERIFIED"); setDocuments(approved); setDocumentId(approved[0]?.id || ""); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load source documents."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/credentials`, { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error("Could not load prior credentials.");
        return (body.credentials || []) as PriorCredential[];
      })
      .then((items) => { if (active) setPriorCredentials(items.filter((item) => ["ACTIVE", "REVOKED", "EXPIRED"].includes(item.status))); })
      .catch(() => { if (active) setPriorCredentials([]); });
    return () => { active = false; };
  }, []);

  async function issueCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const document = documents.find((item) => item.id === documentId);
    if (!document || document.status !== "VERIFIED") { setError("Choose a source document that has passed institutional review."); return; }
    setLoading(true); setError(""); setMinted(null);
    try {
      const response = await fetch(`${apiBase}/credentials`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          credentialType,
          ...(supersedesId ? { supersedesId } : {}),
          subjectDid: subjectDid.trim(),
          credentialSubject: { name: holderName.trim(), qualification: qualification.trim(), ...(graduationYear ? { graduationYear: Number(graduationYear) } : {}) },
          ...(expiresOn ? { expiresAt: new Date(`${expiresOn}T00:00:00.000Z`).toISOString() } : {}),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setError(body.error === "CREDENTIAL_ISSUER_NOT_CONFIGURED" ? "Issuer signing keys are not configured for this institution." : body.error === "DOCUMENT_REVIEW_REQUIRED" ? "The source document must be approved first." : body.error === "CREDENTIAL_VERSION_REQUIRES_ONCHAIN_REVOCATION" ? "Revoke the previous minted credential on-chain before issuing a replacement." : body.error?.startsWith("CREDENTIAL_VERSION_") ? "The selected prior credential cannot be replaced. Check its lifecycle and holder." : "Credential issuance failed. Check issuer configuration and entered details."); return; }
      setIssued(body as IssuedCredential);
    } catch { setError("Could not reach the credential issuer. No credential was issued."); }
    finally { setLoading(false); }
  }

  async function mintCredential() {
    if (!issued) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`${apiBase}/credentials/${encodeURIComponent(issued.credentialId)}/mint`, { method: "POST", credentials: "include" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setError(body.error === "BLOCKCHAIN_ISSUER_NOT_CONFIGURED" ? "Minting is not configured. The signed credential is issued; no NFT was minted." : body.error === "BLOCKCHAIN_SIGNER_NOT_AUTHORIZED" ? "The configured wallet needs ISSUER_ROLE on the deployed contract." : "Blockchain minting was not confirmed. The signed credential remains available without an NFT."); return; }
      setMinted(body as MintReceipt);
    } catch { setError("Could not reach the blockchain service. The credential is issued, but no mint was confirmed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="UNIVERSITY" />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-7">
        <Link href="/university/credentials" className="inline-flex items-center gap-2 text-sm font-semibold text-forest/70 hover:text-forest"><ArrowLeft className="w-4 h-4" />Back to Credentials</Link>
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-3"><ShieldCheck className="w-3.5 h-3.5 text-ochre" />Issuer Workflow</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">Issue a verifiable credential</h1>
          <p className="mt-2 text-forest/75 text-sm">Only a reviewed source document can be issued. Replacements preserve a version link; an already minted prior credential must first be revoked on-chain. NFT minting is a separate, explicit action.</p>
        </header>

        {!issued ? <form onSubmit={issueCredential} className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
          <div><label htmlFor="source-document" className="block text-xs font-bold uppercase text-forest/70 mb-2">Approved source document</label>
            <select id="source-document" required value={documentId} onChange={(event) => setDocumentId(event.target.value)} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm" disabled={!documents.length}>
              <option value="">{documents.length ? "Select a reviewed document" : "No approved source documents available"}</option>
              {documents.map((item) => <option key={item.id} value={item.id}>{item.documentType || "Academic document"} — {item.originalFileName} — {item.id}</option>)}
            </select>
          </div>
          <div><label htmlFor="supersedes-credential" className="block text-xs font-bold uppercase text-forest/70 mb-2">Replacement credential (optional)</label><select id="supersedes-credential" value={supersedesId} onChange={(event) => setSupersedesId(event.target.value)} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm"><option value="">Issue as a new credential</option>{priorCredentials.filter((item) => item.credentialType === credentialType && item.subjectReference === subjectDid.trim() && !priorCredentials.some((candidate) => candidate.supersedesId === item.id)).map((item) => <option key={item.id} value={item.id}>{item.id} · {item.status}{item.transactionHash && item.status !== "REVOKED" ? " · revoke on-chain first" : ""}</option>)}</select><p className="mt-1 text-[11px] text-forest/55">Only a same-holder, same-type prior credential can be replaced. Minted credentials must be revoked before replacement.</p></div>
          {documentId && <div className="rounded-xl bg-forest/5 p-4 text-xs"><div>Registered SHA-256</div><code className="break-all">{documents.find((item) => item.id === documentId)?.documentSha256}</code></div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label htmlFor="credential-type" className="block text-xs font-bold uppercase text-forest/70 mb-2">Credential type</label><input id="credential-type" required pattern="[A-Za-z][A-Za-z0-9]{1,80}" value={credentialType} onChange={(event) => setCredentialType(event.target.value)} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm" /></div>
            <div><label htmlFor="subject-did" className="block text-xs font-bold uppercase text-forest/70 mb-2">Holder DID</label><input id="subject-did" required minLength={5} maxLength={255} value={subjectDid} onChange={(event) => setSubjectDid(event.target.value)} placeholder="did:key:…" className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 font-mono text-sm" /></div>
            <div><label htmlFor="holder-name" className="block text-xs font-bold uppercase text-forest/70 mb-2">Holder name</label><input id="holder-name" required value={holderName} onChange={(event) => setHolderName(event.target.value)} maxLength={200} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm" /></div>
            <div><label htmlFor="qualification" className="block text-xs font-bold uppercase text-forest/70 mb-2">Qualification / award</label><input id="qualification" required value={qualification} onChange={(event) => setQualification(event.target.value)} maxLength={300} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm" /></div>
            <div><label htmlFor="graduation-year" className="block text-xs font-bold uppercase text-forest/70 mb-2">Graduation year (optional)</label><input id="graduation-year" type="number" min="1900" max="2200" value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm" /></div>
            <div><label htmlFor="expires-on" className="block text-xs font-bold uppercase text-forest/70 mb-2">Expiry (optional)</label><input id="expires-on" type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} className="w-full rounded-xl border border-forest/20 bg-forest/5 px-4 py-3 text-sm" /></div>
          </div>
          {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
          <button disabled={loading || !documents.length} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? "Signing…" : "Issue signed credential"}<ArrowRight className="h-4 w-4" /></button>
        </form> : <section className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
          <div className="flex items-start gap-3"><CheckCircle2 className="h-7 w-7 text-emerald-700" /><div><span className="text-xs uppercase font-bold text-forest/50">Credential issued</span><h2 className="text-xl font-extrabold">Signed VC-JWT ({issued.proof.algorithm})</h2></div></div>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm"><div><dt className="text-xs uppercase font-bold text-forest/50">Credential ID</dt><dd className="font-mono break-all">{issued.credentialId}</dd></div><div><dt className="text-xs uppercase font-bold text-forest/50">Issuer</dt><dd className="font-mono break-all">{issued.issuerDid}</dd></div><div><dt className="text-xs uppercase font-bold text-forest/50">Holder DID</dt><dd className="font-mono break-all">{issued.subjectDid}</dd></div><div><dt className="text-xs uppercase font-bold text-forest/50">VC SHA-256</dt><dd className="font-mono break-all">{issued.credentialSha256}</dd></div></dl>
          {minted ? <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 space-y-2"><h3 className="font-bold">Chain transaction confirmed</h3><div className="text-sm">Token ID <strong>#{minted.tokenId}</strong> · chain {minted.chainId} · block {minted.blockNumber}</div><div className="font-mono text-xs break-all">{minted.transactionHash}</div><div className="font-mono text-xs break-all">Contract: {minted.contractAddress}</div><Link href={`/verify/${encodeURIComponent(issued.credentialId)}`} className="inline-flex items-center gap-2 text-sm font-bold underline">Open public resolver <ArrowRight className="h-4 w-4" /></Link></div> : <div className="space-y-3"><p className="text-sm text-forest/70">No NFT is created until you explicitly request the chain transaction.</p><button type="button" disabled={loading} onClick={mintCredential} className="rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? "Waiting for confirmation…" : "Mint NFT and record on chain"}</button></div>}
          {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}
          <Link href="/university/credentials" className="block text-sm font-semibold underline">Return to credentials list</Link>
        </section>}
      </main>
    </div>
  );
}
