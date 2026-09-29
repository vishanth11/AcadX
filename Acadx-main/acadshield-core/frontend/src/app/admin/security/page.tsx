"use client";

import React, { useState } from "react";
import {
  Lock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Users
} from "lucide-react";

export default function AdminSecurityPage() {
  const securityEvents = [
    {
      id: "sec_101",
      timestamp: "2024-09-25 11:22:15 UTC",
      actor: "root@acadshield.network",
      eventType: "SUPERADMIN_MFA_CHALLENGE",
      ipAddress: "198.51.100.4",
      status: "SUCCESS",
      details: "Hardware WebAuthn FIDO2 security key authenticated successfully."
    },
    {
      id: "sec_102",
      timestamp: "2024-09-25 10:45:02 UTC",
      actor: "unauthorized_probe@darknet.io",
      eventType: "BRUTE_FORCE_PREVENTION",
      ipAddress: "203.0.113.19",
      status: "BLOCKED",
      details: "Repeated failed login attempts on /login/admin. IP automatically throttled."
    },
    {
      id: "sec_103",
      timestamp: "2024-09-25 09:12:44 UTC",
      actor: "registrar@harvard.edu",
      eventType: "INSTITUTION_KEY_USAGE",
      ipAddress: "140.247.0.1",
      status: "SUCCESS",
      details: "Ed25519 signing key utilized for batch document fingerprint anchoring."
    },
    {
      id: "sec_104",
      timestamp: "2024-09-25 08:30:19 UTC",
      actor: "security@anthropic.com",
      eventType: "API_KEY_ROTATION",
      ipAddress: "54.210.12.98",
      status: "SUCCESS",
      details: "Corporate production API key rotated. Old key revoked."
    }
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-xs font-semibold text-red-900 mb-2">
          <Lock className="w-3.5 h-3.5 text-red-600" />
          Zero-Trust Security Perimeter
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Security & MFA Event Logs
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Superadmin telemetry monitoring authentication attempts, hardware token MFA verifications, and automated threat mitigation.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">MFA Policy</span>
          <span className="block text-base font-extrabold text-emerald-800 mt-1">Strict Enforced</span>
          <span className="text-[11px] text-emerald-700 font-semibold">WebAuthn / FIDO2</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Suspended IPs</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">2 Nodes</span>
          <span className="text-[11px] text-forest/60">Edge firewall blocked</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Auth Success Rate</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">99.4%</span>
          <span className="text-[11px] text-forest/60">Institutional logins</span>
        </div>
        <div className="bg-white border border-forest/15 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-forest/50">Session Inactivity Limit</span>
          <span className="block text-2xl font-extrabold text-forest mt-1">15 min</span>
          <span className="text-[11px] text-forest/60">Automated lock</span>
        </div>
      </div>

      <div className="bg-white border border-forest/15 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest/5 border-b border-forest/10 font-bold uppercase text-[10px] text-forest/70 tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Principal Identity</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {securityEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-forest/[0.02] transition">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-forest/60 whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-forest">{evt.actor}</td>
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-forest">{evt.eventType}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-forest/70">{evt.ipAddress}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        evt.status === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-forest/80 text-[11px]">{evt.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
