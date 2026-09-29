import UnavailableFeaturePage from "@/components/UnavailableFeaturePage";

export default function CompanyTrustPassportPage() {
  return <UnavailableFeaturePage role="COMPANY" title="Trust Passport is not connected" description="The consent-based credential disclosure and passport workflow is not implemented. No passport, candidate record, or credential bundle is being presented on this page." links={[{ href: "/company/verify/document", label: "Verify a document copy" }, { href: "/company/verifications", label: "View verification history" }]} />;
}
