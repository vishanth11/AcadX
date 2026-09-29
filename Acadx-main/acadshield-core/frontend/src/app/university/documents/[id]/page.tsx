import RegistryPage from "@/components/RegistryPage";

export default async function Page({ params: pendingParams }: { params: Promise<{ id: string }> }) {
  const params = await pendingParams;
  return <RegistryPage title="University · Documents · Record" endpoint={`/documents/${encodeURIComponent(params.id)}`} documentReview />;
}
