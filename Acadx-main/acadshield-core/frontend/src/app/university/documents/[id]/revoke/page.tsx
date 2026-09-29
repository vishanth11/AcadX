import RegistryPage from "@/components/RegistryPage";

export default async function Page({ params: pendingParams }: { params: Promise<{ id: string }> }) {
  const params = await pendingParams;
  return <RegistryPage title="Revoke a credential linked to this document" endpoint={`/registry/credentials?documentId=${encodeURIComponent(params.id)}`} credentialActions />;
}
