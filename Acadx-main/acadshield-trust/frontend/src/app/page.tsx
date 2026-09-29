export const dynamic = "force-dynamic";

type Probe = { status?: string; database?: string; ocr?: string; service?: string };

async function probe(path: string): Promise<Probe | null> {
  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");
  try {
    const response = await fetch(`${api}${path}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    if (!response.ok) return null;
    return await response.json() as Probe;
  } catch {
    return null;
  }
}

export default async function TrustHomePage() {
  const [api, database] = await Promise.all([probe("/health"), probe("/ready")]);
  return <main className="shell">
    <p className="eyebrow">ACADSHIELD · Trust services</p>
    <h1>Employer verification services</h1>
    <p className="intro">This workspace currently exposes the Trust verification API and document evidence service. Candidate passports and relationship graphs are not connected to consented registry data and are not presented here.</p>
    <section className="panel" aria-label="Live service status">
      <strong>Live service status</strong>
      <div className="checks">
        <div className="check"><div className="label">Trust API</div><div className="value">{api?.status || "UNAVAILABLE"}</div></div>
        <div className="check"><div className="label">Database</div><div className="value">{database?.database || "UNAVAILABLE"}</div></div>
      </div>
    </section>
    <p className="note">AI analysis provides review evidence only. It does not establish document authenticity. Source checks require an active Core connection and supported institutional records.</p>
  </main>;
}
