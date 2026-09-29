"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Building2, Briefcase, KeyRound, ChevronDown, Check, LogOut, ArrowRight, User } from "lucide-react";
import type { UserRole } from "../lib/roles";

export default function EnterpriseNavbar({ activeRole }: { activeRole?: UserRole } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>(activeRole ?? "UNIVERSITY");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync role based on path
  useEffect(() => {
    if (activeRole) setCurrentRole(activeRole);
    else if (pathname.startsWith("/admin")) setCurrentRole("ADMIN");
    else if (pathname.startsWith("/company")) setCurrentRole("COMPANY");
    else if (pathname.startsWith("/university")) setCurrentRole("UNIVERSITY");
    else if (pathname.startsWith("/student")) setCurrentRole("STUDENT");
  }, [pathname, activeRole]);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setIsDropdownOpen(false);
    if (role === "ADMIN") router.push("/admin");
    else if (role === "COMPANY") router.push("/company");
    else if (role === "UNIVERSITY") router.push("/university");
    else if (role === "STUDENT") router.push("/student/passport");
    else router.push("/");
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case "ADMIN":
        return {
          title: "ADMIN · UNIVERSAL GOVERNANCE",
          sub: "Platform Access",
          bg: "bg-[#7A1C1C] text-[#FAF7F2]",
          border: "border-[#7A1C1C]",
          icon: <KeyRound className="w-3.5 h-3.5" />
        };
      case "COMPANY":
        return {
          title: "COMPANY · VERIFIER",
          sub: "Company workspace",
          bg: "bg-[#0B251D] text-[#E5B25D]",
          border: "border-[#E5B25D]/40",
          icon: <Briefcase className="w-3.5 h-3.5 text-[#E5B25D]" />
        };
      case "STUDENT":
        return {
          title: "STUDENT · CREDENTIAL HOLDER",
          sub: "Student workspace",
          bg: "bg-[#0B251D] text-[#FAF7F2]",
          border: "border-[#0B251D]",
          icon: <User className="w-3.5 h-3.5 text-[#E5B25D]" />
        };
      case "UNIVERSITY":
      default:
        return {
          title: "UNIVERSITY · ISSUER AUTHORITY",
          sub: "University workspace",
          bg: "bg-[#0B251D] text-[#FAF7F2]",
          border: "border-[#0B251D]",
          icon: <Building2 className="w-3.5 h-3.5 text-[#E5B25D]" />
        };
    }
  };

  const badge = getRoleBadge();

  return (
    <header className="w-full bg-[#FAF7F2] border-b-2 border-[#0B251D]/15 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-[#0B251D]">
              ACADSHIELD<span className="text-[#E5B25D] text-2xl font-serif">.X</span>
            </span>
          </Link>

          {/* Context Links based on role */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold uppercase tracking-wider text-[#0B251D]/75 font-mono">
            {currentRole === "UNIVERSITY" && (
              <>
                <Link href="/university" className={`hover:text-[#0B251D] ${pathname === "/university" ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Overview
                </Link>
                <Link href="/university/students" className={`hover:text-[#0B251D] ${pathname.startsWith("/university/students") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Students
                </Link>
                <Link href="/university/documents" className={`hover:text-[#0B251D] ${pathname.startsWith("/university/documents") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Documents
                </Link>
                <Link href="/university/documents/upload" className="text-[#C88A32] font-bold hover:underline">
                  + Upload Document
                </Link>
                <Link href="/university/templates" className={`hover:text-[#0B251D] ${pathname.startsWith("/university/templates") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Templates
                </Link>
                <Link href="/university/credentials" className={`hover:text-[#0B251D] ${pathname.startsWith("/university/credentials") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Credentials
                </Link>
                <Link href="/university/audit" className="hover:text-[#0B251D]">
                  Audit
                </Link>
              </>
            )}

            {currentRole === "COMPANY" && (
              <>
                <Link href="/company" className={`hover:text-[#0B251D] ${pathname === "/company" ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Overview
                </Link>
                <Link href="/company/candidates" className={`hover:text-[#0B251D] ${pathname.startsWith("/company/candidates") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Candidates
                </Link>
                <Link href="/company/verify/document" className="text-[#C88A32] font-bold hover:underline flex items-center gap-1">
                  <span>⚡ Hash Verification</span>
                </Link>
                <Link href="/company/verifications" className={`hover:text-[#0B251D] ${pathname.startsWith("/company/verifications") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  History
                </Link>
              </>
            )}

            {currentRole === "ADMIN" && (
              <>
                <Link href="/admin" className={`hover:text-[#0B251D] ${pathname === "/admin" ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Universal Overview
                </Link>
                <Link href="/admin/universities" className={`hover:text-[#0B251D] ${pathname.startsWith("/admin/universities") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Universities
                </Link>
                <Link href="/admin/companies" className={`hover:text-[#0B251D] ${pathname.startsWith("/admin/companies") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Companies
                </Link>
                <Link href="/admin/documents" className={`hover:text-[#0B251D] ${pathname.startsWith("/admin/documents") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  All Documents
                </Link>
                <Link href="/admin/audit" className={`hover:text-[#0B251D] ${pathname.startsWith("/admin/audit") ? "text-[#0B251D] font-bold border-b border-[#0B251D]" : ""}`}>
                  Global Audit
                </Link>
              </>
            )}

            {currentRole === "STUDENT" && (
              <>
                <Link href="/student/passport" className="text-[#0B251D] font-bold border-b border-[#0B251D]">
                  My Trust Passport
                </Link>
                <Link href="/" className="hover:text-[#0B251D]">
                  Public Portal
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Corner: Quick Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all shadow-sm ${badge.bg} ${badge.border}`}
          >
            {badge.icon}
            <div className="text-left hidden sm:block">
              <div className="leading-tight text-[11px]">{badge.title}</div>
              <div className="text-[9px] opacity-75 font-normal">{badge.sub}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#FAF7F2] border-2 border-[#0B251D] rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn text-[#0B251D]">
              <div className="px-3 py-2 border-b border-[#0B251D]/15 text-[11px] font-mono uppercase tracking-wider text-[#0B251D]/60 font-bold">
                SWITCH ACTOR CONTEXT
              </div>

              <div className="mt-1 space-y-1">
                <button
                  onClick={() => switchRole("UNIVERSITY")}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-[#0B251D]/5 transition-colors ${currentRole === "UNIVERSITY" ? "bg-white font-bold border border-[#0B251D]/20 shadow-xs" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#C88A32]" />
                    <div>
                      <div className="font-bold">University</div>
                      <div className="text-[10px] text-[#0B251D]/60 font-normal">Authoritative Source of Documents</div>
                    </div>
                  </div>
                  {currentRole === "UNIVERSITY" && <Check className="w-4 h-4 text-[#0B251D]" />}
                </button>

                <button
                  onClick={() => switchRole("COMPANY")}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-[#0B251D]/5 transition-colors ${currentRole === "COMPANY" ? "bg-white font-bold border border-[#0B251D]/20 shadow-xs" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-[#C88A32]" />
                    <div>
                      <div className="font-bold">Company</div>
                      <div className="text-[10px] text-[#0B251D]/60 font-normal">Independent Verifier & Hash Matcher</div>
                    </div>
                  </div>
                  {currentRole === "COMPANY" && <Check className="w-4 h-4 text-[#0B251D]" />}
                </button>

                <button
                  onClick={() => switchRole("ADMIN")}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-[#0B251D]/5 transition-colors ${currentRole === "ADMIN" ? "bg-white font-bold border border-[#0B251D]/20 shadow-xs" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-[#7A1C1C]" />
                    <div>
                      <div className="font-bold text-[#7A1C1C]">Admin Console</div>
                      <div className="text-[10px] text-[#0B251D]/60 font-normal">Universal Governance & Audit</div>
                    </div>
                  </div>
                  {currentRole === "ADMIN" && <Check className="w-4 h-4 text-[#0B251D]" />}
                </button>

                <button
                  onClick={() => switchRole("STUDENT")}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-[#0B251D]/5 transition-colors ${currentRole === "STUDENT" ? "bg-white font-bold border border-[#0B251D]/20 shadow-xs" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#0B251D]" />
                    <div>
                      <div className="font-bold">Student Passport</div>
                      <div className="text-[10px] text-[#0B251D]/60 font-normal">Student credentials & sharing</div>
                    </div>
                  </div>
                  {currentRole === "STUDENT" && <Check className="w-4 h-4 text-[#0B251D]" />}
                </button>
              </div>

              <div className="mt-2 pt-2 border-t border-[#0B251D]/15 flex justify-between items-center px-2">
                <Link href="/login" onClick={() => setIsDropdownOpen(false)} className="text-[11px] font-mono text-[#0B251D]/70 hover:text-[#0B251D] flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Full Login Screen
                </Link>
                <Link href="/" onClick={() => setIsDropdownOpen(false)} className="text-[11px] font-mono text-[#C88A32] font-semibold hover:underline">
                  Public Landing
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
