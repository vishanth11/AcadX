"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  FileCheck2,
  Award,
  Share2,
  User,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ShieldCheck
} from "lucide-react";

export default function StudentAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Trust Passport", href: "/student/passport", icon: GraduationCap },
    { label: "Document Wallet", href: "/student/documents", icon: FileCheck2 },
    { label: "Credentials & NFTs", href: "/student/credentials", icon: Award },
    { label: "Identity & DID", href: "/student/identity", icon: User },
    { label: "Selective Sharing", href: "/student/share", icon: Share2 },
  ];

  return (
    <div className="min-h-screen bg-canvas-texture text-forest flex flex-col">
      {/* Top Header */}
      <header className="border-b border-forest/15 bg-white/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-forest/5 hover:bg-forest/10 text-forest"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/student/passport" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest text-ochre flex items-center justify-center font-bold text-base border border-ochre/30 shadow">
              AX
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-forest block leading-none">
                ACADSHIELD X
              </span>
              <span className="text-[9px] uppercase font-mono tracking-widest text-forest/60">
                Student Credential Wallet
              </span>
            </div>
          </Link>
        </div>

        {/* Student Info & User Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-[11px] font-bold text-forest">
            <ShieldCheck className="w-3.5 h-3.5 text-ochre" />
            Student workspace
          </div>
          <div className="hidden md:block text-right">
            <div className="text-xs font-bold text-forest">Student account</div>
            <div className="text-[10px] text-forest/50 font-mono">Identity enrollment unavailable</div>
          </div>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-xl border border-forest/20 hover:bg-forest/5 text-forest text-xs font-bold transition flex items-center gap-1.5"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 text-ochre" />
            <span className="hidden sm:inline">Sign Out</span>
          </Link>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-forest/15 bg-white/60 backdrop-blur p-4 hidden lg:flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-forest/50 font-bold px-3 block mb-2">
                Student Credential Hub
              </span>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-forest text-white shadow-sm font-bold"
                          : "text-forest/80 hover:bg-forest/5 hover:text-forest"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-ochre" : "text-forest/60"}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-ochre" />}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/10 space-y-1.5 text-[11px]">
            <span className="font-bold text-forest block">Self-Sovereign Privacy:</span>
            <p className="text-forest/70 leading-snug">
              You own your credentials. Only share what you explicitly approve with employers.
            </p>
          </div>
        </aside>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex">
            <div className="w-72 bg-white h-full p-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-forest/10">
                  <span className="font-extrabold text-sm text-forest">Student Menu</span>
                  <button onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-forest" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium ${
                          isActive ? "bg-forest text-white font-bold" : "text-forest hover:bg-forest/5"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <Link
                href="/login"
                className="w-full py-2.5 text-center rounded-xl bg-forest text-white text-xs font-bold"
              >
                Sign Out
              </Link>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
