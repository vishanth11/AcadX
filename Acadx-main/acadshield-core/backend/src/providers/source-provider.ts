export type ProviderResultStatus = "VERIFIED" | "NOT_FOUND" | "NOT_CONFIGURED" | "SOURCE_UNAVAILABLE" | "MOCK_ONLY";

export interface ProviderResult {
  status: ProviderResultStatus;
  provider: string;
  evidence: string[];
  checkedAt: string;
}

export interface SourceProvider {
  verifyCredential(credentialId: string, documentSha256?: string): Promise<ProviderResult>;
  verifyIssuer(issuerDid: string): Promise<ProviderResult>;
  getStatus(credentialId: string): Promise<ProviderResult>;
}

/** A safe default for local deployments without an authoritative connector. */
export class UnconfiguredSourceProvider implements SourceProvider {
  constructor(private readonly providerName = "SOURCE_PROVIDER") {}

  private result(): ProviderResult {
    return { status: "NOT_CONFIGURED", provider: this.providerName, evidence: ["No authoritative source connector or credentials are configured"], checkedAt: new Date().toISOString() };
  }

  async verifyCredential(): Promise<ProviderResult> { return this.result(); }
  async verifyIssuer(): Promise<ProviderResult> { return this.result(); }
  async getStatus(): Promise<ProviderResult> { return this.result(); }
}

/**
 * Integration placeholders intentionally do not guess government URLs or
 * response semantics. Implement only against the approved, current provider
 * contract and credentials for the target deployment.
 */
export class DigiLockerProvider extends UnconfiguredSourceProvider {
  constructor() { super("DIGILOCKER"); }
}

export class NADProvider extends UnconfiguredSourceProvider {
  constructor() { super("NAD"); }
}

/** Sample fixtures can exercise UI/API flows, but never produce VERIFIED. */
export class MockSourceProvider implements SourceProvider {
  private result(): ProviderResult {
    return { status: "MOCK_ONLY", provider: "MOCK", evidence: ["Development fixture; not an authoritative issuer or government response"], checkedAt: new Date().toISOString() };
  }
  async verifyCredential(): Promise<ProviderResult> { return this.result(); }
  async verifyIssuer(): Promise<ProviderResult> { return this.result(); }
  async getStatus(): Promise<ProviderResult> { return this.result(); }
}

/** Select only adapters whose behavior is implemented and explicitly configured. */
export function configuredSourceProvider(): SourceProvider {
  switch ((process.env.SOURCE_PROVIDER || "unconfigured").trim().toLowerCase()) {
    case "mock": return new MockSourceProvider();
    case "digilocker": return new DigiLockerProvider();
    case "nad": return new NADProvider();
    default: return new UnconfiguredSourceProvider();
  }
}
