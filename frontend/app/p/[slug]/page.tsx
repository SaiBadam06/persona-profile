import { notFound } from "next/navigation";
import { PersonaPage } from "@/components/persona/PersonaPage";

async function fetchPersona(slug: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const res = await fetch(`${base}/api/personas/${slug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load persona");
  return res.json();
}

export default async function PersonaSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const persona = await fetchPersona(slug);
  if (!persona) notFound();
  return <PersonaPage persona={persona} />;
}
