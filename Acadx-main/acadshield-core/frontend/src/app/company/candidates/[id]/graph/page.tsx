import UnavailableFeaturePage from "@/components/UnavailableFeaturePage";

export default function CandidateGraphPage() {
  return <UnavailableFeaturePage role="COMPANY" title="Credential relationship graph is not available" description="Credential graph data and candidate relationships are not connected to the registry. No graph or inferred relationship is displayed." links={[{ href: "/company/verify/document", label: "Verify a document copy" }, { href: "/company/verifications", label: "View verification history" }]} />;
}
