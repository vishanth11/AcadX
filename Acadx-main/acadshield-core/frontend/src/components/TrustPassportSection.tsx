"use client";

import React, { useState } from "react";
import { Check, Shield, Award, BookOpen, Briefcase, Sparkles, ExternalLink } from "lucide-react";

export default function TrustPassportSection({ onVerifySample }: { onVerifySample: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<"education" | "certifications" | "skills" | "internships">("education");

  return (
    <section id="passport" className="py-20 border-t border-[#0B251D]/15">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] font-mono text-[#C88A32] font-semibold">
              <span className="w-8 h-[1.5px] bg-[#C88A32]" />
              ACADSHIELD TRUST PASSPORT
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0B251D] mt-2 headline-shadow-sm">
              One verified profile. Infinite opportunities.
            </h2>
          </div>
          <p className="max-w-md text-sm text-[#0B251D]/75 leading-relaxed">
            Consolidated candidate claims with explicit cryptographic provenance. We strictly differentiate cryptographically verified achievements from self-reported claims.
          </p>
        </div>

        {/* Passport Card Frame */}
        <div className="bg-[#FAF7F2] border-2 border-[#0B251D] rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          
          {/* Candidate Profile Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 border-b border-[#0B251D]/15 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0B251D] text-[#E5B25D] flex items-center justify-center font-black text-2xl shadow-md border-2 border-[#E5B25D]/40">
                AV
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-[#0B251D]">Alex Vance</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#0B251D] text-[#E5B25D] px-2.5 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> DID VERIFIED
                  </span>
                </div>
                <div className="text-xs font-mono text-[#0B251D]/60 mt-1">
                  did:acadshield:student:stu_2026_0981 · MIT Alum #2026
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] font-mono text-[#0B251D]/60">TRUST PASSPORT ID</div>
                <div className="text-xs font-bold font-mono text-[#0B251D]">PASS-2026-9812-V</div>
              </div>
              <button 
                onClick={() => onVerifySample("cred_valid_degree_001")}
                className="px-4 py-2 bg-[#0B251D] text-[#FAF7F2] hover:bg-[#0B251D]/90 rounded-lg text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-all"
              >
                Inspect Proofs
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 mt-6 overflow-x-auto pb-2 border-b border-[#0B251D]/10">
            <button
              onClick={() => setActiveTab("education")}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
                activeTab === "education"
                  ? "bg-[#0B251D] text-[#E5B25D] shadow-sm"
                  : "text-[#0B251D]/70 hover:bg-[#0B251D]/5"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Education (2)
            </button>

            <button
              onClick={() => setActiveTab("certifications")}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
                activeTab === "certifications"
                  ? "bg-[#0B251D] text-[#E5B25D] shadow-sm"
                  : "text-[#0B251D]/70 hover:bg-[#0B251D]/5"
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Certifications (3)
            </button>

            <button
              onClick={() => setActiveTab("skills")}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
                activeTab === "skills"
                  ? "bg-[#0B251D] text-[#E5B25D] shadow-sm"
                  : "text-[#0B251D]/70 hover:bg-[#0B251D]/5"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Skills & Competencies (8)
            </button>

            <button
              onClick={() => setActiveTab("internships")}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
                activeTab === "internships"
                  ? "bg-[#0B251D] text-[#E5B25D] shadow-sm"
                  : "text-[#0B251D]/70 hover:bg-[#0B251D]/5"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Experience (1)
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="mt-8 space-y-4">
            {activeTab === "education" && (
              <>
                <div className="p-5 rounded-2xl bg-white border border-[#0B251D]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#0B251D] text-[#E5B25D] px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> VERIFIED CLAIM
                      </span>
                      <span className="text-xs font-mono text-[#0B251D]/50">Source: AcadShield Core</span>
                    </div>
                    <h4 className="text-lg font-bold text-[#0B251D]">Bachelor of Science in Computer Science</h4>
                    <div className="text-xs text-[#0B251D]/70 font-medium">Massachusetts Institute of Technology · GPA 3.96 / 4.00</div>
                  </div>
                  <button
                    onClick={() => onVerifySample("cred_valid_degree_001")}
                    className="px-3.5 py-1.5 border border-[#0B251D]/30 hover:border-[#0B251D] rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    View Proof <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#0B251D]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#0B251D] text-[#E5B25D] px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> VERIFIED CLAIM
                      </span>
                      <span className="text-xs font-mono text-[#0B251D]/50">Source: AcadShield Core</span>
                    </div>
                    <h4 className="text-lg font-bold text-[#0B251D]">Minor in Distributed Systems & Cryptography</h4>
                    <div className="text-xs text-[#0B251D]/70 font-medium">Massachusetts Institute of Technology · Conferred 2026</div>
                  </div>
                  <button
                    onClick={() => onVerifySample("cred_valid_degree_001")}
                    className="px-3.5 py-1.5 border border-[#0B251D]/30 hover:border-[#0B251D] rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    View Proof <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}

            {activeTab === "certifications" && (
              <>
                <div className="p-5 rounded-2xl bg-white border border-[#0B251D]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#0B251D] text-[#E5B25D] px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> VERIFIED CLAIM
                      </span>
                      <span className="text-xs font-mono text-[#0B251D]/50">Global Cloud Institute</span>
                    </div>
                    <h4 className="text-lg font-bold text-[#0B251D]">Certified Kubernetes Security Specialist (CKS)</h4>
                    <div className="text-xs text-[#0B251D]/70 font-medium">Valid through Dec 2027 · Token #4092</div>
                  </div>
                  <button
                    onClick={() => onVerifySample("cred_valid_degree_001")}
                    className="px-3.5 py-1.5 border border-[#0B251D]/30 hover:border-[#0B251D] rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    View Proof <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#0B251D]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#C88A32]/15 text-[#C88A32] px-2.5 py-0.5 rounded-full">
                        SELF-REPORTED
                      </span>
                      <span className="text-xs font-mono text-[#0B251D]/50">Unverified by institution</span>
                    </div>
                    <h4 className="text-lg font-bold text-[#0B251D]">Advanced Solidity Smart Contract Security</h4>
                    <div className="text-xs text-[#0B251D]/70 font-medium">Self-study certificate uploaded by candidate</div>
                  </div>
                  <span className="text-xs font-mono text-[#0B251D]/40">Unverified</span>
                </div>
              </>
            )}

            {activeTab === "skills" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: "Distributed Systems", type: "VERIFIED" },
                  { name: "EVM & Solidity", type: "VERIFIED" },
                  { name: "Cryptographic Hashing", type: "VERIFIED" },
                  { name: "Zero-Knowledge Proofs", type: "AI-DERIVED" },
                  { name: "TypeScript & Node.js", type: "VERIFIED" },
                  { name: "Containerization (Docker)", type: "SELF-REPORTED" },
                  { name: "PostgreSQL & Prisma", type: "VERIFIED" },
                  { name: "System Architecture", type: "AI-DERIVED" },
                ].map((skill, idx) => (
                  <div key={idx} className="p-3.5 bg-white rounded-xl border border-[#0B251D]/10">
                    <div className="font-bold text-sm text-[#0B251D]">{skill.name}</div>
                    <div className={`text-[10px] font-mono mt-1 font-semibold uppercase tracking-wider ${
                      skill.type === "VERIFIED" 
                        ? "text-[#0B251D]" 
                        : skill.type === "AI-DERIVED"
                        ? "text-[#C88A32]"
                        : "text-[#0B251D]/50"
                    }`}>
                      {skill.type === "VERIFIED" && "✓ "}
                      {skill.type}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "internships" && (
              <div className="p-5 rounded-2xl bg-white border border-[#0B251D]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#0B251D] text-[#E5B25D] px-2.5 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> VERIFIED INTERNSHIP
                    </span>
                    <span className="text-xs font-mono text-[#0B251D]/50">Polygon Labs Core Team</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#0B251D]">Research Engineer Intern — Digital Trust Infrastructure</h4>
                  <div className="text-xs text-[#0B251D]/70 font-medium">Summer 2025 · Verified by Polygon Labs DID</div>
                </div>
                <button
                  onClick={() => onVerifySample("cred_valid_degree_001")}
                  className="px-3.5 py-1.5 border border-[#0B251D]/30 hover:border-[#0B251D] rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
                >
                  View Proof <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
