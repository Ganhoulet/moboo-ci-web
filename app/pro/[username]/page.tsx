import { ProReviewsSection } from "@/components/pro-reviews/pro-reviews-section";
import { Stars } from "@/components/reviews";
import { getProReviews, slugZone } from "@/lib/pro-reviews";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { formatXOF, getPro, type ProClosedDeal } from "@/lib/api";
import { accountLabel } from "@/lib/accounts";
import { getSiteSettings, roleNames } from "@/lib/settings";
import { VerifiedBadge } from "@/components/verified-badge";
import { mapListing } from "@/lib/property";
import { PropertyCard } from "@/components/property-card";
import { ReportButton } from "@/components/report-button";
import { img } from "@/lib/img";
import { getSession } from "@/lib/session";
import { MediaGallery } from "@/components/pro-page/media-gallery";
import { ListingTabs } from "@/components/pro-page/listing-tabs";
import { ContactForm } from "@/components/pro-page/contact-card";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const p = await getPro(params.username);
  if (!p) return { title: "Profil" };
  const r = await getProReviews(p.username);
  const zones = (p.serviceAreas ?? []).slice(0, 3).join(", ");
  const rating = r?.aggregates.nb_avis && r.aggregates.assez_d_avis ? ` Note ${r.aggregates.note_globale.toLocaleString("fr-FR")}/5 (${r.aggregates.nb_avis} avis).` : "";
  const label = p.profile?.title || accountLabel(p, roleNames(await getSiteSettings()));
  const description = `${p.name} — ${label} sur Moboo.ci${zones ? ` à ${zones}` : ""}.${rating} ${p.listings.length} annonce(s) en ligne${p.stats?.closedTotal ? `, ${p.stats.closedTotal} transaction(s) réalisée(s)` : ""}.`;
  return {
    title: `${p.name} · ${label}`, description, alternates: { canonical: `/pro/${p.canonical || p.username}` },
    openGraph: { title: p.name, description, images: p.avatarUrl ? [p.avatarUrl] : undefined },
  };
}

/** Montant court : 45 M, 350 k (chiffres de la page pro). */
function short(n: number | null | undefined) {
  if (!n) return "—";
  if (n >= 1e9) return `${(n / 1e9).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Md`;
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (n >= 1e3) return `${Math.round(n / 1e3).toLocaleString("fr-FR")} k`;
  return n.toLocaleString("fr-FR");
}

function Fact({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
      <p className="font-display text-xl font-extrabold text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function Section({ id, title, children, aside }: { id?: string; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-200 py-10 first:border-t-0 first:pt-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-2xl font-extrabold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ClosedCard({ d }: { d: ProClosedDeal }) {
  const sold = d.status === "SOLD" || d.transaction === "sale";
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="relative aspect-[4/3] bg-slate-100">
        {d.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(d.photo, 480)} alt="" loading="lazy" className="h-full w-full object-cover grayscale-[35%]" />
        ) : null}
        <span className={"absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow " + (sold ? "bg-rose-600" : "bg-violet-600")}>{sold ? "Vendu" : "Loué"}</span>
      </div>
      <div className="p-4">
        <p className="font-display text-lg font-extrabold text-ink">{formatXOF(d.price)}{sold ? "" : <span className="text-sm font-semibold text-muted"> /mois</span>}</p>
        <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{d.title}</p>
        <p className="mt-1 text-xs text-muted">{d.place}{d.place ? " · " : ""}{new Date(d.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
      </div>
    </article>
  );
}

