import { NextRequest, NextResponse } from "next/server";

const protectedRoleByPath: Record<string, string> = {
  admin: "ADMIN",
  university: "UNIVERSITY",
  company: "COMPANY",
  student: "STUDENT",
};

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function validSession(token: string | undefined, secret: string | undefined, expectedRole: string): Promise<boolean> {
  if (!token || !secret || secret.length < 32) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
    if (header.alg !== "HS256" || payload.iss !== "acadshield-core" || payload.role !== expectedRole || typeof payload.exp !== "number" || payload.exp <= Date.now() / 1000) return false;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const signature = decodeBase64Url(parts[2]);
    const signatureBuffer = signature.buffer.slice(signature.byteOffset, signature.byteOffset + signature.byteLength) as ArrayBuffer;
    return crypto.subtle.verify("HMAC", key, signatureBuffer, new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const segment = request.nextUrl.pathname.split("/")[1];
  const role = protectedRoleByPath[segment];
  if (!role) return NextResponse.next();
  const token = request.cookies.get("acadshield_session")?.value;
  if (await validSession(token, process.env.JWT_SECRET, role)) return NextResponse.next();
  const loginPath = `/login/${segment}`;
  const destination = new URL(loginPath, request.url);
  destination.searchParams.set("returnTo", request.nextUrl.pathname);
  const response = NextResponse.redirect(destination);
  response.cookies.delete("acadshield_session");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/university/:path*", "/company/:path*", "/student/:path*"],
};
