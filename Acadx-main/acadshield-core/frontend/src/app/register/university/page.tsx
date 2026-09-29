"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, ShieldCheck, Upload, ArrowRight, CheckCircle2, Clock, Lock, Mail, Globe, MapPin, User } from "lucide-react";

export default function UniversityRegistrationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [legalName, setLegalName] = useState("Stanford University");
  const [displayName, setDisplayName] = useState("Stanford");
  const [instType, setInstType] = useState("Research University");
  const [domain, setDomain] = useState("stanford.edu");
  const [email, setEmail] = useState("registrar@stanford.edu");
  const [website, setWebsite] = useState("https://www.stanford.edu");
  const [regNumber, setRegNumber] = useState("REG-CA-77189");
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("California");
  const [city, setCity] = useState("Stanford");
  const [adminName, setAdminName] = useState("Dr. Marcus Chen");
  const [adminEmail, setAdminEmail] = useState("m.chen@stanford.edu");
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
      const response = await fetch(`${apiBase}/institutions/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: legalName, code: regNumber, country, website, adminEmail, initialPassword: password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error === "INSTITUTION_OR_EMAIL_ALREADY_EXISTS" ? "That institution code or administrator email is already registered." : "The application could not be submitted. Check the details and try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Could not reach the registration service. The application was not submitted.");
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
              Institutional Accreditation
            </span>
          </div>
        </Link>
        <Link
          href="/login/university"
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
                <Building2 className="w-3.5 h-3.5 text-ochre" />
                University Accreditation Application
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight headline-shadow font-serif">
                Register Educational Institution
              </h1>
              <p className="text-xs text-forest/70 mt-1">
                Apply to become an authoritative academic document issuer on the AcadShield digital trust network. Initial status will be assigned as PENDING.
              </p>
            </div>

            {/* Section 1: Institution Identity */}
            <div className="space-y-4 pt-4 border-t border-forest/10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-forest/80">
                1. Institution Identity
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                    Institution Type *
                  </label>
                  <select
                    value={instType}
                    onChange={(e) => setInstType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre font-medium"
                  >
                    <option value="Research University">Research University</option>
                    <option value="Collegiate University">Collegiate University</option>
                    <option value="Polytechnic / Institute of Tech">Polytechnic / Institute of Tech</option>
                    <option value="Autonomous College">Autonomous College</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">
                    Accreditation / Registration No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
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
                    placeholder="university.edu"
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
                    placeholder="registrar@university.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Jurisdiction */}
            <div className="space-y-4 pt-4 border-t border-forest/10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-forest/80">
                2. Location & Jurisdiction
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

            {/* Section 3: Primary Registrar Administrator */}
            <div className="space-y-4 pt-4 border-t border-forest/10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-forest/80">
                3. Lead Registrar Administrator & Security
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                    Official Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest focus:outline-none focus:ring-2 focus:ring-ochre"
                  />
                </div>
                <div>
                  <label className="block font-bold text-forest mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 16 characters"
                    minLength={16}
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

            {/* Section 4: Document Upload */}
            <div className="space-y-4 pt-4 border-t border-forest/10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-forest/80">
                4. Accreditation Proof Document
              </h2>
              <label className="border-2 border-dashed border-forest/20 hover:border-ochre transition rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-forest/5">
                <Upload className="w-8 h-8 text-ochre mb-2" />
                <span className="text-xs font-bold text-forest">
                  Upload Ministry/Board Accreditation Certificate (PDF or JPG)
                </span>
                <span className="text-[11px] text-forest/60 mt-1">
                  Official registrar attestation, gazette notification, or charter document
                </span>
              </label>
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
                  I accept the AcadShield X Trust Network Institutional Terms of Governance.
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
              <span className="text-xs text-forest/60">
                Assigned initial state: <strong className="text-amber-800">PENDING</strong>
              </span>
              {error && <p role="alert" className="max-w-xs text-xs font-semibold text-red-800">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <span>{submitting ? "Submitting…" : "Submit Institutional Application"}</span>
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
              Your institutional accreditation application for <strong>{legalName}</strong> has been received with status <strong>PENDING</strong>. Universal platform administrators will verify institutional accreditation, registrar identity, and domain ownership.
            </p>

            <div className="p-4 rounded-xl bg-forest/5 border border-forest/10 max-w-md mx-auto text-left text-xs font-mono space-y-1 text-forest/80">
              <div>Institution: {legalName}</div>
              <div>Domain: {domain}</div>
              <div>Registrar: {adminName}</div>
              <div className="text-amber-800 font-bold">Review Queue: Priority Tier 1</div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Link
                href="/login/university"
                className="px-5 py-2.5 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest/90 transition shadow inline-block"
              >
                Return to University Sign In
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-forest/50">
        AcadShield X Digital Trust Infrastructure • Institutional Accreditation Protocol
      </div>
    </div>
  );
}
