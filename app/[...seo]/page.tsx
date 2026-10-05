import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeoLinks, getSeoPage, searchHref, seoLinkLabel } from "@/lib/seo";
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
            propertyType: f.propertyType, q: f.q, priceMin: f.priceMin, priceMax: f.priceMax,
            perPage: page.perPage, sort: page.sort ?? undefined,
          });
    items = res.items; total = res.total;
  } catch { /* annonces indisponibles : la page et son texte restent affichés */ }

  // Modèle d'affichage : celui de cette page SEO, sinon de la zone, sinon de l'onglet.
  const tpl = await layoutFor([`seo:${page.slug}`, f.q ? `zone:${zoneSlug(f.q)}` : null, `search:${f.transaction ?? "all"}`]);
  const classic = f.transaction !== "furnished" && f.transaction !== "event";
  const tx = f.transaction === "rent" || f.transaction === "sale" ? f.transaction : undefined;
  const mapItems = hasMap(tpl) && classic && items.length
    ? (await listListingsPage({ transaction: tx, propertyType: f.propertyType, q: f.q, priceMin: f.priceMin, priceMax: f.priceMax, perPage: 100, map: true, listingKind: "classic" }).catch(() => ({ items: [] as Property[] }))).items
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

  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "/" },
        { "@type": "ListItem", position: 2, name: page.title, item: `/${page.slug}` },
      ],
    },
    items.length ? {
      "@context": "https://schema.org", "@type": "ItemList", name: page.title,
      itemListElement: items.slice(0, 20).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: p.href, name: p.title })),
    } : null,
  ].filter(Boolean);

  return (
    <div className="container-page py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Fil d’Ariane" className="text-sm text-muted">
        <Link href="/" className="hover:text-ink hover:underline">Accueil</Link>
        <span className="mx-2">›</span>
        <span className="text-ink">{page.title}</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{page.title}</h1>
      {page.intro ? <div className="rich-text mt-3 max-w-3xl text-muted" dangerouslySetInnerHTML={{ __html: page.intro }} /> : null}

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
