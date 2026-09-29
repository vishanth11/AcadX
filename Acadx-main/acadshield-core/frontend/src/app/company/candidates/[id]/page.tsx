import UnavailableFeaturePage from "@/components/UnavailableFeaturePage";

export default function CandidateDetailsPage() {
  return <UnavailableFeaturePage role="COMPANY" title="Candidate records are not connected" description="ACADSHIELD does not currently provide a consent-based candidate profile registry. The previous screen used sample data, so candidate details and credential statuses are intentionally unavailable." links={[{ href: "/company/verify/document", label: "Verify a document copy" }, { href: "/company/verifications", label: "View verification history" }]} />;
}
