import Link from "next/link";
import type { UserRole } from "@/lib/roles";

export type FeatureLink = { href: string; label: string };

export default function UnavailableFeaturePage({ role, title, description, links = [] }: { role: UserRole; title: string; description: string; links?: FeatureLink[] }) {
  return <div data-role={role ?? undefined} className="min-h-full bg-canvas-texture pb-20 text-forest"><main className="mx-auto max-w-3xl space-y-5 px-6 py-12"><p className="text-xs font-bold uppercase tracking-widest text-forest/55">Feature status</p><h1 className="font-serif text-4xl font-extrabold">{title}</h1><p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">{description}</p>{links.length > 0 && <nav className="flex flex-wrap gap-3">{links.map((link) => <Link key={link.href} href={link.href} className="rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white">{link.label}</Link>)}</nav>}</main></div>;
}
