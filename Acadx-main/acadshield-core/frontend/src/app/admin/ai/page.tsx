import UnavailableFeaturePage from "@/components/UnavailableFeaturePage";

export default function AdminAiPage() {
  return <UnavailableFeaturePage role="ADMIN" title="AI operations dashboard is not connected" description="The previous dashboard contained invented model versions, accuracy figures, and inference records. ACADSHIELD currently exposes document evidence analysis during upload, but has no connected admin inference queue or validated production model metrics." links={[{ href: "/university/documents/upload", label: "Open document upload" }, { href: "/admin", label: "Return to admin overview" }]} />;
}
