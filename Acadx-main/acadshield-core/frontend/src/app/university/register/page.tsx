"use client";

import React, { useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import {
  Building2,
  ShieldCheck,
  Upload,
  CheckCircle2,
  ArrowRight,
  FileCheck2,
  Clock
} from "lucide-react";

export default function UniversityRegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [legalName, setLegalName] = useState("Stanford University");
  const [displayName, setDisplayName] = useState("Stanford");
  const [domain, setDomain] = useState("stanford.edu");
  const [email, setEmail] = useState("registrar@stanford.edu");
  const [country, setCountry] = useState("United States");
  const [adminName, setAdminName] = useState("Dr. Marcus Chen");
  const [adminEmail, setAdminEmail] = useState("m.chen@stanford.edu");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="UNIVERSITY" />

      {/* Header */}
      <section className="border-b border-forest/10 bg-white/70 backdrop-blur px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-3">
            <Building2 className="w-3.5 h-3.5 text-ochre" />
            Institutional Onboarding • Accreditation Application
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">
            Apply for Higher Ed Issuance Authority
          </h1>
          <p className="mt-1 text-forest/75 text-sm max-w-xl">
            Join the AcadShield X Trust Network as an authorized institutional issuer. Every application undergoes manual accreditation review by platform governance administrators.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 pt-8">
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-forest/10 rounded-2xl p-8 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-forest border-b border-forest/10 pb-3">
                1. Institutional Identity & Accreditation
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Institution Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Official Institutional Domain *
                  </label>
                  <input
                    type="text"
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Registrar Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-forest border-b border-forest/10 pb-3">
                2. Primary Administrator / Signatory
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Administrator Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-forest border-b border-forest/10 pb-3">
                3. Accreditation Documentation Upload
              </h2>
              <div className="mt-4 border-2 border-dashed border-forest/20 rounded-2xl p-6 text-center text-xs bg-forest/5">
                <Upload className="w-8 h-8 text-ochre mx-auto mb-2" />
                <span className="font-bold text-forest block">
                  Upload Ministry / Board Accreditation Certificate
                </span>
                <span className="text-forest/60">PDF, JPG, PNG (Max 25MB)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
              <span className="text-xs text-forest/60">
                Initial status assigned upon submission: <strong>PENDING REVIEW</strong>
              </span>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition shadow flex items-center gap-2"
              >
                Submit Accreditation Application <ArrowRight className="w-4 h-4 text-ochre" />
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white border-2 border-amber-400 rounded-2xl p-8 shadow-md text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Clock className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-black text-forest">
              Application Submitted — Status: PENDING
            </h2>
            <p className="text-xs text-forest/75 max-w-lg mx-auto leading-relaxed">
              Your institutional accreditation application for <strong>{legalName}</strong> has been submitted. Platform administrators will verify domain DNS records, official accreditation credentials, and authorized registrar keys.
            </p>

            <div className="p-4 rounded-xl bg-forest/5 border border-forest/10 max-w-md mx-auto text-left text-xs space-y-1 text-forest/80">
              <div>Institution: {legalName}</div>
              <div>Domain: {domain}</div>
              <div>Status: Awaiting Universal Platform Governance Approval</div>
            </div>

            <div className="pt-4">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition shadow inline-block"
              >
                Return to Login Portal
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
