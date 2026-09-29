"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";

export default function DocumentHistoryPage() {
  const params = useParams<{ id: string }>();
  const documentId = params.id;
  return <div className="min-h-screen bg-canvas-texture pb-20 text-forest"><EnterpriseNavbar activeRole="UNIVERSITY"/><main className="mx-auto max-w-3xl space-y-5 px-6 py-12"><p className="text-xs font-bold uppercase tracking-widest text-forest/55">Document record</p><h1 className="font-serif text-4xl font-extrabold">Source document history</h1><p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Version history for source documents is not implemented. This page does not display a fabricated lineage. Credential replacements are linked in the credential registry and require revocation of any prior minted credential.</p><code className="block break-all rounded-xl bg-white p-4 text-xs">Document ID: {documentId}</code><Link href={`/university/documents/${encodeURIComponent(documentId)}`} className="inline-block rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white">Back to document record</Link></main></div>;
}
