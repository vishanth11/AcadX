"use client";

import React from "react";
import Link from "next/link";
import { Building2, Briefcase, ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginRoleSelectionPage() {
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
              Digital Trust Infrastructure
            </span>
          </div>
        </Link>
        <div className="text-xs font-semibold text-forest/60">
          Role-Based Access Control
        </div>
      </div>

      {/* Main Role Selection Area */}
      <div className="max-w-4xl mx-auto w-full my-12 text-center space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold uppercase tracking-wider text-forest/80">
            <ShieldCheck className="w-3.5 h-3.5 text-ochre" />
            Sign In to AcadShield X
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight headline-shadow font-serif">
            Select Your Role
          </h1>
          <p className="text-sm text-forest/75 max-w-xl mx-auto leading-relaxed">
            Verify identities, credentials, and professional records through trusted digital infrastructure. Choose your institutional role to continue.
          </p>
        </div>

        <Link href="/login/student" className="inline-block rounded border border-forest/20 px-6 py-3 font-bold">Student sign in</Link>
        {/* Organization role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Card 1: University */}
          <div className="bg-white border-2 border-forest/15 hover:border-forest/40 rounded-3xl p-7 shadow-lg flex flex-col justify-between transition hover:-translate-y-1">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mb-5">
                <Building2 className="w-7 h-7 text-ochre" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-ochre block mb-1">
                Source of Authority
              </span>
              <h2 className="text-xl font-black text-forest">UNIVERSITY</h2>
              <p className="text-xs text-forest/70 mt-2 leading-relaxed">
                Issue and manage academic credentials.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-forest/10">
              <Link
                href="/login/university"
                className="w-full py-3 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2"
              >
                <span>University Login</span>
                <ArrowRight className="w-4 h-4 text-ochre" />
              </Link>
            </div>
          </div>

          {/* Card 2: Company */}
          <div className="bg-white border-2 border-forest/15 hover:border-forest/40 rounded-3xl p-7 shadow-lg flex flex-col justify-between transition hover:-translate-y-1">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest flex items-center justify-center mb-5">
                <Briefcase className="w-7 h-7 text-ochre" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-ochre block mb-1">
                Independent Verifier
              </span>
              <h2 className="text-xl font-black text-forest">COMPANY</h2>
              <p className="text-xs text-forest/70 mt-2 leading-relaxed">
                Verify candidate and employee credentials.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-forest/10">
              <Link
                href="/login/company"
                className="w-full py-3 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2"
              >
                <span>Company Login</span>
                <ArrowRight className="w-4 h-4 text-ochre" />
              </Link>
            </div>
          </div>

          {/* Card 3: Admin */}
          <div className="bg-white border-2 border-red-900/15 hover:border-red-900/40 rounded-3xl p-7 shadow-lg flex flex-col justify-between transition hover:-translate-y-1">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mb-5">
                <ShieldAlert className="w-7 h-7 text-red-600" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-red-700 block mb-1">
                Universal Governance
              </span>
              <h2 className="text-xl font-black text-forest">ADMIN</h2>
              <p className="text-xs text-forest/70 mt-2 leading-relaxed">
                Manage and audit the entire AcadShield network.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-forest/10">
              <Link
                href="/login/admin"
                className="w-full py-3 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2"
              >
                <span>Admin Login</span>
                <ArrowRight className="w-4 h-4 text-ochre" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-forest/50">
        AcadShield X Digital Trust Infrastructure • Decentralized Academic & Professional Ledger
      </div>
    </div>
  );
}
