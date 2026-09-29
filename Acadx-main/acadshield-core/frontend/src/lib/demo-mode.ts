export const demoEnabled = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";
export function requireDemoMode() {
  if (!demoEnabled) throw new Error("Demo fixtures are disabled outside explicitly enabled development.");
}
