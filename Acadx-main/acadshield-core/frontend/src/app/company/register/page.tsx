"use client";

import React, { useState } from "react";
import Link from "next/link";
import EnterpriseNavbar from "@/components/EnterpriseNavbar";
import {
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  Building2
} from "lucide-react";

export default function CompanyRegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [legalName, setLegalName] = useState("OpenAI LLC");
  const [displayName, setDisplayName] = useState("OpenAI");
  const [domain, setDomain] = useState("openai.com");
  const [email, setEmail] = useState("talent@openai.com");
  const [industry, setIndustry] = useState("Artificial Intelligence Research");
  const [adminName, setAdminName] = useState("Sarah Lin");
  const [adminEmail, setAdminEmail] = useState("slin@openai.com");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-canvas-texture text-forest pb-24">
      <EnterpriseNavbar activeRole="COMPANY" />

      {/* Header */}
      <section className="border-b border-forest/10 bg-white/70 backdrop-blur px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80 mb-3">
            <Briefcase className="w-3.5 h-3.5 text-ochre" />
            Corporate Verifier Onboarding
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight headline-shadow font-serif">
            Register as an Enterprise Verifier
          </h1>
          <p className="mt-1 text-forest/75 text-sm max-w-xl">
            Integrate AcadShield X cryptographic verification into your talent acquisition, background check, and professional credential workflows.
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
                1. Corporate Identity
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Company Legal Name *
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
                    Corporate Domain *
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
                    Industry Sector *
                  </label>
                  <input
                    type="text"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-forest border-b border-forest/10 pb-3">
                2. Verifier Administrator
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
                    Corporate Email *
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

            <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
              <span className="text-xs text-forest/60">
                Initial status: <strong>PENDING VERIFICATION</strong>
              </span>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition shadow flex items-center gap-2"
              >
                Submit Verifier Application <ArrowRight className="w-4 h-4 text-ochre" />
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white border-2 border-amber-400 rounded-2xl p-8 shadow-md text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Clock className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-black text-forest">
              Corporate Registration Received — Status: PENDING
            </h2>
            <p className="text-xs text-forest/75 max-w-lg mx-auto leading-relaxed">
              Your company account for <strong>{legalName}</strong> is pending platform verification. Once approved, your team will gain access to candidate hash verification, ATS API keys, and verified compliance reports.
            </p>

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
