import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StayCardView } from "@/components/stays/stay-card";
import { commonText, getNearStays, nightly } from "@/lib/stays";
import { absUrl, breadcrumbLd, ldJson } from "@/lib/structured-data";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getNearStays(params.slug);
  if (!d) return {};
  const l = d.landmark;
  const price = d.night ? ` dès ${nightly(d.night.min)} la nuit` : "";
  const title = `Résidences meublées ${l.near} : ${d.residences} adresse${d.residences > 1 ? "s" : ""}${price}`;
  const description = `${d.apartments} logement${d.apartments > 1 ? "s" : ""} meublé${d.apartments > 1 ? "s" : ""} ${l.near}, classés par distance. Prix en FCFA, paiement Wave, Orange Money, MTN ou Moov, acompte sécurisé par Moboo.`;
  return {
    title: { absolute: `${title} | Moboo.ci` },
    description,
    alternates: { canonical: `/meuble-pres-de/${l.slug}` },
    // Pas de page vide dans Google : indexée à partir d'une résidence.
    robots: d.residences ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: `/meuble-pres-de/${l.slug}` },
  };
}

/** Résidences meublées autour d'un repère (aéroport, CHU, université…), de la plus proche à la plus éloignée. */
export default async function NearLandmarkPage({ params }: { params: { slug: string } }) {
  const d = await getNearStays(params.slug);
  if (!d) notFound();
  const l = d.landmark;
  const faq = [
    { q: `Combien coûte une nuit en résidence meublée ${l.near} ?`, a: d.night ? `Sur Moboo.ci, ${commonText(d.night) ? `le prix le plus fréquent est ${commonText(d.night)} la nuit (${d.night.commonCount} logements). ` : ""}La nuitée commence à ${nightly(d.night.min)} et le prix médian est de ${nightly(d.night.median)} pour les ${d.apartments} logements des ${d.residences} résidences situées à moins de ${String(l.radiusKm).replace(".", ",")} km.` : `Les prix s'affichent dès qu'une résidence est publiée ${l.near}.` },
    ...(d.tracked ? [{ q: `Y a-t-il des logements libres ce soir ${l.near} ?`, a: `${d.freeTonight} logement${d.freeTonight > 1 ? "s sont libres" : " est libre"} ce soir parmi les ${d.tracked} dont le calendrier est tenu en direct dans Moboo Resi. Pour les autres, envoyez une demande : l'hôte confirme la disponibilité.` }] : []),
    { q: "Comment payer la réservation ?", a: "Par Wave, Orange Money, MTN ou Moov. L'acompte est conservé par Moboo jusqu'à votre arrivée, puis vous recevez l'adresse exacte et votre code d'arrivée." },
  ];
  const ld = [
    breadcrumbLd([{ label: "Accueil", href: "/" }, { label: "Meublés par repère", href: "/meuble-pres-de" }, { label: l.name }]),
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) },
    d.items.length ? {
      "@context": "https://schema.org", "@type": "ItemList", name: `Résidences meublées ${l.near}`,
      itemListElement: d.items.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: absUrl(s.href), name: s.name })),
    } : null,
  ].filter(Boolean);
  return (
    <div className="container-page py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="Fil d’Ariane" className="text-sm text-muted">
        <Link href="/" className="hover:underline">Accueil</Link><span className="mx-2">›</span>
        <Link href="/meuble-pres-de" className="hover:underline">Meublés par repère</Link><span className="mx-2">›</span><span className="text-ink">{l.name}</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Résidences meublées {l.near}</h1>
      <p className="mt-3 max-w-3xl text-muted">{l.why} Ici, {d.residences} résidence{d.residences > 1 ? "s" : ""} à moins de {String(l.radiusKm).replace(".", ",")} km, classée{d.residences > 1 ? "s" : ""} de la plus proche à la plus éloignée.</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {d.tracked ? (
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><dt className="text-xs uppercase tracking-wide text-muted">Libres ce soir</dt><dd className="mt-1 font-display text-2xl font-extrabold text-ink">{d.freeTonight} <span className="text-sm font-semibold text-muted">sur {d.tracked} suivis</span></dd></div>
        ) : (
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><dt className="text-xs uppercase tracking-wide text-muted">Logements</dt><dd className="mt-1 font-display text-2xl font-extrabold text-ink">{d.apartments}</dd></div>
        )}
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><dt className="text-xs uppercase tracking-wide text-muted">Prix le plus fréquent</dt><dd className="mt-1 font-display text-2xl font-extrabold text-ink">{commonText(d.night) ?? (d.night ? nightly(d.night.median) : "—")}</dd>{d.night?.common?.length ? <p className="text-xs text-muted">{d.night.commonCount} logements à ce prix par nuit</p> : null}</div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><dt className="text-xs uppercase tracking-wide text-muted">Prix médian</dt><dd className="mt-1 font-display text-2xl font-extrabold text-ink">{d.night ? nightly(d.night.median) : "—"}</dd>{d.night ? <p className="text-xs text-muted">dès {nightly(d.night.min)}</p> : null}</div>
      </dl>
      {d.items.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.items.map((s) => <StayCardView key={s.id} s={s} />)}</div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-muted">Pas encore de résidence publiée {l.near}. <Link href="/annonces?transaction=furnished" className="font-semibold text-ink underline">Voir toutes les résidences</Link></div>
      )}
      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-xl font-bold text-ink">Questions fréquentes</h2>
        {faq.map((x) => (
          <details key={x.q} className="mt-3 rounded-xl bg-white p-4 ring-1 ring-slate-200"><summary className="cursor-pointer font-semibold text-ink">{x.q}</summary><p className="mt-2 text-muted">{x.a}</p></details>
        ))}
      </section>
      {d.others.length ? (
        <section className="mt-12">
          <h2 className="font-display text-lg font-bold text-ink">Autres repères à {l.city}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {d.others.map((o) => <Link key={o.slug} href={`/meuble-pres-de/${o.slug}`} className="rounded-full border border-slate-300 px-3 py-1.5 text-ink hover:border-ink">Meublés {o.near}</Link>)}
            <Link href="/prix-nuitee" className="rounded-full border border-slate-300 px-3 py-1.5 text-ink hover:border-ink">Prix de la nuitée par commune</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
