import type { Metadata } from "next";
import { DirectoryView } from "@/components/pros/directory-view";
import { getZones, searchPros, slugZone, type DirectoryQuery } from "@/lib/pro-reviews";

export const revalidate = 60;

async function zoneLabel(slug: string) {
  const z = (await getZones()).find((x) => x.slug === slug);
  if (z) return z.label;
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function generateMetadata({ params }: { params: { zone: string } }): Promise<Metadata> {
  const slug = slugZone(params.zone);
  const label = await zoneLabel(slug);
  const res = await searchPros({ zone: slug });
  return {
    title: `Agents immobiliers à ${label} — avis et contacts`,
    description: `${res.total} agent(s) et agence(s) immobilière(s) à ${label} : avis certifiés de leurs clients, annonces en ligne, contact WhatsApp. Trouvez le bon professionnel sur Moboo.ci.`,
    alternates: { canonical: `/agents-immobiliers/${slug}` },
    robots: res.total ? undefined : { index: false },
  };
}

export default async function AgentsZone({ params, searchParams }: { params: { zone: string }; searchParams: Record<string, string | undefined> }) {
  const slug = slugZone(params.zone);
  const q: DirectoryQuery = { zone: slug, q: searchParams.q, type: searchParams.type, sort: searchParams.sort, verified: searchParams.verified, minRating: searchParams.minRating, page: searchParams.page };
  return <DirectoryView base={`/agents-immobiliers/${slug}`} query={q} zoneLabel={await zoneLabel(slug)} />;
}
