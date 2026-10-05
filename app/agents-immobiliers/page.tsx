import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DirectoryView } from "@/components/pros/directory-view";
import { slugZone, type DirectoryQuery } from "@/lib/pro-reviews";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Agents et agences immobilières en Côte d’Ivoire — avis clients",
  description: "Trouvez un agent ou une agence immobilière par commune et quartier (Abidjan, Cocody, Marcory, Yopougon…) : avis certifiés, annonces en ligne, contact direct sur Moboo.ci.",
  alternates: { canonical: "/agents-immobiliers" },
};

export default function AgentsImmobiliers({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  // Une zone saisie → page dédiée (adresse propre, indexable).
  const zone = slugZone(searchParams.zone ?? "");
  if (zone) {
    const rest = new URLSearchParams(Object.entries(searchParams).filter(([k, v]) => k !== "zone" && v) as [string, string][]).toString();
    redirect(`/agents-immobiliers/${zone}${rest ? `?${rest}` : ""}`);
  }
  const q: DirectoryQuery = { q: searchParams.q, type: searchParams.type, sort: searchParams.sort, verified: searchParams.verified, minRating: searchParams.minRating, page: searchParams.page };
  return <DirectoryView base="/agents-immobiliers" query={q} />;
}
