import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fcfa, getPriceCommunes, type CommuneRow } from "@/lib/prices";

export const revalidate = 3600;
const YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Prix de l’immobilier en Côte d’Ivoire en ${YEAR} : loyers et prix de vente par commune`,
  description: "Loyers médians et prix de vente par commune (Cocody, Yopougon, Marcory, Bingerville…), calculés sur les annonces réelles de Moboo.ci.",
  alternates: { canonical: "/prix-immobilier" },
};

/** Indice des prix par commune (façon Zestimate de Zillow). */
export default async function PricesIndex() {
  const rows = await getPriceCommunes();
  if (!rows) notFound();
  const byCity = new Map<string, CommuneRow[]>();
  for (const r of rows) byCity.set(r.city, [...(byCity.get(r.city) ?? []), r]);
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Prix de l’immobilier en Côte d’Ivoire en {YEAR}</h1>
      <p className="mt-2 max-w-3xl text-muted">Loyers et prix de vente médians par commune, calculés sur les annonces réelles publiées sur Moboo.ci (prix aberrants écartés). Cliquez sur une commune pour le détail par type de bien.</p>
      {rows.length ? [...byCity].map(([city, list]) => (
        <section key={city} className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold text-ink">{city}</h2>
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2.5">Commune</th><th className="px-3 py-2.5">Loyer médian</th><th className="px-3 py-2.5">Prix de vente médian</th><th className="px-4 py-2.5 text-right">Annonces</th></tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.slug} className="border-t border-slate-100">
                    <td className="px-4 py-3"><Link href={`/prix-immobilier/${c.slug}`} className="font-semibold text-brand-700 hover:underline">{c.commune}</Link></td>
                    <td className="px-3 py-3">{c.rent ? <><strong className="text-ink">{fcfa(c.rent.median)}</strong><span className="text-xs text-muted"> / mois</span></> : <span className="text-muted">—</span>}</td>
                    <td className="px-3 py-3">{c.sale ? <strong className="text-ink">{fcfa(c.sale.median)}</strong> : <span className="text-muted">—</span>}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{(c.rent?.count ?? 0) + (c.sale?.count ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )) : <p className="mt-8 rounded-xl bg-white p-6 text-muted ring-1 ring-slate-200">Pas encore assez d’annonces pour publier des prix fiables.</p>}
    </div>
  );
}
