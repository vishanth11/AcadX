import UnavailableFeaturePage from "@/components/UnavailableFeaturePage";

export default function CompanyCandidatesPage() {
  return <UnavailableFeaturePage role="COMPANY" title="Candidate registry is not connected" description="Candidate search, consent-based sharing, and employee records are not implemented against the ACADSHIELD registry. No candidate records or verification results are shown here. Use the document verification workflow for a submitted copy, or review verification requests created by your company." links={[{ href: "/company/verify/document", label: "Verify a document copy" }, { href: "/company/verifications", label: "View company verification history" }]} />;
}
