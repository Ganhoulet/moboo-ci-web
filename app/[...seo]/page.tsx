import type { Metadata } from "next";
import { breadcrumbLd } from "@/lib/structured-data";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeoInsights, getSeoLinks, getSeoPage, searchHref, seoLinkLabel, type SeoInsights } from "@/lib/seo";
import { getPriceCommunes } from "@/lib/prices";
import { getZones } from "@/lib/pro-reviews";
import { espacesPage, listListingsPage, residencesPage } from "@/lib/property";
import { ResultsView } from "@/components/results-view";
import { hasMap, layoutFor, zoneSlug } from "@/lib/result-layouts";
import { getSiteSettings } from "@/lib/settings";
import type { Property } from "@/lib/property";

export const revalidate = 60;

const slugOf = (parts: string[]) => parts.map((s) => decodeURIComponent(s)).join("/").toLowerCase();

export async function generateMetadata({ params }: { params: { seo: string[] } }): Promise<Metadata> {
  const p = await getSeoPage(slugOf(params.seo));
  if (!p || p.kind !== "landing") return {};
  const { branding } = await getSiteSettings();
  const title = p.seoTitle || `${p.title} | ${branding.siteName}`;
  return {
    title: { absolute: title },
    description: p.metaDescription || undefined,
    alternates: { canonical: p.canonical || `/${p.slug}` },
    robots: p.noindex ? { index: false, follow: true } : undefined,
    openGraph: { title, description: p.metaDescription || undefined, url: `/${p.slug}`, type: "website", images: p.ogImage ? [p.ogImage] : undefined },
  };
}

