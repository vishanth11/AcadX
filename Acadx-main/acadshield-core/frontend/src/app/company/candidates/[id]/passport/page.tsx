import UnavailableFeaturePage from "@/components/UnavailableFeaturePage";

export default function CandidatePassportPage() {
  return <UnavailableFeaturePage role="COMPANY" title="Candidate trust passport is not available" description="There is no connected, consent-based passport-sharing workflow yet. The earlier passport view contained sample data and must not be treated as evidence." links={[{ href: "/company/verify/document", label: "Verify a document copy" }, { href: "/company/verifications", label: "View verification history" }]} />;
}
