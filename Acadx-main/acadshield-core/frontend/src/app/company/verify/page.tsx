import UnavailableFeaturePage from "@/components/UnavailableFeaturePage";

export default function CompanyVerifyPage() {
  return <UnavailableFeaturePage role="COMPANY" title="Choose a verification workflow" description="These routes query the ACADSHIELD Core registry. An exact uploaded-file SHA-256 match proves file equality with the stored copy; credential lookup reports registry, issuer, source-provider, and available chain evidence separately. A match alone does not establish that a document is genuine." links={[{ href: "/company/verify/document", label: "Verify an uploaded document" }, { href: "/company/verify/credential", label: "Look up a credential ID" }, { href: "/company/verifications", label: "View verification history" }]} />;
}