/** Page d'atterrissage SEO (ex. /maisons-a-louer-cocody) : annonces filtrées + texte optimisé. */
export default async function SeoLandingPage({ params }: { params: { seo: string[] } }) {
  const slug = slugOf(params.seo);
  const [page, links] = await Promise.all([getSeoPage(slug), getSeoLinks()]);
  if (!page || page.kind !== "landing") notFound();
  // Page du générateur SEO : chiffres réels, guide du quartier, FAQ, maillage interne.
  const gen = page.source === "generator";
  const [ins, priceZones, agentZones] = gen
    ? await Promise.all([getSeoInsights(page.slug), getPriceCommunes().catch(() => null), getZones().catch(() => [])])
    : [null, null, []];

  const f = page.filters ?? {};
  let items: Property[] = [];
  let total = 0;
  try {
    const res = f.transaction === "furnished"
      ? await residencesPage({ q: f.q, perPage: page.perPage, priceMax: f.priceMax })
      : f.transaction === "event"
        ? await espacesPage({ q: f.q, perPage: page.perPage, priceMax: f.priceMax })
        : await listListingsPage({
            transaction: f.transaction === "rent" || f.transaction === "sale" ? f.transaction : undefined,
            propertyType: f.propertyType, q: f.q, priceMin: f.priceMin, priceMax: f.priceMax, bedrooms: f.bedrooms,
            perPage: page.perPage, sort: page.sort ?? undefined,
          });
    items = res.items; total = res.total;
  } catch { /* annonces indisponibles : la page et son texte restent affichés */ }

  // Modèle d'affichage : celui de cette page SEO, sinon de la zone, sinon de l'onglet.
  const tpl = await layoutFor([`seo:${page.slug}`, f.q ? `zone:${zoneSlug(f.q)}` : null, `search:${f.transaction ?? "all"}`]);
  const classic = f.transaction !== "furnished" && f.transaction !== "event";
  const tx = f.transaction === "rent" || f.transaction === "sale" ? f.transaction : undefined;
  const mapItems = hasMap(tpl) && classic && items.length
    ? (await listListingsPage({ transaction: tx, propertyType: f.propertyType, q: f.q, priceMin: f.priceMin, priceMax: f.priceMax, bedrooms: f.bedrooms, perPage: 100, map: true, listingKind: "classic" }).catch(() => ({ items: [] as Property[] }))).items
    : [];
  const mapQuery = new URLSearchParams(Object.entries({ transaction: tx, q: f.q, propertyType: f.propertyType, priceMin: f.priceMin ? String(f.priceMin) : undefined, priceMax: f.priceMax ? String(f.priceMax) : undefined })
    .filter(([, v]) => v) as [string, string][]).toString();
  const { maps } = await getSiteSettings();

  const landing = links.filter((l) => l.kind === "landing" && l.slug !== page.slug && !l.noindex);
  const related = [
    ...landing.filter((l) => page.hubColumn && l.hubColumn === page.hubColumn),
    ...landing.filter((l) => page.hubTab && l.hubTab === page.hubTab && l.hubColumn !== page.hubColumn),
  ].slice(0, 16);
  const more = searchHref(f);

  const crumbs = genCrumbs(page.slug, page.title, ins);
  const jsonLd = [
    breadcrumbLd(crumbs.map((c) => ({ label: c.name, href: c.href }))),
    ins?.faq.length ? {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: ins.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
    } : null,
    items.length ? {
      "@context": "https://schema.org", "@type": "ItemList", name: page.title,
      itemListElement: items.slice(0, 20).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: p.href, name: p.title })),
    } : null,
  ].filter(Boolean);

  return (
    <div className="container-page py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Fil d’Ariane" className="text-sm text-muted">
        {crumbs.map((c, i) => (
          <span key={c.href}>
            {i ? <span className="mx-2">›</span> : null}
            {i < crumbs.length - 1 ? <Link href={c.href} className="hover:text-ink hover:underline">{c.name}</Link> : <span className="text-ink">{c.name}</span>}
          </span>
        ))}
      </nav>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{page.title}</h1>
      {page.intro ? <div className="rich-text mt-3 max-w-3xl text-muted" dangerouslySetInnerHTML={{ __html: page.intro }} />
        : ins?.intro ? <p className="mt-3 max-w-3xl text-muted">{ins.intro}</p> : null}
      {ins ? <GenFacts ins={ins} slug={page.slug} /> : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{total ? `${total.toLocaleString("fr-FR")} annonce${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}` : "Aucune annonce pour le moment"}</p>
        <Link href={more} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-ink hover:border-ink">Affiner la recherche →</Link>
      </div>

      {items.length ? (
        <ResultsView items={items} tpl={tpl} mapSettings={maps} mapItems={mapItems} query={mapQuery} mapEnabled={hasMap(tpl) && classic} />
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="font-semibold text-ink">De nouvelles annonces arrivent chaque jour.</p>
          <p className="mt-1 text-sm text-muted">Créez une alerte depuis la recherche pour être prévenu.</p>
          <Link href={more} className="btn-primary mt-4 inline-flex bg-ink hover:bg-black">Voir la recherche</Link>
        </div>
      )}
      {total > items.length ? (
        <div className="mt-8 text-center">
          <Link href={more} className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-black">Voir les {total.toLocaleString("fr-FR")} annonces</Link>
        </div>
      ) : null}

      {page.content ? (
        <section className="mt-14 border-t border-slate-200 pt-10">
          <div className="rich-text mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: page.content }} />
        </section>
      ) : null}

      {ins ? <GenSections ins={ins} slug={page.slug} pricePage={!!priceZones?.some((z) => z.slug === ins.zone.slug)} agentsPage={agentZones.some((z) => z.slug === ins.zone.slug && z.indexable !== false)} /> : null}

      {related.length ? (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="font-display text-lg font-bold text-ink">Recherches similaires</h2>
          <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((l) => <li key={l.slug}><Link href={`/${l.slug}`} className="text-sm text-brand-800 hover:underline">{seoLinkLabel(l)}</Link></li>)}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
const TX_CRUMB: Record<string, { name: string; href: string }> = {
  rent: { name: "Location", href: "/annonces?transaction=rent" },
  sale: { name: "Vente", href: "/annonces?transaction=sale" },
  furnished: { name: "Résidences meublées", href: "/annonces?transaction=furnished" },
  event: { name: "Espaces événementiels", href: "/annonces?transaction=event" },
};

/** Fil d'Ariane : Accueil › Location › Immobilier à Cocody › page. */
function genCrumbs(slug: string, title: string, ins: SeoInsights | null) {
  const out = [{ name: "Accueil", href: "/" }];
  if (ins && TX_CRUMB[ins.tx]) out.push(TX_CRUMB[ins.tx]);
  if (ins?.hub && ins.hub !== slug && ins.sameZone.some((p) => p.slug === ins.hub)) out.push({ name: `Immobilier à ${ins.zone.name}`, href: `/${ins.hub}` });
  out.push({ name: title.replace(/ : prix, annonces et vie de quartier$/, ""), href: `/${slug}` });
  return out;
}

/** Repères chiffrés de la page (annonces, prix médian, fourchette, annonceurs) et accès par nombre de chambres. */
function GenFacts({ ins, slug }: { ins: SeoInsights; slug: string }) {
  const unit = ins.tx === "rent" || ins.tx === "hub" ? " / mois" : "";
  const facts = [
    { k: "Annonces en ligne", v: ins.count.toLocaleString("fr-FR") },
    ins.median ? { k: ins.tx === "sale" ? "Prix médian" : "Loyer médian", v: `${fcfa(ins.median)}${unit}` } : null,
    ins.p25 && ins.p75 && ins.p25 < ins.p75 ? { k: "La moitié des biens entre", v: `${fcfa(ins.p25)} et ${fcfa(ins.p75)}` } : null,
    ins.agencies > 1 ? { k: "Agences et propriétaires", v: String(ins.agencies) } : null,
  ].filter(Boolean) as { k: string; v: string }[];
  const have = new Set(ins.sameZone.map((p) => p.slug));
  const bed = (n: number) => `${slug}/${n === 1 ? "1-chambre" : n >= 4 ? "4-chambres-et-plus" : `${n}-chambres`}`;
  const beds = ins.mod ? [] : ins.bedrooms.filter((b) => have.has(bed(b.bedrooms)));
  if (!facts.length) return null;
  return (
    <div className="mt-5 space-y-3">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.k} className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <dt className="text-xs text-muted">{f.k}</dt>
            <dd className="mt-0.5 font-display text-base font-bold text-ink">{f.v}</dd>
          </div>
        ))}
      </dl>
      {beds.length ? (
        <div className="flex flex-wrap gap-2">
          {beds.map((b) => (
            <Link key={b.bedrooms} href={`/${bed(b.bedrooms)}`} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-ink hover:border-ink">
              {b.bedrooms >= 4 ? "4 chambres et +" : `${b.bedrooms} chambre${b.bedrooms > 1 ? "s" : ""}`} <span className="text-muted">({b.count})</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const GUIDE_TITLES: [string, string][] = [
  ["vivre", "Vivre à {z}"], ["ecoles", "Écoles et universités"], ["transports", "Transports et accès"],
  ["securite", "Sécurité"], ["commerces", "Commerces, restaurants et loisirs"], ["investir", "Investir à {z}"],
];
const TX_GROUP: Record<string, string> = { hub: "Quartier", rent: "À louer", sale: "À vendre", furnished: "Meublés", event: "Espaces" };

/** Guide du quartier, FAQ et liens internes (même zone, autres zones de la ville, prix, agents). */
function GenSections({ ins, slug, pricePage, agentsPage }: { ins: SeoInsights; slug: string; pricePage: boolean; agentsPage: boolean }) {
  const z = ins.zone.name;
  const groups = new Map<string, SeoInsights["sameZone"]>();
  for (const p of ins.sameZone) {
    const k = TX_GROUP[p.tx ?? ""] ?? "Autres";
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  const extra = [
    pricePage ? { href: `/prix-immobilier/${ins.zone.slug}`, label: `Prix de l’immobilier à ${z}` } : null,
    agentsPage ? { href: `/agents-immobiliers/${ins.zone.slug}`, label: `Agents immobiliers à ${z}` } : null,
  ].filter(Boolean) as { href: string; label: string }[];
  const g = ins.guide;
  return (
    <>
      {g ? (
        <section className="mt-14 border-t border-slate-200 pt-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-ink">{ins.tx === "hub" ? `Le quartier ${z}` : `Bien vivre à ${z}`}</h2>
            {g.image ? <img src={g.image} alt={z} className="mt-4 aspect-[2/1] w-full rounded-2xl object-cover" loading="lazy" /> : null}
            {g.summary ? <div className="rich-text mt-4" dangerouslySetInnerHTML={{ __html: g.summary }} /> : null}
            {(ins.tx === "hub" ? GUIDE_TITLES : GUIDE_TITLES.slice(0, 3)).map(([k, t]) => g.sections?.[k] ? (
              <div key={k} className="mt-6">
                <h3 className="font-display text-lg font-bold text-ink">{t.replace("{z}", z)}</h3>
                <div className="rich-text mt-2" dangerouslySetInnerHTML={{ __html: g.sections[k] }} />
              </div>
            ) : null)}
            {ins.tx !== "hub" && ins.hub ? <Link href={`/${ins.hub}`} className="mt-4 inline-block text-sm font-semibold text-brand-800 hover:underline">Tout savoir sur {z} →</Link> : null}
          </div>
        </section>
      ) : null}

      {ins.videos?.length ? (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="font-display text-xl font-bold text-ink">{z} en vidéo</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ins.videos.map((v) => (
              <figure key={v.videoId} className="overflow-hidden rounded-2xl bg-black ring-1 ring-slate-200">
                <iframe src={`https://www.tiktok.com/embed/v2/${v.videoId}`} title={v.title || `Vidéo ${z}`} loading="lazy" allow="encrypted-media; fullscreen" className="aspect-[9/16] w-full" />
                {v.title ? <figcaption className="bg-white px-3 py-2 text-sm text-ink">{v.title}</figcaption> : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {ins.faq.length ? (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-xl font-bold text-ink">Questions fréquentes</h2>
            <div className="mt-4 divide-y divide-slate-200 rounded-2xl ring-1 ring-slate-200">
              {ins.faq.map((x) => (
                <details key={x.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold text-ink marker:hidden">{x.q}</summary>
                  <p className="mt-2 text-sm text-muted">{x.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {groups.size || ins.nearby.length || extra.length ? (
        <section className="mt-12 border-t border-slate-200 pt-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {groups.size ? (
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{ins.zone.level === "pays" ? "Partout en Côte d’Ivoire" : `Aussi à ${z}`}</h2>
                {[...groups.entries()].map(([k, list]) => (
                  <div key={k} className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p>
                    <ul className="mt-1 space-y-1">
                      {list.filter((p) => p.slug !== slug).slice(0, 10).map((p) => <li key={p.slug}><Link href={`/${p.slug}`} className="text-sm text-brand-800 hover:underline">{p.title.replace(/ : prix, annonces et vie de quartier$/, "")}</Link> <span className="text-xs text-muted">({p.count})</span></li>)}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
            {ins.nearby.length ? (
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Ailleurs à {ins.zone.city || "proximité"}</h2>
                <ul className="mt-3 space-y-1">
                  {ins.nearby.map((p) => <li key={p.slug}><Link href={`/${p.slug}`} className="text-sm text-brand-800 hover:underline">{p.title}</Link> <span className="text-xs text-muted">({p.count})</span></li>)}
                </ul>
              </div>
            ) : null}
            {extra.length ? (
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Pour aller plus loin</h2>
                <ul className="mt-3 space-y-1">
                  {extra.map((l) => <li key={l.href}><Link href={l.href} className="text-sm text-brand-800 hover:underline">{l.label}</Link></li>)}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
