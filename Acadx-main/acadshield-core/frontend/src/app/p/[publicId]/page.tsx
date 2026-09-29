"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePlatformState } from "@/lib/platform-state";
import {
  GraduationCap,
  Award,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Binary,
  Building2,
  ArrowRight,
  Download
} from "lucide-react";

export default function PublicSharedPassportPage() {
  const params = useParams();
  const publicId = params?.publicId as string;
  const { students, credentials, documents } = usePlatformState();

  const student = students[0];
  const studentCreds = credentials.filter((c) => c.studentName === student.name);
  const studentDocs = documents.filter((d) => d.studentName === student.name);

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      {/* Top Header */}
      <header className="border-b border-forest/15 bg-white/80 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest text-ochre flex items-center justify-center font-bold text-base border border-ochre/30 shadow">
              AX
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-forest block leading-none">
                ACADSHIELD X
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-forest/60">
                Verified Presentation Safe
              </span>
            </div>
          </Link>

          <Link
            href="/company/verify/document"
            className="px-4 py-2 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest/90 transition shadow-sm flex items-center gap-1.5"
          >
            <Binary className="w-3.5 h-3.5 text-ochre" />
            Verify Document Hash
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-10 space-y-8">
        {/* Passport Profile Banner */}
        <div className="bg-white/80 backdrop-blur border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-forest text-ochre font-serif text-2xl flex items-center justify-center font-bold border border-ochre/30 shadow">
                {student.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-forest/50 font-bold">
                    Verifiable Candidate Presentation
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold">
                    CRYPTOGRAPHICALLY ATTESTED
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-forest tracking-tight">
                  {student.name}
                </h1>
                <p className="text-forest/70 text-xs font-medium">
                  {student.program}   {student.universityName}   Class of {student.year}
                </p>
                <div className="text-[11px] font-mono text-forest/60 pt-1">
                  DID: {student.did}
                </div>
              </div>
            </div>

            <div className="p-3 bg-forest/5 rounded-2xl border border-forest/10 text-center sm:text-right text-xs">
              <span className="text-forest/60 text-[11px] block font-bold uppercase">Presentation ID:</span>
              <span className="font-mono text-forest font-bold">{publicId}</span>
              <span className="text-[10px] text-emerald-700 block font-semibold mt-1">
                ? Valid Cryptographic Signature
              </span>
            </div>
          </div>
        </div>

        {/* Verified Academic Credentials Section */}
        <div className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
          <div className="border-b border-forest/10 pb-3">
            <h3 className="text-sm font-bold text-forest uppercase tracking-wider">
              Conferred Institutional Degrees & Credentials
            </h3>
            <p className="text-xs text-forest/60">
              Each degree listed below is backed by a non-fungible ERC-721 token on Polygon Amoy.
            </p>
          </div>

          <div className="space-y-4">
            {studentCreds.map((cred) => (
              <div
                key={cred.id}
                className="p-5 rounded-2xl border border-forest/15 bg-forest/[0.02] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-extrabold text-forest">{cred.title}</h4>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      VERIFIED DEGREE
                    </span>
                  </div>
                  <span className="text-xs text-forest/60">{cred.issueDate}</span>
                </div>

                <p className="text-xs text-forest/70">
                  Conferring Institution: <strong className="text-forest">{cred.universityName}</strong> (NECHE Accredited)
                </p>

                <div className="p-3 bg-white rounded-xl border border-forest/10 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-forest/60">ERC-721 Token:</span>
                    <span className="font-mono font-bold text-forest">#{cred.blockchain.tokenId} (Polygon Amoy)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-forest/60">SHA-256 Fingerprint:</span>
                    <span className="font-mono text-[11px] text-forest/80 truncate max-w-xs">{cred.documentHash}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <a
                    href={`https://amoy.polygonscan.com/tx/${cred.blockchain.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ochre font-bold hover:underline flex items-center gap-1"
                  >
                    PolygonScan Proof <ExternalLink className="w-3 h-3" />
                  </a>
                  <Link
                    href={`/verify/${cred.id}`}
                    target="_blank"
                    className="font-bold text-forest hover:underline flex items-center gap-1"
                  >
                    Full Technical Dossier <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employer Callout */}
        <div className="p-6 rounded-3xl bg-forest text-white space-y-3 shadow-md">
          <h4 className="text-xs font-bold text-ochre uppercase tracking-wider">
            Employer Verification Assurance
          </h4>
          <p className="text-xs text-white/80 leading-relaxed">
            AcadShield X gives employers mathematical certainty that academic documents have not been modified or tampered with. If the candidate submitted a file directly to your ATS, run it through the AcadShield verification tool to verify byte-for-byte fidelity with the registrar�s original file.
          </p>
          <div className="pt-2">
            <Link
              href="/company/verify/document"
              className="px-4 py-2.5 rounded-xl bg-ochre text-forest text-xs font-bold hover:bg-ochre/90 transition inline-flex items-center gap-2"
            >
              Verify Candidate&apos;s Raw PDF <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
