"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { signIn } from "@/lib/auth";

export default function UniversityLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signIn(email, password, "UNIVERSITY");
      router.push("/university");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed.");
    } finally {
      setIsLoading(false);
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
              Institutional Authority
            </span>
          </div>
        </Link>
        <Link
          href="/login"
          className="text-xs font-bold text-forest/70 hover:text-forest transition flex items-center gap-1.5"
        >
          Change Role
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-8">
        <div className="bg-white border-2 border-forest/15 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold text-forest">
              <Building2 className="w-3.5 h-3.5 text-ochre" />
              Source of Authority Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight headline-shadow font-serif">
              University Sign In
            </h1>
            <p className="text-xs text-forest/75 leading-relaxed">
              Issue, verify and manage trusted academic credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs" suppressHydrationWarning>
            <div>
              <label className="block font-bold text-forest mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  suppressHydrationWarning
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="registrar@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ochre"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-forest">Password</label>
                <span className="text-[11px] text-forest/50">Contact your platform administrator to reset access.</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  suppressHydrationWarning
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-forest/20 bg-forest/5 text-forest text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ochre"
                />
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="pt-1 text-[11px] text-forest/50">This secure session expires after 15 minutes.</p>

            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              suppressHydrationWarning
              className="w-full py-3 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold shadow-md transition flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <span>Authenticating with Registrar Node...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-ochre" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-forest/10 text-center text-xs">
            <span className="text-forest/60">New institution? </span>
            <Link
              href="/register/university"
              className="font-bold text-ochre hover:underline"
            >
              Register Institution
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto text-center text-[11px] text-forest/50">
        AcadShield X Digital Trust Infrastructure • University Authority Layer
      </div>
    </div>
  );
}
