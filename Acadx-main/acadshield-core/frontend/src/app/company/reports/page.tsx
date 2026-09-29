import UnavailableFeaturePage from "@/components/UnavailableFeaturePage";

export default function CompanyReportsPage() {
  return <UnavailableFeaturePage role="COMPANY" title="Company reports are not connected" description="Aggregate verification analytics and exportable reports are not implemented. No report metrics are available from the ACADSHIELD registry yet." links={[{ href: "/company/verifications", label: "View verification history" }, { href: "/company/verify/document", label: "Verify a document copy" }]} />;
}
