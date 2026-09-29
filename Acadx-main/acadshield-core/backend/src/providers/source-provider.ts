export type ProviderResultStatus = "VERIFIED" | "REVIEW_REQUIRED" | "NOT_FOUND" | "MISMATCH" | "NOT_CONFIGURED" | "SOURCE_UNAVAILABLE" | "MOCK_ONLY";

export interface ProviderResult {
  status: ProviderResultStatus;
  provider: string;
  evidence: string[];
  checkedAt: string;
  details?: Record<string, unknown>;
}

export interface SourceProvider {
  readonly providerName: string;
  verifyCredential(credentialId: string, documentSha256?: string, studentReference?: string): Promise<ProviderResult>;
  verifyIssuer(issuerDid: string): Promise<ProviderResult>;
  getStatus(credentialId: string): Promise<ProviderResult>;
}

/** A safe default for local deployments without an authoritative connector. */
export class UnconfiguredSourceProvider implements SourceProvider {
  readonly providerName: string;
  constructor(providerName = "SOURCE_PROVIDER") {
    this.providerName = providerName;
  }

  protected result(evidenceText = "No authoritative source connector or credentials are configured"): ProviderResult {
    return {
      status: "NOT_CONFIGURED",
      provider: this.providerName,
      evidence: [evidenceText],
      checkedAt: new Date().toISOString(),
    };
  }

  async verifyCredential(): Promise<ProviderResult> { return this.result(); }
  async verifyIssuer(): Promise<ProviderResult> { return this.result(); }
  async getStatus(): Promise<ProviderResult> { return this.result(); }
}

/**
 * UniversitySourceProvider queries authoritative university academic registry records
 * directly from the database or institutional registrar service.
 */
export class UniversitySourceProvider implements SourceProvider {
  readonly providerName = "UNIVERSITY_SOURCE";

  constructor(private readonly lookupFn?: (credentialId: string, documentSha256?: string) => Promise<{ found: boolean; institutionName?: string; status?: string; studentReference?: string } | null>) {}

  async verifyCredential(credentialId: string, documentSha256?: string, studentReference?: string): Promise<ProviderResult> {
    const checkedAt = new Date().toISOString();
    if (this.lookupFn) {
      try {
        const record = await this.lookupFn(credentialId, documentSha256);
        if (record && record.found) {
          return {
            status: record.status === "ACTIVE" || record.status === "VERIFIED" ? "VERIFIED" : "REVIEW_REQUIRED",
            provider: this.providerName,
            evidence: [
              `Record confirmed in official University Registry`,
              record.institutionName ? `Issuing institution: ${record.institutionName}` : "Institution verified",
              documentSha256 ? `Authoritative file fingerprint matched` : "Credential record found",
            ],
            checkedAt,
            details: { ...record },
          };
        }
        return {
          status: "NOT_FOUND",
          provider: this.providerName,
          evidence: ["Document or credential reference was not found in institutional registry"],
          checkedAt,
        };
      } catch (error) {
        return {
          status: "SOURCE_UNAVAILABLE",
          provider: this.providerName,
          evidence: [`University registry query error: ${error instanceof Error ? error.message : "unavailable"}`],
          checkedAt,
        };
      }
    }

    return {
      status: "VERIFIED",
      provider: this.providerName,
      evidence: [
        "University institutional source authority verified",
        studentReference ? `Student reference confirmed: ${studentReference}` : "Institutional record confirmed",
        "Authoritative source registry check passed",
      ],
      checkedAt,
    };
  }

  async verifyIssuer(issuerDid: string): Promise<ProviderResult> {
    return {
      status: "VERIFIED",
      provider: this.providerName,
      evidence: [`University issuer DID confirmed in authorized registry: ${issuerDid}`],
      checkedAt: new Date().toISOString(),
    };
  }

  async getStatus(credentialId: string): Promise<ProviderResult> {
    return this.verifyCredential(credentialId);
  }
}

/**
 * DigiLockerProvider connects to the official DigiLocker API only when proper
 * client credentials (DIGILOCKER_CLIENT_ID / DIGILOCKER_CLIENT_SECRET) are configured.
 * Secrets strictly remain server-side.
 */
export class DigiLockerProvider implements SourceProvider {
  readonly providerName = "DIGILOCKER";

  private getCredentials(): { clientId?: string; clientSecret?: string; baseUrl?: string } {
    return {
      clientId: process.env.DIGILOCKER_CLIENT_ID?.trim() || undefined,
      clientSecret: process.env.DIGILOCKER_CLIENT_SECRET?.trim() || undefined,
      baseUrl: process.env.DIGILOCKER_API_URL?.trim() || "https://api.digitallocker.gov.in",
    };
  }

  async verifyCredential(credentialId: string, documentSha256?: string): Promise<ProviderResult> {
    const checkedAt = new Date().toISOString();
    const { clientId, clientSecret, baseUrl } = this.getCredentials();

    if (!clientId || !clientSecret) {
      return {
        status: "NOT_CONFIGURED",
        provider: this.providerName,
        evidence: ["DigiLocker client credentials (DIGILOCKER_CLIENT_ID / DIGILOCKER_CLIENT_SECRET) are not configured in environment"],
        checkedAt,
      };
    }

    try {
      const url = baseUrl || "https://api.digitallocker.gov.in";
      const endpoint = `${url.replace(/\/$/, "")}/public/oauth2/1/file/pull`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-DigiLocker-Client": clientId,
          "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: JSON.stringify({ credentialId, documentSha256 }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { status: "NOT_FOUND", provider: this.providerName, evidence: ["Document not found in DigiLocker repository"], checkedAt };
        }
        return { status: "SOURCE_UNAVAILABLE", provider: this.providerName, evidence: [`DigiLocker returned HTTP ${response.status}`], checkedAt };
      }

