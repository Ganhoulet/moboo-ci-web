import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { DirectoryView } from "@/components/pros/directory-view";
import { getZoneSummary, getZones, searchPros, slugZone, type DirectoryQuery } from "@/lib/pro-reviews";

export const revalidate = 60;

/**
 * Zone sous sa forme unique (l'API regroupe « Angré. », « Cocody Angré »… en
 * « Angré ») et ses chiffres. Une variante redirige vers la page unique : une
 * seule page par lieu, comme le demande Google.
 */
async function load(raw: string) {
  const slug = slugZone(raw);
  const [res, zones, summary] = await Promise.all([searchPros({ zone: slug }), getZones(), getZoneSummary(slug)]);
  // `zone` absent : ancienne API (pas de regroupement) ; null : pas une zone (pays seul…).
  const canonical = res.zone === undefined ? slug : res.zone?.slug ?? null;
  const z = zones.find((x) => x.slug === (canonical ?? slug));
  const label = res.zone?.label || z?.label || slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { slug, canonical, label, res, summary, indexable: !!z && z.indexable !== false && res.total > 0 };
}

export async function generateMetadata({ params }: { params: { zone: string } }): Promise<Metadata> {
  const { canonical, label, res, summary, indexable } = await load(params.zone);
  const p = summary?.pros;
  const rating = p?.reviews && p.rating ? ` Note moyenne ${String(p.rating).replace(".", ",")}/5 sur ${p.reviews} avis certifiés.` : "";
  return {
    title: `Agents immobiliers à ${label} — avis et contacts`,
    description: `${res.total} agent(s) et agence(s) immobilière(s) à ${label} sur Moboo.ci : avis certifiés de leurs clients, annonces en ligne, contact WhatsApp.${rating}`.slice(0, 300),
    alternates: { canonical: `/agents-immobiliers/${canonical ?? ""}`.replace(/\/$/, "") },
    // Trop peu de professionnels : page utile aux visiteurs, mais pas proposée à Google.
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function AgentsZone({ params, searchParams }: { params: { zone: string }; searchParams: Record<string, string | undefined> }) {
  const { slug, canonical, label, summary } = await load(params.zone);
  if (canonical !== slug) {
    const rest = new URLSearchParams(Object.entries(searchParams).filter(([, v]) => v) as [string, string][]).toString();
    permanentRedirect(`/agents-immobiliers${canonical ? `/${canonical}` : ""}${rest ? `?${rest}` : ""}`);
  }
  const q: DirectoryQuery = { zone: slug, q: searchParams.q, type: searchParams.type, sort: searchParams.sort, verified: searchParams.verified, minRating: searchParams.minRating, page: searchParams.page };
  return <DirectoryView base={`/agents-immobiliers/${slug}`} query={q} zoneLabel={label} summary={summary} />;
}
