"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Briefcase, ShieldCheck, ArrowRight, CheckCircle2, Clock, Lock, Mail, Globe, MapPin, User, Building } from "lucide-react";

export default function CompanyRegistrationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [legalName, setLegalName] = useState("OpenAI LLC");
  const [displayName, setDisplayName] = useState("OpenAI");
  const [domain, setDomain] = useState("openai.com");
  const [email, setEmail] = useState("talent@openai.com");
  const [website, setWebsite] = useState("https://openai.com");
  const [industry, setIndustry] = useState("Artificial Intelligence Research");
  const [companyId, setCompanyId] = useState("CORP-US-DE-9941");
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("California");
  const [city, setCity] = useState("San Francisco");
  const [adminName, setAdminName] = useState("Sarah Lin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/companies/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: legalName,
          domain,
          administratorEmail: email,
          initialPassword: password,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error === "COMPANY_OR_EMAIL_ALREADY_EXISTS" ? "That company or administrator email is already registered." : "The registration request could not be submitted. Check the details and try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Could not reach the registration service. The company request was not submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-texture text-forest flex flex-col justify-between p-6 sm:p-12">
      {/* Brand Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-forest text-ochre flex items-center justify-center font-bold text-lg border border-ochre/30 shadow">
            AX
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-forest block leading-none">
              ACADSHIELD X
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-forest/60">
              Corporate Verifier Network
            </span>
          </div>
        </Link>
        <Link
          href="/login/company"
          className="text-xs font-bold text-forest/70 hover:text-forest transition flex items-center gap-1.5"
        >
          Already Registered? Sign In
        </Link>
      </div>

      <div className="max-w-3xl mx-auto w-full my-8">
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white border-2 border-forest/15 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold text-forest mb-2">
                <Briefcase className="w-3.5 h-3.5 text-ochre" />
                Enterprise Verifier Onboarding
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight headline-shadow font-serif">
                Register as Corporate Verifier
              </h1>
              <p className="text-xs text-forest/70 mt-1">
                Gain access to candidate document fingerprint verification, ATS API integrations, and tamper-resistant audit reports. Initial status will be assigned as PENDING.
              </p>
            </div>

            {/* Section 1: Company Profile */}
            <div className="space-y-4 pt-4 border-t border-forest/10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-forest/80">
                1. Corporate Profile
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Legal Company Name *
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
                    placeholder="company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Corporate Talent Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="talent@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">Industry Sector *</label>
                  <input
                    type="text"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Company Registration / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Headquarters */}
            <div className="space-y-4 pt-4 border-t border-forest/10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-forest/80">
                2. Corporate Headquarters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-forest mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">State / Province *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Verifier Administrator */}
            <div className="space-y-4 pt-4 border-t border-forest/10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-forest/80">
                3. Lead Administrator & Security
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
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
                  <label className="block font-bold text-forest mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 12 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-forest rounded focus:ring-ochre"
                />
                <span className="text-forest/80">
                  I accept the AcadShield X Corporate Verifier Agreement & Data Privacy Terms.
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
              <span className="text-xs text-forest/60">
                Assigned initial status: <strong className="text-amber-800">PENDING</strong>
              </span>
              {error && <p role="alert" className="max-w-xs text-xs font-semibold text-red-800">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <span>{submitting ? "Submitting…" : "Submit Verifier Application"}</span>
                <ArrowRight className="w-4 h-4 text-ochre" />
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white border-2 border-amber-400 rounded-3xl p-10 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Clock className="w-9 h-9" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-forest">
              Application Submitted — Status: PENDING
            </h2>
            <p className="text-xs text-forest/75 max-w-lg mx-auto leading-relaxed">
              Your corporate verifier account for <strong>{legalName}</strong> has been registered with status <strong>PENDING</strong>. Universal platform administrators will verify domain DNS, corporate registration, and compliance adherence before enabling live verifications.
            </p>

            <div className="p-4 rounded-xl bg-forest/5 border border-forest/10 max-w-md mx-auto text-left text-xs font-mono space-y-1 text-forest/80">
              <div>Company: {legalName}</div>
              <div>Domain: {domain}</div>
              <div>Administrator: {adminName}</div>
              <div className="text-amber-800 font-bold">API Access: Sandboxed until approval</div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Link
                href="/login/company"
                className="px-5 py-2.5 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition shadow inline-block"
              >
                Return to Company Sign In
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-forest/50">
        AcadShield X Digital Trust Infrastructure • Corporate Verifier Network
      </div>
    </div>
  );
}