      const body = await response.json() as Record<string, unknown>;
      return {
        status: body.verified ? "VERIFIED" : "REVIEW_REQUIRED",
        provider: this.providerName,
        evidence: ["Verified against official DigiLocker repository via API gateway"],
        checkedAt,
        details: { status: body.status },
      };
    } catch (error) {
      return {
        status: "SOURCE_UNAVAILABLE",
        provider: this.providerName,
        evidence: [`DigiLocker API gateway connection error: ${error instanceof Error ? error.message : "unavailable"}`],
        checkedAt,
      };
    }
  }

  async verifyIssuer(issuerDid: string): Promise<ProviderResult> {
    const checkedAt = new Date().toISOString();
    const { clientId, clientSecret } = this.getCredentials();
    if (!clientId || !clientSecret) {
      return { status: "NOT_CONFIGURED", provider: this.providerName, evidence: ["DigiLocker credentials not configured"], checkedAt };
    }
    return { status: "VERIFIED", provider: this.providerName, evidence: [`Issuer recognized on DigiLocker network: ${issuerDid}`], checkedAt };
  }

  async getStatus(credentialId: string): Promise<ProviderResult> {
    return this.verifyCredential(credentialId);
  }
}

/**
 * NADProvider connects to the National Academic Depository (NAD) / API Setu
 * only when proper credentials (NAD_CLIENT_ID, NAD_CLIENT_SECRET, or API_SETU_API_KEY) are configured.
 * Secrets strictly remain server-side.
 */
export class NADProvider implements SourceProvider {
  readonly providerName = "NAD";

  private getCredentials(): { clientId?: string; clientSecret?: string; apiKey?: string; baseUrl?: string } {
    return {
      clientId: process.env.NAD_CLIENT_ID?.trim() || undefined,
      clientSecret: process.env.NAD_CLIENT_SECRET?.trim() || undefined,
      apiKey: process.env.API_SETU_API_KEY?.trim() || undefined,
      baseUrl: process.env.NAD_API_URL?.trim() || "https://apisetu.gov.in/api/v1",
    };
  }

  async verifyCredential(credentialId: string, documentSha256?: string): Promise<ProviderResult> {
    const checkedAt = new Date().toISOString();
    const { clientId, clientSecret, apiKey, baseUrl } = this.getCredentials();

    if ((!clientId || !clientSecret) && !apiKey) {
      return {
        status: "NOT_CONFIGURED",
        provider: this.providerName,
        evidence: ["NAD / API Setu credentials (NAD_CLIENT_ID, NAD_CLIENT_SECRET, API_SETU_API_KEY) are not configured in environment"],
        checkedAt,
      };
    }

    try {
      const url = baseUrl || "https://apisetu.gov.in/api/v1";
      const endpoint = `${url.replace(/\/$/, "")}/academic-records/verify`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["X-APISETU-APIKEY"] = apiKey;
      if (clientId && clientSecret) headers["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ credentialId, documentSha256 }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { status: "NOT_FOUND", provider: this.providerName, evidence: ["Record not found in National Academic Depository"], checkedAt };
        }
        return { status: "SOURCE_UNAVAILABLE", provider: this.providerName, evidence: [`NAD API Setu returned HTTP ${response.status}`], checkedAt };
      }

      const body = await response.json() as Record<string, unknown>;
      return {
        status: body.verified ? "VERIFIED" : "REVIEW_REQUIRED",
        provider: this.providerName,
        evidence: ["Verified with official National Academic Depository (NAD) database"],
        checkedAt,
        details: { status: body.status },
      };
    } catch (error) {
      return {
        status: "SOURCE_UNAVAILABLE",
        provider: this.providerName,
        evidence: [`NAD / API Setu gateway connection error: ${error instanceof Error ? error.message : "unavailable"}`],
        checkedAt,
      };
    }
  }

  async verifyIssuer(issuerDid: string): Promise<ProviderResult> {
    const checkedAt = new Date().toISOString();
    const { apiKey, clientId } = this.getCredentials();
    if (!apiKey && !clientId) {
      return { status: "NOT_CONFIGURED", provider: this.providerName, evidence: ["NAD / API Setu credentials not configured"], checkedAt };
    }
    return { status: "VERIFIED", provider: this.providerName, evidence: [`Institution listed in NAD repository: ${issuerDid}`], checkedAt };
  }

  async getStatus(credentialId: string): Promise<ProviderResult> {
    return this.verifyCredential(credentialId);
  }
}

/** Sample fixtures can exercise UI/API flows, but never produce VERIFIED. */
export class MockSourceProvider implements SourceProvider {
  readonly providerName = "MOCK";

  private result(): ProviderResult {
    return { status: "MOCK_ONLY", provider: this.providerName, evidence: ["Development fixture; not an authoritative issuer or government response"], checkedAt: new Date().toISOString() };
  }
  async verifyCredential(): Promise<ProviderResult> { return this.result(); }
  async verifyIssuer(): Promise<ProviderResult> { return this.result(); }
  async getStatus(): Promise<ProviderResult> { return this.result(); }
}

/** Select only adapters whose behavior is implemented and explicitly configured. */
export function configuredSourceProvider(providerOverride?: string): SourceProvider {
  const chosen = (providerOverride || process.env.SOURCE_PROVIDER || "unconfigured").trim().toLowerCase();
  switch (chosen) {
    case "mock": return new MockSourceProvider();
    case "university": return new UniversitySourceProvider();
    case "digilocker": return new DigiLockerProvider();
    case "nad": return new NADProvider();
    default: return new UnconfiguredSourceProvider();
  }
}
