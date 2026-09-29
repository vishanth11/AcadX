"use client";

import { usePathname } from "next/navigation";

const exactDemoRoutes = new Set([
  "/admin/analytics", "/admin/credentials", "/admin/documents", "/admin/employees", "/admin/hashes", "/admin/issuers", "/admin/nfts", "/admin/security", "/admin/students", "/admin/verifications",
  "/company/api", "/company/usage",
  "/university/analytics", "/university/audit", "/university/blockchain", "/university/nfts", "/university/students",
  "/student", "/student/credentials", "/student/documents", "/student/identity", "/student/passport", "/student/share",
  "/register/company", "/register/university", "/company/register", "/university/register",
]);

function usesDemoData(path: string): boolean {
  if (exactDemoRoutes.has(path) || path.startsWith("/p/")) return true;
  if (/^\/admin\/(students|credentials|documents|verifications|employees)\//.test(path)) return true;
  if (/^\/student\/(credentials|documents|identity|passport|share)(\/|$)/.test(path)) return true;
  if (/^\/university\/students(\/|$)/.test(path)) return true;
  if (/^\/university\/credentials\//.test(path) && path !== "/university/credentials/create") return true;
  if (/^\/university\/documents\//.test(path) && !path.startsWith("/university/documents/upload")) return true;
  return false;
}

export default function DemoDataBanner() {
  const pathname = usePathname() || "/";
  if (!usesDemoData(pathname)) return null;
  return <div role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-950">DEMO DATA — This screen is not connected to the ACADSHIELD registry and must not be used for credential, issuer, or accreditation decisions.</div>;
}
