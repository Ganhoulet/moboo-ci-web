import type { Metadata } from "next";
import Link from "next/link";
import { getPriceIndex, nightly, TYPE_LABEL } from "@/lib/stays";
import { absUrl, breadcrumbLd, ldJson } from "@/lib/structured-data";

export const revalidate = 1800;
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const period = (p: string) => { const [y, m] = p.split("-").map(Number); return `${MONTHS[(m || 1) - 1]} ${y}`; };

export async function generateMetadata(): Promise<Metadata> {
  const d = await getPriceIndex();
  const when = d ? ` (${period(d.period)})` : "";
  return {
    title: { absolute: `Prix d’une nuit en résidence meublée à Abidjan et en Côte d’Ivoire${when} | Moboo.ci` },
    description: "Indice Moboo du prix de la nuitée : prix médian, fourchette et logements libres ce soir par commune (Cocody, Marcory, Yopougon, Plateau…), calculés sur les calendriers réels des résidences.",
    alternates: { canonical: "/prix-nuitee" },
  };
}

/** Indice Moboo du prix de la nuitée, par commune. */
export default async function NightPriceIndex() {
  const d = await getPriceIndex();
  const rows = d?.communes ?? [];
  const dataset = d ? {
    "@context": "https://schema.org", "@type": "Dataset",
    name: `Indice Moboo du prix de la nuitée en résidence meublée — ${period(d.period)}`,
    description: `Prix médian et fourchette d'une nuit en résidence meublée par commune en Côte d'Ivoire. ${d.source}`,
    url: absUrl("/prix-nuitee"), isAccessibleForFree: true, temporalCoverage: d.period,
    creator: { "@type": "Organization", name: "Moboo.ci", url: absUrl("/") },
    spatialCoverage: { "@type": "Place", name: "Côte d’Ivoire" },
  } : null;
  return (
    <div className="container-page py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson([breadcrumbLd([{ label: "Accueil", href: "/" }, { label: "Prix de la nuitée" }]), dataset].filter(Boolean)) }} />
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Combien coûte une nuit en résidence meublée ?</h1>
      <p className="mt-3 max-w-3xl text-muted">
        L’indice Moboo{d ? ` de ${period(d.period)}` : ""} : prix médian, fourchette et logements libres ce soir, commune par commune.
        {d?.national.night ? <> En Côte d’Ivoire, la nuit médiane coûte <strong className="text-ink">{nightly(d.national.night.median)}</strong> sur {d.national.apartments} logements.</> : null}
      </p>
      {rows.length ? (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2.5">Commune</th><th className="px-3 py-2.5">Nuit médiane</th><th className="px-3 py-2.5">La moitié entre</th><th className="px-3 py-2.5">Par type</th><th className="px-4 py-2.5 text-right">Libres ce soir</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.slug} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3"><Link href={`/annonces?transaction=furnished&q=${encodeURIComponent(c.name)}`} className="font-semibold text-brand-700 hover:underline">{c.name}</Link><span className="block text-xs text-muted">{c.residences} résidence{c.residences > 1 ? "s" : ""} · {c.apartments} logements</span></td>
                  <td className="px-3 py-3"><strong className="text-ink">{c.night ? nightly(c.night.median) : "—"}</strong></td>
                  <td className="px-3 py-3 text-muted">{c.night ? `${nightly(c.night.p25)} – ${nightly(c.night.p75)}` : "—"}</td>
                  <td className="px-3 py-3 text-muted">{Object.entries(c.byType).map(([t, s]) => <span key={t} className="block">{TYPE_LABEL[t] ?? t} : {nightly(s.median)}</span>)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">{c.freeTonight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="mt-8 rounded-xl bg-white p-6 text-muted ring-1 ring-slate-200">Pas encore assez de résidences pour publier des prix fiables.</p>}
      <p className="mt-4 max-w-3xl text-xs text-muted">Méthode : {d?.source ?? "prix affichés par les hôtes."} Une commune apparaît dès 3 logements. Mis à jour toutes les 30 minutes.</p>
      <div className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link href="/meuble-pres-de" className="rounded-full border border-slate-300 px-3 py-1.5 text-ink hover:border-ink">Meublés près d’un repère</Link>
        <Link href="/annonces?transaction=furnished" className="rounded-full border border-slate-300 px-3 py-1.5 text-ink hover:border-ink">Toutes les résidences meublées</Link>
        <Link href="/prix-immobilier" className="rounded-full border border-slate-300 px-3 py-1.5 text-ink hover:border-ink">Prix des loyers et de la vente</Link>
      </div>
    </div>
  );
}
