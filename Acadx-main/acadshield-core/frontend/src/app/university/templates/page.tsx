"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";

type TemplateRecord = { id: string; documentType: string; templateName: string; version: number; expectedFields: string[]; expectedRegions: { minPages?: number; maxPages?: number } | null; active: boolean };
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

export default function UniversityTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [fields, setFields] = useState("studentName, registerNumber, institutionName");
  const [minPages, setMinPages] = useState("");
  const [maxPages, setMaxPages] = useState("");
  const [activateOnCreate, setActivateOnCreate] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/templates`, { credentials: "include" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active university account." : "Template registry is unavailable.");
    setTemplates(body.templates || []);
  }, []);

  useEffect(() => { load().catch((error: Error) => setMessage(error.message)); }, [load]);

  async function createTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const expectedRegions: Record<string, number> = {};
      if (minPages) expectedRegions.minPages = Number(minPages);
      if (maxPages) expectedRegions.maxPages = Number(maxPages);
      const response = await fetch(`${apiBase}/templates`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: documentType.trim(), templateName: templateName.trim(), expectedFields: fields.split(",").map((field) => field.trim()).filter(Boolean), expectedRegions: Object.keys(expectedRegions).length ? expectedRegions : undefined, active: activateOnCreate }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Template could not be saved.");
      setMessage(`Saved ${body.template.templateName} v${body.template.version}.`);
      setTemplateName("");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Template could not be saved."); }
    finally { setBusy(false); }
  }

  async function activate(template: TemplateRecord) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${apiBase}/templates/${encodeURIComponent(template.id)}/activate`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Template could not be activated.");
      await load(); setMessage(`${template.templateName} v${template.version} is active.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Template could not be activated."); }
    finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-canvas-texture text-forest pb-20"><EnterpriseNavbar activeRole="UNIVERSITY" /><main className="mx-auto max-w-5xl space-y-7 px-6 py-8">
    <header><p className="text-xs font-bold uppercase tracking-widest text-forest/55">University configuration</p><h1 className="mt-2 font-serif text-4xl font-extrabold">Document templates</h1><p className="mt-2 max-w-3xl text-sm text-forest/70">Store expected fields and simple page-count rules for your institution. These checks produce review signals only; they do not establish authenticity.</p></header>
    {message && <div role="status" className="rounded-xl border border-forest/15 bg-white p-3 text-sm">{message}</div>}
    <form onSubmit={createTemplate} className="grid gap-4 rounded-2xl border border-forest/15 bg-white/90 p-6 sm:grid-cols-2">
      <label className="text-xs font-bold uppercase">Document type key<input required maxLength={100} value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="DEGREE_CERTIFICATE" className="mt-2 w-full rounded-xl border border-forest/20 bg-forest/5 px-3 py-3 text-sm font-normal normal-case" /></label>
      <label className="text-xs font-bold uppercase">Template name<input required maxLength={120} value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Undergraduate degree v1" className="mt-2 w-full rounded-xl border border-forest/20 bg-forest/5 px-3 py-3 text-sm font-normal normal-case" /></label>
      <label className="text-xs font-bold uppercase sm:col-span-2">Expected extracted field keys<input value={fields} onChange={(event) => setFields(event.target.value)} placeholder="studentName, registerNumber, institutionName" className="mt-2 w-full rounded-xl border border-forest/20 bg-forest/5 px-3 py-3 text-sm font-normal normal-case" /><span className="mt-1 block text-[11px] font-normal normal-case text-forest/55">Comma-separated candidate fields. Available keys include studentName, registerNumber, institutionName, course, dateOfBirth, issueDate, and certificateNumber.</span></label>
      <label className="text-xs font-bold uppercase">Minimum pages<input type="number" min="1" max="100" value={minPages} onChange={(event) => setMinPages(event.target.value)} className="mt-2 w-full rounded-xl border border-forest/20 bg-forest/5 px-3 py-3 text-sm font-normal" /></label>
      <label className="text-xs font-bold uppercase">Maximum pages<input type="number" min="1" max="100" value={maxPages} onChange={(event) => setMaxPages(event.target.value)} className="mt-2 w-full rounded-xl border border-forest/20 bg-forest/5 px-3 py-3 text-sm font-normal" /></label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={activateOnCreate} onChange={(event) => setActivateOnCreate(event.target.checked)} />Activate this template immediately</label>
      <button disabled={busy} className="rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">{busy ? "Saving…" : "Save template"}</button>
    </form>
    <section className="space-y-3"><h2 className="text-xl font-bold">Registered templates</h2>{templates.length === 0 ? <p className="rounded-xl bg-white/80 p-5 text-sm text-forest/60">No templates have been registered.</p> : templates.map((template) => <article key={template.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-forest/10 bg-white/90 p-4"><div><div className="font-bold">{template.templateName} <span className="text-xs font-normal text-forest/55">v{template.version}</span></div><div className="mt-1 font-mono text-xs">{template.documentType}</div><div className="mt-2 text-xs text-forest/65">Fields: {template.expectedFields.join(", ") || "none"} · Pages: {template.expectedRegions?.minPages ?? "any"}–{template.expectedRegions?.maxPages ?? "any"}</div></div><div className="flex items-center gap-3"><span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-bold">{template.active ? "ACTIVE" : "INACTIVE"}</span>{!template.active && <button disabled={busy} onClick={() => activate(template)} className="rounded-lg border border-forest/20 px-3 py-2 text-xs font-bold disabled:opacity-50">Activate</button>}</div></article>)}</section>
  </main></div>;
}
