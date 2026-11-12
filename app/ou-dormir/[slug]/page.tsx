import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StayCardView } from "@/components/stays/stay-card";
import { commonText, dateRange, getEventStays, nightly } from "@/lib/stays";
import { absUrl, breadcrumbLd, ldJson } from "@/lib/structured-data";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await getEventStays(params.slug);
  if (!d) return {};
  const e = d.event;
  const title = `Où dormir pendant ${e.name} : résidences meublées près de ${e.venue}`;
  const description = `${d.residences} résidence${d.residences > 1 ? "s" : ""} meublée${d.residences > 1 ? "s" : ""} à moins de ${String(e.radiusKm).replace(".", ",")} km de ${e.venue}, ${dateRange(e.startDate, e.endDate)}${d.night ? `, dès ${nightly(d.night.min)} la nuit` : ""}. Paiement Wave, Orange Money, MTN ou Moov.`;
  return {
    title: { absolute: `${title} | Moboo.ci` }, description,
    alternates: { canonical: `/ou-dormir/${e.slug}` },
    robots: d.residences ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: `/ou-dormir/${e.slug}` },
  };
}

/** Résidences autour du lieu d'un événement, dates de séjour pré-remplies. */
export default async function EventStaysPage({ params }: { params: { slug: string } }) {
  const d = await getEventStays(params.slug);
  if (!d) notFound();
  const e = d.event;
  const day = (s: string) => new Date(`${s}T00:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const tracked = d.tracked ?? 0;
  const faq = [
    { q: `Quelles dates réserver pour ${e.name} ?`, a: `Nous proposons d'arriver ${day(d.stay.checkIn)} et de repartir ${day(d.stay.checkOut)}, pour être sur place la veille et ne pas courir après la dernière soirée. Vous pouvez changer ces dates sur la fiche de la résidence.` },
    { q: `Combien coûte une nuit près de ${e.venue} ?`, a: d.night ? `${commonText(d.night) ? `Le prix le plus fréquent est ${commonText(d.night)} la nuit. ` : ""}La nuitée commence à ${nightly(d.night.min)} et le prix médian est de ${nightly(d.night.median)} pour les ${d.apartments} logements situés à moins de ${String(e.radiusKm).replace(".", ",")} km.` : "Les prix s'affichent dès qu'une résidence est publiée autour du lieu." },
    ...(tracked ? [{ q: "Reste-t-il des logements libres ?", a: `${d.freeDuring} logement${d.freeDuring > 1 ? "s sont libres" : " est libre"} sur toute la période parmi ceux dont le calendrier est tenu en direct dans Moboo Resi. Pour les autres, envoyez une demande : l'hôte confirme la disponibilité.` }] : []),
    { q: "Comment payer ?", a: "Par Wave, Orange Money, MTN ou Moov. L'acompte est conservé par Moboo jusqu'à votre arrivée." },
  ];
  const ld = [
    breadcrumbLd([{ label: "Accueil", href: "/" }, { label: "Où dormir pendant un événement", href: "/ou-dormir" }, { label: e.name }]),
    {
      "@context": "https://schema.org", "@type": "Event", name: e.name, startDate: e.startDate.slice(0, 10), endDate: e.endDate.slice(0, 10),
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "Place", name: e.venue, address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: "CI" }, geo: { "@type": "GeoCoordinates", latitude: e.lat, longitude: e.lng } },
      ...(e.description ? { description: e.description } : {}),
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) },
    d.items.length ? { "@context": "https://schema.org", "@type": "ItemList", name: `Résidences meublées près de ${e.venue}`, itemListElement: d.items.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: absUrl(s.href), name: s.name })) } : null,
  ].filter(Boolean);
  return (
    <div className="container-page py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <nav aria-label="Fil d’Ariane" className="text-sm text-muted">
        <Link href="/" className="hover:underline">Accueil</Link><span className="mx-2">›</span>
        <Link href="/ou-dormir" className="hover:underline">Où dormir pendant un événement</Link><span className="mx-2">›</span><span className="text-ink">{e.name}</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Où dormir pendant {e.name} ?</h1>
      <p className="mt-3 max-w-3xl text-muted">{e.venue}, {e.city}, {dateRange(e.startDate, e.endDate)}. {e.description ? `${e.description} ` : ""}Voici les résidences meublées à moins de {String(e.radiusKm).replace(".", ",")} km, de la plus proche à la plus éloignée, avec les dates déjà remplies : arrivée {day(d.stay.checkIn)}, départ {day(d.stay.checkOut)}.</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">{tracked ? <><dt className="text-xs uppercase tracking-wide text-muted">Libres sur toute la période</dt><dd className="mt-1 font-display text-2xl font-extrabold text-ink">{d.freeDuring} <span className="text-sm font-semibold text-muted">sur {tracked} suivis</span></dd></> : <><dt className="text-xs uppercase tracking-wide text-muted">Logements autour</dt><dd className="mt-1 font-display text-2xl font-extrabold text-ink">{d.apartments}</dd></>}</div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><dt className="text-xs uppercase tracking-wide text-muted">Prix le plus fréquent</dt><dd className="mt-1 font-display text-2xl font-extrabold text-ink">{commonText(d.night) ?? (d.night ? nightly(d.night.median) : "—")}</dd><p className="text-xs text-muted">par nuit</p></div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><dt className="text-xs uppercase tracking-wide text-muted">Prix médian</dt><dd className="mt-1 font-display text-2xl font-extrabold text-ink">{d.night ? nightly(d.night.median) : "—"}</dd>{d.night ? <p className="text-xs text-muted">dès {nightly(d.night.min)}</p> : null}</div>
      </dl>
      {d.items.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.items.map((s) => (
            <div key={s.id}>
              <StayCardView s={s} />
              {s.freeDuring != null ? <p className="mt-1 text-xs text-muted">{s.freeDuring ? `${s.freeDuring} logement${s.freeDuring > 1 ? "s" : ""} libre${s.freeDuring > 1 ? "s" : ""} sur ces dates` : "Complet sur ces dates"}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-muted">Pas encore de résidence publiée près de {e.venue}. <Link href="/annonces?transaction=furnished" className="font-semibold text-ink underline">Voir toutes les résidences</Link></div>
      )}
      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-xl font-bold text-ink">Questions fréquentes</h2>
        {faq.map((x) => <details key={x.q} className="mt-3 rounded-xl bg-white p-4 ring-1 ring-slate-200"><summary className="cursor-pointer font-semibold text-ink">{x.q}</summary><p className="mt-2 text-muted">{x.a}</p></details>)}
      </section>
      <div className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/ou-dormir" className="rounded-full border border-slate-300 px-3 py-1.5 text-ink hover:border-ink">Autres événements</Link>
        <Link href="/prix-nuitee" className="rounded-full border border-slate-300 px-3 py-1.5 text-ink hover:border-ink">Prix de la nuitée par commune</Link>
      </div>
    </div>
  );
}
