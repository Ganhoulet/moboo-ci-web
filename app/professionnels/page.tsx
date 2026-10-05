import type { Metadata } from "next";
import { ProPage } from "@/components/pros/pro-page";
import { getProPage } from "@/lib/pros";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getProPage("pros");
  return { title: meta.title, description: meta.description, alternates: { canonical: "/professionnels" }, openGraph: { title: meta.title, description: meta.description } };
}

/** Moboo.ci pour les professionnels (accueil de l'espace pros, modifiable dans le back-office). */
export default function Professionnels({ searchParams }: { searchParams: { apercu?: string } }) {
  return <ProPage slug="pros" preview={searchParams.apercu === "1"} />;
}
