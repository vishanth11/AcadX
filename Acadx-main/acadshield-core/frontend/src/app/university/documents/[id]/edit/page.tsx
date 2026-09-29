"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";

export default function EditSourceDocumentPage() {
  const params = useParams<{ id: string }>();
  const documentId = params.id;
  return <div className="min-h-screen bg-canvas-texture pb-20 text-forest"><EnterpriseNavbar activeRole="UNIVERSITY"/><main className="mx-auto max-w-3xl space-y-5 px-6 py-12"><p className="text-xs font-bold uppercase tracking-widest text-forest/55">Document record</p><h1 className="font-serif text-4xl font-extrabold">Source document changes</h1><p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Uploaded source bytes and extracted evidence are not editable in place. Upload a new source record and review it separately. No simulated “version 2” has been created.</p><code className="block break-all rounded-xl bg-white p-4 text-xs">Document ID: {documentId}</code><Link href="/university/documents/upload" className="inline-block rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white">Upload another source record</Link></main></div>;
}