export default async function ProPage({ params }: { params: { username: string } }) {
  const p = await getPro(params.username);
  if (!p) notFound();
  // Agent repris de moboo.ci qui a depuis créé son compte : une seule fiche.
  if (p.canonical && p.canonical !== p.username) permanentRedirect(`/pro/${p.canonical}`);
  const [reviews, settings] = await Promise.all([getProReviews(p.username), getSiteSettings()]);
  const agg = reviews?.enabled && reviews.aggregates.nb_avis && reviews.aggregates.assez_d_avis ? reviews.aggregates : null;
  const zones = p.serviceAreas ?? [];
  const names = roleNames(settings);
  const prof = p.profile;
  const stats = p.stats;
  const isAgency = p.accountType === "entreprise";
  const title = prof?.title || p.position || accountLabel(p, names);
  const first = p.firstName || p.name.split(" ")[0];
  const wa = (p.whatsapp || "").replace(/[^0-9]/g, "");
  const waLink = wa ? `https://wa.me/${wa.startsWith("225") ? wa : "225" + wa}?text=${encodeURIComponent(`Bonjour ${first}, je vous contacte depuis votre page Moboo.ci.`)}` : null;
  const socials = [
    { k: "website", l: "Site web", v: p.website }, { k: "facebook", l: "Facebook", v: p.facebook },
    { k: "instagram", l: "Instagram", v: p.instagram }, { k: "tiktok", l: "TikTok", v: p.tiktok },
    { k: "linkedin", l: "LinkedIn", v: p.linkedin },
  ].filter((s) => s.v);
  const sale = p.listings.filter((l) => l.transaction === "sale");
  const rent = p.listings.filter((l) => l.transaction !== "sale");
  const closed = p.closed ?? [];
  const media = prof?.media ?? [];
  const me = getSession();
  const memberYear = new Date(p.memberSince).getFullYear();

  const grid = (items: typeof p.listings) => (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map((l) => <PropertyCard key={l.id} p={mapListing(l)} />)}</div>
  );

  const jsonLd = {
    "@context": "https://schema.org", "@type": isAgency ? "RealEstateAgent" : ["RealEstateAgent", "Person"], name: p.name,
    jobTitle: isAgency ? undefined : title, image: p.avatarUrl || undefined, telephone: p.phone || undefined, url: `https://moboo.ci/pro/${p.username}`,
    worksFor: p.agency ? { "@type": "RealEstateAgent", name: p.agency.name } : undefined,
    knowsLanguage: prof?.languages?.length ? prof.languages : undefined,
    areaServed: zones.length ? zones.map((z) => ({ "@type": "Place", name: z })) : undefined,
    address: p.commune || p.city ? { "@type": "PostalAddress", addressLocality: p.commune || p.city, addressCountry: "CI" } : undefined,
    aggregateRating: agg ? { "@type": "AggregateRating", ratingValue: agg.note_globale, reviewCount: agg.nb_avis, bestRating: 5 } : undefined,
  };

  return (
    <div className="bg-white pb-24 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Bandeau : image de couverture choisie par le pro, sinon dégradé de marque. */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 sm:h-56">
        {prof?.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(prof.coverUrl, 1600)} alt="" className="h-full w-full object-cover" />
        ) : <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_60%,white_0,transparent_35%)]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="container-page">
        <nav className="hidden pt-4 text-sm text-muted lg:block lg:pl-[392px]" aria-label="Fil d’Ariane">
          <Link href="/agents-immobiliers" className="hover:text-ink hover:underline">Agents et agences</Link>
          {zones[0] ? <>{" › "}<Link href={`/agents-immobiliers/${slugZone(zones[0])}`} className="hover:text-ink hover:underline">{zones[0]}</Link></> : null}
          {" › "}<span className="text-ink">{p.name}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-8">
          {/* ─── Colonne profil (sticky, façon Zillow) ─── */}
          <aside className="-mt-24 lg:-mt-32">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-3xl bg-white p-6 shadow-[0_6px_30px_rgba(15,23,42,0.12)] ring-1 ring-slate-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img(p.avatarUrl, 320)} alt={p.name} className={"h-32 w-32 object-cover shadow-md ring-4 ring-white " + (isAgency ? "rounded-3xl" : "rounded-full")} />
                    ) : (
                      <span className={"grid h-32 w-32 place-items-center bg-brand-800 font-display text-5xl font-extrabold text-white ring-4 ring-white " + (isAgency ? "rounded-3xl" : "rounded-full")}>{p.name.charAt(0).toUpperCase()}</span>
                    )}
                    {p.verified || p.businessVerified ? (
                      <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white ring-4 ring-white" title="Profil vérifié par Moboo">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden><path d="m5 12 5 5 9-10" /></svg>
                      </span>
                    ) : null}
                  </div>
                  <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-ink">{p.name}</h1>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{title}</p>
                  {p.agency ? (
                    <Link href={`/pro/${p.agency.username}`} className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                      {p.agency.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img(p.agency.avatarUrl, 64)} alt="" className="h-5 w-5 rounded object-cover" />
                      ) : null}
                      {p.agency.name}
                    </Link>
                  ) : p.company ? <p className="mt-1 text-sm text-muted">{p.company}</p> : null}
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {p.verified ? <VerifiedBadge /> : null}
                    {p.businessVerified ? <VerifiedBadge kind="business" /> : null}
                  </div>
                  {agg ? (
                    <a href="#avis" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline">
                      <Stars value={agg.note_globale} /> {agg.note_globale.toLocaleString("fr-FR")} <span className="font-normal text-muted">({agg.nb_avis} avis)</span>
                    </a>
                  ) : null}
                  {prof?.tagline ? <p className="mt-3 text-sm italic text-slate-600">« {prof.tagline} »</p> : null}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Fact value={prof?.experienceYears != null ? `${prof.experienceYears} an${prof.experienceYears > 1 ? "s" : ""}` : `${new Date().getFullYear() - memberYear || "<1"} an`} label={prof?.experienceYears != null ? "Expérience" : "Sur Moboo"} />
                  <Fact value={stats?.closedLast12 ?? 0} label="Transactions 12 mois" />
                  <Fact value={p.listings.length} label="Annonces" />
                </div>

                {prof?.licenseNumber ? (
                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-dashed border-slate-300 px-4 py-2.5 text-sm">
                    <span className="text-muted">Référence de l’agent</span>
                    <span className="font-mono font-bold text-ink">{prof.licenseNumber}</span>
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {p.phone ? <a href={`tel:${p.phone}`} className="flex items-center justify-center gap-2 rounded-xl border border-ink py-2.5 text-sm font-bold text-ink transition hover:bg-slate-50">📞 Appeler</a> : null}
                  {waLink ? <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-bold text-white transition hover:brightness-105">WhatsApp</a> : null}
                </div>

                <div id="contact" className="mt-5 scroll-mt-24 border-t border-slate-100 pt-5">
                  <p className="mb-3 font-display text-base font-bold text-ink">{isAgency ? "Contacter l’agence" : `Contacter ${first}`}</p>
                  <ContactForm username={p.username} firstName={isAgency ? p.name : first} defaults={me ? { name: [me.firstName, me.lastName].filter(Boolean).join(" "), phone: me.phone } : undefined} />
                </div>
              </div>

              {(prof?.languages?.length || zones.length) ? (
                <div className="mt-4 hidden space-y-3 rounded-3xl border border-slate-200 p-5 text-sm lg:block">
                  {prof?.languages?.length ? <p><span className="font-semibold text-ink">Langues : </span><span className="text-slate-600">{prof.languages.join(", ")}</span></p> : null}
                  {zones.length ? <p><span className="font-semibold text-ink">Zones : </span><span className="text-slate-600">{zones.slice(0, 6).join(", ")}{zones.length > 6 ? "…" : ""}</span></p> : null}
                </div>
              ) : null}
            </div>
          </aside>

          {/* ─── Contenu ─── */}
          <main className="min-w-0 pt-8 lg:pt-6">
            {media.length ? (
              <section className="pb-10">
                <MediaGallery media={media} name={p.name} />
              </section>
            ) : null}

            {stats && (stats.closedTotal || p.listings.length) ? (
              <section className="pb-10">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { v: stats.closedTotal, l: "Transactions réalisées", s: `${stats.sold} vente(s) · ${stats.rented} location(s)` },
                    { v: stats.closedLast12, l: "Sur 12 mois", s: "ventes et locations" },
                    { v: stats.priceMin ? `${short(stats.priceMin)} – ${short(stats.priceMax)}` : "—", l: "Fourchette de prix", s: "biens à vendre (FCFA)" },
                    { v: short(stats.avgSale), l: "Prix moyen vendu", s: "FCFA" },
                  ].map((x) => (
                    <div key={x.l} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-display text-2xl font-extrabold text-ink">{x.v}</p>
                      <p className="mt-1 text-sm font-semibold text-ink">{x.l}</p>
                      <p className="text-xs text-muted">{x.s}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {p.bio || prof?.specialties?.length ? (
              <Section id="a-propos" title={`À propos de ${isAgency ? p.name : first}`}>
                {p.bio ? <p className="max-w-3xl whitespace-pre-line leading-relaxed text-slate-700">{p.bio}</p> : null}
                {prof?.specialties?.length ? (
                  <div className="mt-6">
                    <p className="mb-2 text-sm font-semibold text-ink">Spécialités</p>
                    <ul className="flex flex-wrap gap-2">{prof.specialties.map((s) => <li key={s} className="rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-slate-700">{s}</li>)}</ul>
                  </div>
                ) : null}
              </Section>
            ) : null}

            <Section id="annonces" title="Annonces et transactions">
              <ListingTabs tabs={[
                { key: "sale", label: "À vendre", count: sale.length, content: grid(sale) },
                { key: "rent", label: "À louer", count: rent.length, content: grid(rent) },
                { key: "closed", label: "Vendus et loués", count: closed.length, content: <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{closed.map((d) => <ClosedCard key={d.id} d={d} />)}</div> },
              ]} />
            </Section>

            {p.team?.length ? (
              <Section id="equipe" title={`L’équipe (${p.team.length})`}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {p.team.map((t) => (
                    <Link key={t.username} href={`/pro/${t.username}`} className="group rounded-2xl border border-slate-200 p-4 text-center transition hover:shadow-card">
                      {t.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img(t.avatarUrl, 200)} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />
                      ) : <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-100 font-display text-2xl font-bold text-brand-800">{t.name.charAt(0)}</span>}
                      <p className="mt-3 font-semibold text-ink group-hover:underline">{t.name}</p>
                      <p className="text-xs text-muted">{t.title || "Agent immobilier"}{t.verified ? " · ✓ vérifié" : ""}</p>
                    </Link>
                  ))}
                </div>
              </Section>
            ) : null}

            {zones.length ? (
              <Section title="Zones d’intervention">
                <ul className="flex flex-wrap gap-2">
                  {zones.map((z) => <li key={z}><Link href={`/agents-immobiliers/${slugZone(z)}`} className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-ink transition hover:border-ink hover:bg-slate-50">📍 {z}</Link></li>)}
                </ul>
              </Section>
            ) : null}

            <section id="avis" className="scroll-mt-24 border-t border-slate-200 py-10">
              <div className="max-w-3xl"><ProReviewsSection refId={p.username} path={`/pro/${p.username}`} name={p.name} /></div>
            </section>

            <Section title="Informations professionnelles">
              <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                {[
                  ["Référence de l’agent", prof?.licenseNumber],
                  [isAgency ? "Agence" : "Agence de rattachement", isAgency ? p.name : p.agency?.name || p.company],
                  ["Adresse du bureau", prof?.officeAddress],
                  ["En activité depuis", prof?.experienceSince ? String(prof.experienceSince) : null],
                  ["Langues", prof?.languages?.join(", ")],
                  ["Membre Moboo depuis", p.legacy ? null : String(memberYear)],
                  ["Localisation", [p.commune, p.city].filter(Boolean).join(", ")],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string} className="border-b border-slate-100 pb-3"><dt className="text-muted">{k}</dt><dd className="mt-0.5 font-semibold text-ink">{v}</dd></div>
                ))}
              </dl>
              {socials.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {socials.map((s) => <a key={s.k} href={s.v!} target="_blank" rel="noopener noreferrer nofollow" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50">{s.l} ↗</a>)}
                </div>
              ) : null}
              {settings.moderation.reportsEnabled && !p.legacy ? <div className="mt-8"><ReportButton targetType="account" targetId={p.username} /></div> : null}
            </Section>
          </main>
        </div>
      </div>

      {/* Barre de contact mobile (façon Airbnb). */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-ink">{p.name}</p><p className="truncate text-xs text-muted">{title}</p></div>
        {waLink ? <a href={waLink} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white">WhatsApp</a> : null}
        <a href="#contact" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white">Contacter</a>
      </div>
    </div>
  );
}
