type Role = "ADMIN" | "UNIVERSITY" | "COMPANY" | "STUDENT";

export async function signIn(email: string, password: string, expectedRole: Role): Promise<void> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error === "INVALID_CREDENTIALS" ? "Email or password is incorrect, or the account is not active." : "Sign in is unavailable. Check the API configuration.");
  if (body.user?.role !== expectedRole) {
    await fetch(`${baseUrl}/auth/logout`, { method: "POST", credentials: "include" });
    throw new Error("This account does not have access to this workspace.");
  }
}
