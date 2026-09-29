import RegistryPage from "@/components/RegistryPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RegistryPage title="Your credential" endpoint={`/student/credentials/${encodeURIComponent(id)}`} />;
}
