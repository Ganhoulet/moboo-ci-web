import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceTable } from "@/components/price-table";
import { fcfa, getCommunePrices } from "@/lib/prices";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getCommunePrices(params.slug);
  if (!d) return { title: "Prix de l’immobilier" };
  const rent = d.rent?.overall, sale = d.sale?.overall;
  const title = rent ? `Prix des loyers à ${d.zone} en ${d.year} : ${fcfa(rent.median)} / mois` : `Prix de l’immobilier à ${d.zone} en ${d.year}`;
  const description = [
    rent ? `Loyer médian à ${d.zone} : ${fcfa(rent.median)} par mois (de ${fcfa(rent.p25)} à ${fcfa(rent.p75)} selon le bien).` : null,
    sale ? `Prix de vente médian : ${fcfa(sale.median)}.` : null,
    "Studios, appartements, villas : prix réels des annonces Moboo.ci, mis à jour chaque jour.",
  ].filter(Boolean).join(" ");
  return { title, description, alternates: { canonical: `/prix-immobilier/${d.slug}` }, openGraph: { title, description } };
}

/** « Prix des loyers à Cocody en 2026 » : indice des prix d'une commune (façon Zestimate). */
export default async function CommunePricesPage({ params }: { params: { slug: string } }) {
  const d = await getCommunePrices(params.slug);
  if (!d) notFound();
  const rent = d.rent, sale = d.sale;
  const faq = [
    rent?.overall ? { q: `Quel est le loyer moyen à ${d.zone} en ${d.year} ?`, a: `Sur Moboo.ci, le loyer médian à ${d.zone} est de ${fcfa(rent.overall.median)} par mois ; la moitié des biens se louent entre ${fcfa(rent.overall.p25)} et ${fcfa(rent.overall.p75)}.` } : null,
    ...(rent?.segments ?? []).filter((s) => s.segment === "studio").map((s) => ({ q: `Combien coûte un studio à ${d.zone} ?`, a: `Un studio se loue en général ${fcfa(s.median)} par mois à ${d.zone} (de ${fcfa(s.p25)} à ${fcfa(s.p75)}).` })),
    sale?.overall ? { q: `Quel est le prix d’achat d’un bien à ${d.zone} ?`, a: `Le prix de vente médian des biens à ${d.zone} est de ${fcfa(sale.overall.median)}.` } : null,
  ].filter(Boolean) as { q: string; a: string }[];
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const trend = (t: { changePct: number; since: string } | null) => t ? (
    <span className={"ml-2 rounded-full px-2 py-0.5 text-xs font-bold " + (t.changePct > 0 ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800")}>
      {t.changePct > 0 ? "+" : ""}{t.changePct} % depuis {new Date(`${t.since}-01`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
    </span>
  ) : null;

  return (
    <div className="container-page py-8 sm:py-10">
      {faq.length ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      <nav className="text-sm text-muted"><Link href="/prix-immobilier" className="hover:underline">Prix de l’immobilier</Link> › {d.city}{d.commune ? ` › ${d.commune}` : ""}</nav>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">Prix de l’immobilier à {d.zone} en {d.year}</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rent?.overall ? (
          <div className="rounded-xl bg-brand-900 p-5 text-white">
            <p className="text-sm text-white/70">Loyer médian à {d.zone}</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{fcfa(rent.overall.median)}<span className="text-base font-medium text-white/70"> / mois</span>{trend(rent.trend)}</p>
            <p className="mt-1 text-sm text-white/80">La moitié des biens entre {fcfa(rent.overall.p25)} et {fcfa(rent.overall.p75)} · {rent.overall.count} annonces</p>
          </div>
        ) : null}
        {sale?.overall ? (
          <div className="rounded-xl bg-[#FE6600] p-5 text-white">
            <p className="text-sm text-white/80">Prix de vente médian à {d.zone}</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{fcfa(sale.overall.median)}{trend(sale.trend)}</p>
            <p className="mt-1 text-sm text-white/90">La moitié des biens entre {fcfa(sale.overall.p25)} et {fcfa(sale.overall.p75)} · {sale.overall.count} annonces</p>
          </div>
        ) : null}
      </div>

      {rent?.segments.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold text-ink">Loyers à {d.zone} par type de bien</h2>
          <PriceTable rows={rent.segments} zone={d.zone} transaction="rent" />
        </section>
      ) : null}
      {sale?.segments.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold text-ink">Prix de vente à {d.zone} par type de bien</h2>
          <PriceTable rows={sale.segments} zone={d.zone} transaction="sale" />
        </section>
      ) : null}

      {d.neighbours.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold text-ink">Loyers médians ailleurs à {d.city}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {d.neighbours.map((n) => (
              <li key={n.slug}><Link href={`/prix-immobilier/${n.slug}`} className="flex justify-between rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-slate-200 hover:ring-brand-400"><span className="font-semibold text-ink">{n.commune}</span><span className="text-muted">{fcfa(n.rentMedian)}</span></Link></li>
            ))}
          </ul>
        </section>
      ) : null}

      {faq.length ? (
        <section className="mt-8 rounded-xl bg-white p-5 ring-1 ring-slate-200">
          <h2 className="mb-3 font-display text-xl font-bold text-ink">Questions fréquentes</h2>
          {faq.map((f) => (<div key={f.q} className="mb-3"><h3 className="font-semibold text-ink">{f.q}</h3><p className="text-sm text-muted">{f.a}</p></div>))}
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <p className="max-w-2xl text-sm text-muted">
          <strong className="text-ink">Comment ces prix sont calculés.</strong> Prix médians des annonces publiées sur Moboo.ci ces derniers mois à {d.zone}, y compris celles déjà louées ou vendues. Les prix aberrants sont écartés et un type de bien n’apparaît qu’à partir de {d.minSample} annonces. Mise à jour {new Date(d.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
        <div className="flex gap-2">
          <Link href={`/annonces?q=${encodeURIComponent(d.zone)}`} className="btn-primary bg-brand-800 hover:bg-brand-900">Annonces à {d.zone}</Link>
          <Link href="/publier" className="btn-ghost">Publier une annonce</Link>
        </div>
      </div>
    </div>
  );
}
