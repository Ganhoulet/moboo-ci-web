import type { MetadataRoute } from "next";
import { getSeoLinks } from "@/lib/seo";
import { getPriceCommunes } from "@/lib/prices";

export const dynamic = "force-dynamic"; // toujours à jour avec les pages SEO publiées
const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://moboo.ci").replace(/\/+$/, "");

/** Plan du site : pages principales + pages SEO publiées (back-office → Pages SEO). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const main = ["/", "/annonces", "/annonces?transaction=rent", "/annonces?transaction=sale", "/annonces?transaction=furnished", "/annonces?transaction=event", "/forfaits", "/publier", "/confidentialite", "/suppression-compte"]
    .map((p, i) => ({ url: `${BASE}${p === "/" ? "" : p}`, lastModified: now, changeFrequency: "daily" as const, priority: i === 0 ? 1 : 0.8 }));
  const seo = (await getSeoLinks())
    .filter((l) => l.kind === "landing" && !l.noindex)
    .map((l) => ({ url: `${BASE}/${l.slug}`, lastModified: new Date(l.updatedAt), changeFrequency: "daily" as const, priority: 0.7 }));
  // Indice des prix : page générale + une page par commune.
  const communes = (await getPriceCommunes()) ?? [];
  const prices = communes.length
    ? [{ url: `${BASE}/prix-immobilier`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 },
       ...communes.map((c) => ({ url: `${BASE}/prix-immobilier/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 }))]
    : [];
  return [...main, ...seo, ...prices];
}
