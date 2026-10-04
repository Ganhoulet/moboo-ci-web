import Link from "next/link";
import { getSeoLinks, seoLinkLabel } from "@/lib/seo";
import { SeoLinks, type LinkTab } from "./seo-links";
import { getCampaigns } from "@/lib/marketing";
import { SiteBanners } from "@/components/marketing/site-banners";
import { blockDef, type Section } from "@/lib/page-blocks";
import { listListingsPage, residencesPage, espacesPage, type Property } from "@/lib/property";
import { getPartners } from "@/lib/community";
import { getSiteSettings } from "@/lib/settings";
import type { HomeData } from "@/lib/pages";
import { Carousel } from "./carousel";
import { PropertyTile } from "./property-tile";
import { HeroSearch } from "./hero-search";
import { LoanCalculator } from "./calculator";
import { Faq } from "./faq";
import { img as optimized, imgProps } from "@/lib/img";
const imgSmall = (u: string | null | undefined) => optimized(u, 320);

type P = Record<string, any>;
const BG: Record<string, string> = { white: "bg-white", soft: "bg-slate-50", brand: "bg-brand-900 text-white" };
const TYPE_ICON: Record<string, string> = {
  appartement: "🏢", maison: "🏠", villa: "🏡", studio: "🛋️", duplex: "🏘️", terrain: "🌳", bureau: "💼",
  magasin: "🏪", entrepot: "🏭", immeuble: "🏙️", autre: "✨",
};

function Head({ title, subtitle, href, dark }: { title?: string; subtitle?: string; href?: string; dark?: boolean }) {
  if (!title && !subtitle) return null;
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {title ? <h2 className={"font-display text-2xl font-extrabold tracking-tight sm:text-[28px] " + (dark ? "text-white" : "text-ink")}>{title}</h2> : null}
        {subtitle ? <p className={"mt-1 " + (dark ? "text-white/75" : "text-muted")}>{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className={"shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition " + (dark ? "border-white/30 text-white hover:bg-white/10" : "border-slate-300 text-ink hover:border-ink")}>
          Tout voir
        </Link>
      ) : null}
    </div>
  );
}

function Shell({ s, children, pad = "py-12 sm:py-16", edit }: { s: Section; children: React.ReactNode; pad?: string; edit?: boolean }) {
  const bg = BG[s.props.background as string] ?? "bg-white";
  return (
    <section id={`section-${s.id}`} className={`group/section relative ${bg} ${pad}`}>
      {edit ? (
        <Link href={`/admin/accueil?section=${encodeURIComponent(s.id)}`}
          className="absolute right-3 top-3 z-20 hidden items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg group-hover/section:inline-flex">
          ✎ Modifier « {blockDef(s.type)?.label} »
        </Link>
      ) : null}
      {edit ? <span aria-hidden className="pointer-events-none absolute inset-1 z-10 hidden rounded-xl ring-2 ring-accent-500/60 group-hover/section:block" /> : null}
      <div className="container-page">{children}</div>
    </section>
  );
}

function Tiles({ items, layout, label }: { items: Property[]; layout: string; label: string }) {
  if (!items.length) return <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-muted">Aucune annonce pour ces critères pour le moment.</p>;
  if (layout === "grid") {
    return <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((p) => <PropertyTile key={p.id} p={p} />)}</div>;
  }
  return (
    <Carousel label={label}>
      {items.map((p) => <PropertyTile key={p.id} p={p} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[calc(25%-15px)]" />)}
    </Carousel>
  );
}

/* ─── Blocs ──────────────────────────────────────────────────────────────── */

async function Hero({ s, data }: { s: Section; data: HomeData }) {
  const p: P = s.props;
  const img = (p.images as { url: string }[] | undefined)?.find((x) => x?.url)?.url;
  const types = data.types.length ? data.types : [];
  return (
    <section id={`section-${s.id}`} className="relative isolate z-20">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img {...imgProps(img, { width: 1600, sizes: "100vw" })} alt="" fetchPriority="high" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,#3b5bdb_0%,#1e3a8a_45%,#0f1f4d_100%)]" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/25 to-black/45" />
      <div className="container-page flex min-h-[480px] flex-col items-center justify-center py-16 text-center text-white sm:min-h-[560px]">
        <h1 className="max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">{p.title}</h1>
        {p.subtitle ? <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">{p.subtitle}</p> : null}
        <div className="mt-8 w-full"><HeroSearch tabs={p.tabs ?? []} placeholder={p.placeholder ?? ""} types={types.map((t) => ({ slug: t.slug, label: t.label }))} places={Array.from(new Set([...data.areas.map((a) => a.label), ...data.cities.map((c) => c.label)])).slice(0, 12)} /></div>
        {(p.chips as { label: string; href: string }[] | undefined)?.length ? (
          <div className="mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
            {(p.chips as { label: string; href: string }[]).filter((c) => c.label && c.href).map((c) => (
              <Link key={c.label} href={c.href} className="rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25">{c.label}</Link>
            ))}
          </div>
        ) : null}
        {p.showStats && data.totals.listings ? (
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/85">
            {liveCounts(data, true).map((c) => (
              <span key={c.label}><strong className="text-white">{c.value}</strong> {c.label}</span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const TYPE_NAME: Record<string, string> = {
  appartement: "Appartements", maison: "Maisons", villa: "Villas", studio: "Studios", duplex: "Duplex", terrain: "Terrains",
  bureau: "Bureaux", magasin: "Magasins", entrepot: "Entrepôts", immeuble: "Immeubles", autre: "Autres biens",
};
const niceLabel = (slug: string, label: string) =>
  label && label !== slug ? label : TYPE_NAME[slug] ?? (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "));

/**
 * Bande des types de bien : grandes cartes quand il y en a peu, qui se
 * resserrent sur une ligne à mesure qu'on en ajoute (défilement au-delà).
 * Automatique (types du back-office) ou liste composée à la main.
 */
function Categories({ s, data, edit }: { s: Section; data: HomeData; edit?: boolean }) {
  const p: P = s.props;
  const count = new Map(data.types.map((t) => [t.slug, t] as const));
  const want: string[] = p.types ?? [];
  const manual = p.mode === "manual" && Array.isArray(p.items) && p.items.length;
  const items = manual
    ? (p.items as P[]).filter((x) => x.type || x.href).map((x) => ({
        key: `${x.type}-${x.label}`, label: x.label || niceLabel(x.type, count.get(x.type)?.label ?? ""),
        icon: x.icon || TYPE_ICON[x.type] || "🏠", image: x.image as string | undefined,
        count: count.get(x.type)?.count ?? 0, href: x.href || `/annonces?propertyType=${encodeURIComponent(x.type)}`,
      }))
    : (want.length ? want.map((w) => count.get(w)).filter(Boolean) as HomeData["types"] : data.types).filter((t) => t.count > 0).map((t) => ({
        key: t.slug, label: niceLabel(t.slug, t.label), icon: TYPE_ICON[t.slug] ?? "🏠", image: undefined as string | undefined,
        count: t.count, href: `/annonces?propertyType=${encodeURIComponent(t.slug)}`,
      }));
  if (!items.length) return null;
  const n = items.length;
  const size = n <= 4 ? "lg" : n <= 7 ? "md" : "sm";
  const dark = p.background === "brand";
  return (
    <Shell s={s} pad="py-8" edit={edit}>
      <Head title={p.title} subtitle={p.subtitle} dark={dark} />
      <div className={"flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden " + "[justify-content:safe_center]"}>
        {items.map((t) => (
          <Link key={t.key} href={t.href}
            className={"group relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl border text-center transition duration-200 hover:-translate-y-1 hover:shadow-card-hover sm:flex-1 sm:basis-0 " +
              (dark ? "border-white/15 bg-white/10 hover:bg-white/15 " : "border-slate-200 bg-white hover:border-slate-300 ") +
              ({ lg: "min-w-[150px] max-w-[260px] px-6 py-7", md: "min-w-[130px] max-w-[200px] px-4 py-5", sm: "min-w-[112px] max-w-[160px] px-3 py-4" } as const)[size]}>
            {t.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.image} alt="" className={"rounded-2xl object-cover " + ({ lg: "h-20 w-20", md: "h-14 w-14", sm: "h-11 w-11" } as const)[size]} />
            ) : (
              <span className={"grid place-items-center rounded-2xl transition group-hover:scale-110 " + (dark ? "bg-white/15 " : "bg-slate-50 group-hover:bg-brand-50 ") +
                ({ lg: "h-20 w-20 text-4xl", md: "h-14 w-14 text-3xl", sm: "h-11 w-11 text-2xl" } as const)[size]}>{t.icon}</span>
            )}
            <span className={"mt-3 w-full truncate font-semibold " + (dark ? "text-white " : "text-ink ") + ({ lg: "text-base", md: "text-sm", sm: "text-[13px]" } as const)[size]}>{t.label}</span>
            {p.showCount !== false && t.count ? (
              <span className={"mt-0.5 text-xs " + (dark ? "text-white/70" : "text-muted")}>{t.count.toLocaleString("fr-FR")} annonce{t.count > 1 ? "s" : ""}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function QuickStart({ s, edit }: { s: Section; edit?: boolean }) {
  const items = (s.props.items ?? []) as P[];
  return (
    <Shell s={s} edit={edit}>
      <Head title={s.props.title} subtitle={s.props.subtitle} dark={s.props.background === "brand"} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((x, i) => (
          <Link key={i} href={x.href || "#"} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-card-hover">
            {x.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img {...imgProps(x.image, { width: 480, sizes: "(min-width: 1024px) 25vw, 100vw" })} alt="" loading="lazy" decoding="async" className="mb-4 h-32 w-full rounded-xl object-cover" />
            ) : <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-2xl">{x.icon || "🏠"}</span>}
            <p className="mt-4 font-display text-lg font-bold text-ink">{x.title}</p>
            <p className="mt-1 text-sm text-muted">{x.text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink underline decoration-slate-300 underline-offset-4 group-hover:decoration-ink">Découvrir →</span>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

async function Listings({ s, edit }: { s: Section; edit?: boolean }) {
  const p: P = s.props;
  const count = Math.min(24, Math.max(3, Number(p.count) || 12));
  const tx = p.transaction === "rent" || p.transaction === "sale" ? p.transaction : undefined;
  let { items } = await listListingsPage({ transaction: tx, propertyType: p.propertyType || undefined, q: p.q || undefined, sort: p.sort, perPage: count, listingKind: "classic", featured: !!p.featuredOnly });
  // Pas assez d'annonces en vedette : on complète avec les plus récentes.
  if (p.featuredOnly && items.length < 4) {
    const more = await listListingsPage({ transaction: tx, propertyType: p.propertyType || undefined, q: p.q || undefined, sort: "featured", perPage: count, listingKind: "classic" });
    items = [...items, ...more.items.filter((x) => !items.some((y) => y.id === x.id))].slice(0, count);
  }
  const qs = new URLSearchParams(Object.entries({ transaction: tx, propertyType: p.propertyType, q: p.q, sort: p.sort }).filter(([, v]) => v) as [string, string][]);
  return (
    <Shell s={s} edit={edit}>
      <Head title={p.title} subtitle={p.subtitle} href={`/annonces?${qs}`} dark={p.background === "brand"} />
      <Tiles items={items} layout={p.layout} label={p.title || "Annonces"} />
    </Shell>
  );
}

async function Reservables({ s, edit }: { s: Section; edit?: boolean }) {
  const p: P = s.props;
  const count = Math.min(24, Math.max(3, Number(p.count) || 10));
  const { items } = p.kind === "event" ? await espacesPage({ perPage: count }) : await residencesPage({ perPage: count });
  return (
    <Shell s={s} edit={edit}>
      <Head title={p.title} subtitle={p.subtitle} href={`/annonces?transaction=${p.kind === "event" ? "event" : "furnished"}`} dark={p.background === "brand"} />
      <Tiles items={items} layout={p.layout} label={p.title || "Réservables"} />
    </Shell>
  );
}

function Localities({ s, data, edit }: { s: Section; data: HomeData; edit?: boolean }) {
  const p: P = s.props;
  const count = Math.min(16, Math.max(3, Number(p.count) || 8));
  const items: { name: string; sub: string; image?: string; count?: number }[] = p.mode === "manual" && (p.items as P[])?.length
    ? (p.items as P[]).filter((x) => x.name).map((x) => ({ name: x.name, sub: x.subtitle ?? "", image: x.image, count: data.areas.find((a) => a.label.toLowerCase() === String(x.name).toLowerCase())?.count }))
    : data.areas.slice(0, count).map((a) => ({ name: a.label, sub: a.city, count: a.count }));
  if (!items.length) return null;
  return (
    <Shell s={s} edit={edit}>
      <Head title={p.title} subtitle={p.subtitle} dark={p.background === "brand"} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((x) => (
          <Link key={x.name} href={`/annonces?q=${encodeURIComponent(x.name)}`} className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50">
            {x.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={x.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            ) : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 font-display text-xl font-black text-brand-800">{x.name.charAt(0)}</span>}
            <span className="min-w-0">
              <span className={"block truncate font-semibold " + (p.background === "brand" ? "text-white" : "text-ink")}>{x.name}</span>
              <span className={"block truncate text-sm " + (p.background === "brand" ? "text-white/70" : "text-muted")}>{[x.sub, x.count ? `${x.count} annonce${x.count > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ")}</span>
            </span>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function PropertyTypes({ s, data, edit }: { s: Section; data: HomeData; edit?: boolean }) {
  const p: P = s.props;
  const items = ((p.items ?? []) as P[]).filter((x) => x.type).map((x) => ({ type: String(x.type), image: x.image as string | undefined, t: data.types.find((t) => t.slug === x.type) }));
  if (!items.length) return null;
  return (
    <Shell s={s} edit={edit}>
      <Head title={p.title} dark={p.background === "brand"} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((x) => (
          <Link key={x.type} href={`/annonces?propertyType=${encodeURIComponent(x.type)}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200">
            {x.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img {...imgProps(x.image, { width: 640, sizes: "(min-width: 1024px) 33vw, 100vw" })} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            ) : <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-700 to-brand-900 text-6xl">{TYPE_ICON[x.type] ?? "🏠"}</div>}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
              <p className="font-display text-lg font-bold">{x.t?.label ?? x.type}</p>
              <p className="text-sm text-white/80">{x.t?.count ?? 0} annonce{(x.t?.count ?? 0) > 1 ? "s" : ""}</p>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}

function Banner({ s, edit }: { s: Section; edit?: boolean }) {
  const p: P = s.props;
  const style = p.style as string;
  const box = style === "accent" ? "bg-gradient-to-br from-accent-500 to-accent-700 text-white"
    : style === "light" ? "bg-slate-100 text-ink" : style === "image" && p.image ? "text-white" : "bg-gradient-to-br from-brand-800 to-brand-900 text-white";
  return (
    <Shell s={{ ...s, props: { ...p, background: "white" } }} edit={edit}>
      <div className={`relative isolate grid items-center gap-8 overflow-hidden rounded-3xl p-8 sm:p-12 ${box} ${p.image && style !== "image" ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
        {style === "image" && p.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img {...imgProps(p.image, { width: 1600, sizes: "100vw" })} alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 to-black/10" />
          </>
        ) : null}
        <div className="max-w-xl">
          {p.eyebrow ? <p className="text-sm font-semibold uppercase tracking-wider opacity-80">{p.eyebrow}</p> : null}
          <h2 className="mt-2 font-display text-3xl font-black leading-tight sm:text-4xl">{p.title}</h2>
          {p.text ? <p className="mt-3 text-base opacity-90">{p.text}</p> : null}
          {p.buttonLabel && p.buttonHref ? (
            <Link href={p.buttonHref} className={"mt-6 inline-flex rounded-full px-6 py-3 font-semibold transition " + (style === "light" ? "bg-ink text-white hover:bg-slate-800" : "bg-white text-ink hover:bg-slate-100")}>{p.buttonLabel}</Link>
          ) : null}
        </div>
        {p.image && style !== "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" className="hidden h-64 w-full rounded-2xl object-cover lg:block" />
        ) : null}
      </div>
    </Shell>
  );
}

function Steps({ s, edit }: { s: Section; edit?: boolean }) {
  const p: P = s.props;
  const dark = p.background === "brand";
  return (
    <Shell s={s} edit={edit}>
      <Head title={p.title} subtitle={p.subtitle} dark={dark} />
      <div className="grid gap-4 sm:grid-cols-3">
        {((p.items ?? []) as P[]).map((x, i) => (
          <div key={i} className={"rounded-2xl p-6 " + (dark ? "bg-white/5 ring-1 ring-white/10" : "bg-white ring-1 ring-slate-200")}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-600 text-sm font-bold text-white">{i + 1}</span>
            <p className={"mt-4 font-semibold " + (dark ? "text-white" : "text-ink")}>{x.title}</p>
            <p className={"mt-1 text-sm " + (dark ? "text-white/70" : "text-muted")}>{x.text}</p>
          </div>
        ))}
      </div>
      {p.buttonLabel && p.buttonHref ? <Link href={p.buttonHref} className={"mt-8 inline-flex rounded-full px-6 py-3 font-semibold " + (dark ? "bg-white text-brand-900 hover:bg-brand-50" : "bg-ink text-white")}>{p.buttonLabel}</Link> : null}
    </Shell>
  );
}

function Pros({ s, data, edit }: { s: Section; data: HomeData; edit?: boolean }) {
  const p: P = s.props;
  const items = data.pros.slice(0, Math.min(12, Math.max(3, Number(p.count) || 8)));
  if (!items.length) return null;
  return (
    <Shell s={s} edit={edit}>
      <Head title={p.title} subtitle={p.subtitle} dark={p.background === "brand"} />
      <Carousel label={p.title || "Professionnels"}>
        {items.map((x) => (
          <Link key={x.href ?? x.username} href={x.href ?? `/pro/${x.username}`} className="w-[70%] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:shadow-card-hover sm:w-[40%] lg:w-[calc(20%-16px)]">
            {x.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgSmall(x.avatarUrl)} alt="" loading="lazy" decoding="async" className="mx-auto h-20 w-20 rounded-full object-cover" />
            ) : <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-800 font-display text-2xl font-bold text-white">{x.name.charAt(0).toUpperCase()}</span>}
            <p className="mt-3 truncate font-semibold text-ink">{x.name}</p>
            <p className="truncate text-xs text-muted">{x.accountType === "entreprise" ? "Agence" : "Agent"} · {x.city || "Côte d’Ivoire"}</p>
            <p className="mt-2 text-xs font-semibold text-slate-600">{x.listings} annonce{x.listings > 1 ? "s" : ""}{x.businessVerified ? <span className="ml-1 text-violet-800">· ✓ Pro vérifié</span> : x.verified ? <span className="ml-1 text-emerald-700">· ✓ Vérifié</span> : null}</p>
          </Link>
        ))}
      </Carousel>
    </Shell>
  );
}

/** Vrais chiffres de la plateforme (les catégories à zéro sont masquées). */
async function SeoLinksBlock({ s, edit }: { s: Section; edit?: boolean }) {
  const p: P = s.props;
  const links = (await getSeoLinks()).filter((l) => l.kind === "landing" && !l.noindex);
  if (!links.length) return null;
  const list = (v: unknown) => String(v ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const wantTabs = list(p.tabs), wantCols = list(p.columns);
  const order = (names: string[], want: string[]) => want.length ? want.filter((w) => names.includes(w)) : names;
  // Par défaut, l'onglet qui a le plus de liens en premier.
  const byCount = Array.from(new Set(links.map((l) => l.hubTab || "Autres")))
    .sort((a, b) => links.filter((l) => (l.hubTab || "Autres") === b).length - links.filter((l) => (l.hubTab || "Autres") === a).length);
  const tabNames = order(byCount, wantTabs);
  const tabs: LinkTab[] = tabNames.map((t) => {
    const inTab = links.filter((l) => (l.hubTab || "Autres") === t);
    const colNames = order(Array.from(new Set(inTab.map((l) => l.hubColumn || "Autres recherches"))), wantCols);
    return { title: t, columns: colNames.map((c) => ({ title: c, links: inTab.filter((l) => (l.hubColumn || "Autres recherches") === c).map((l) => ({ href: `/${l.slug}`, label: seoLinkLabel(l) })) })).filter((c) => c.links.length) };
  }).filter((t) => t.columns.length);
  if (!tabs.length) return null;
  const centered = p.style === "columns";
  return (
    <Shell s={s} edit={edit}>
      {centered ? (
        <div className="mb-10 text-center">
          {p.title ? <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-[30px]">{p.title}</h2> : null}
          <span className="mx-auto mt-4 block h-1 w-40 rounded-full bg-accent-600" />
          {p.subtitle ? <p className="mt-3 text-muted">{p.subtitle}</p> : null}
        </div>
      ) : <Head title={p.title} subtitle={p.subtitle} dark={p.background === "brand"} />}
      <SeoLinks tabs={tabs} style={centered ? "columns" : "tabs"} max={Math.min(30, Math.max(3, Number(p.max) || 8))} />
    </Shell>
  );
}

async function Marketing({ s, edit }: { s: Section; edit?: boolean }) {
  const items = await getCampaigns("site_banner");
  if (!items.length) return null;
  return (
    <Shell s={s} pad="py-8" edit={edit}>
      <Head title={s.props.title} dark={s.props.background === "brand"} />
      <SiteBanners items={items} />
    </Shell>
  );
}

function liveCounts(data: HomeData, short: boolean) {
  const t = data.totals;
  const n = (v?: number) => (v ?? 0).toLocaleString("fr-FR");
  const plural = (v: number | undefined, one: string, many: string) => ((v ?? 0) > 1 ? many : one);
  const rows: { v?: number; value: string; label: string }[] = [
    { v: t.listings, value: n(t.listings), label: short ? "annonces en ligne" : "annonces en ligne" },
    { v: t.agencies, value: n(t.agencies), label: plural(t.agencies, "agence immobilière", "agences immobilières") },
    { v: t.agents, value: n(t.agents), label: plural(t.agents, "agent immobilier", "agents immobiliers") },
    { v: t.promoters, value: n(t.promoters), label: plural(t.promoters, "promoteur", "promoteurs") },
    { v: t.hosts, value: n(t.hosts), label: plural(t.hosts, "résidence / espace", "résidences et espaces") },
    { v: t.offices, value: n(t.offices), label: plural(t.offices, "bureau ou commerce disponible", "bureaux et commerces disponibles") },
    { v: t.cities, value: n(t.cities), label: short ? "villes" : "villes couvertes" },
  ];
  // Ancienne API (sans détail) : total des professionnels.
  if (t.agencies === undefined && t.pros) rows.splice(1, 0, { v: t.pros, value: n(t.pros), label: "professionnels" });
  return rows.filter((r) => (r.v ?? 0) > 0).slice(0, short ? 5 : 5).map(({ value, label }) => ({ value, label }));
}

function Stats({ s, data, edit }: { s: Section; data: HomeData; edit?: boolean }) {
  const p: P = s.props;
  const items = p.mode === "manual" && (p.items as P[])?.length ? (p.items as P[]) : [
    ...liveCounts(data, false),
    { value: "0 %", label: "de commission sur les annonces classiques" },
  ];
  const dark = p.background === "brand";
  return (
    <Shell s={s} pad="py-10" edit={edit}>
      <div className={"grid grid-cols-2 gap-6 text-center " + (items.length > 4 ? "sm:grid-cols-3 lg:grid-cols-6" : "lg:grid-cols-4")}>
        {items.map((x, i) => (
          <div key={i}>
            <p className={"font-display text-3xl font-black sm:text-4xl " + (dark ? "text-white" : "text-ink")}>{x.value}</p>
            <p className={"mt-1 text-sm " + (dark ? "text-white/70" : "text-muted")}>{x.label}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function Testimonials({ s, edit }: { s: Section; edit?: boolean }) {
  const p: P = s.props;
  const items = ((p.items ?? []) as P[]).filter((x) => x.text);
  if (!items.length) return null;
  return (
    <Shell s={s} edit={edit}>
      <Head title={p.title} dark={p.background === "brand"} />
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((x, i) => (
          <figure key={i} className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <p className="text-amber-500" aria-label={`${x.rating ?? 5} sur 5`}>{"★".repeat(Math.round(Number(x.rating) || 5))}<span className="text-slate-200">{"★".repeat(5 - Math.round(Number(x.rating) || 5))}</span></p>
            <blockquote className="mt-3 flex-1 text-slate-700">« {x.text} »</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              {x.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={x.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 font-bold text-slate-600">{String(x.name || "?").charAt(0)}</span>}
              <span><span className="block text-sm font-semibold text-ink">{x.name}</span><span className="block text-xs text-muted">{x.role}</span></span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Shell>
  );
}

function Articles({ s, edit }: { s: Section; edit?: boolean }) {
  const p: P = s.props;
  const items = ((p.items ?? []) as P[]).filter((x) => x.title);
  if (!items.length) return null;
  return (
    <Shell s={s} edit={edit}>
      <Head title={p.title} href={p.seeAllHref || undefined} dark={p.background === "brand"} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((x, i) => (
          <a key={i} href={x.href || "#"} className="group block">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
              {x.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img {...imgProps(x.image, { width: 480, sizes: "(min-width: 1024px) 25vw, 50vw" })} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : <div className="grid h-full place-items-center text-4xl">📰</div>}
            </div>
            {x.tag ? <p className="mt-3 text-xs font-bold uppercase tracking-wider text-accent-700">{x.tag}</p> : null}
            <p className="mt-1 font-semibold text-ink group-hover:underline">{x.title}</p>
          </a>
        ))}
      </div>
    </Shell>
  );
}

async function Partners({ s, edit }: { s: Section; edit?: boolean }) {
  const partners = await getPartners();
  if (!partners.length) return null;
  return (
    <Shell s={s} pad="py-10" edit={edit}>
      {s.props.title ? <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted">{s.props.title}</h2> : null}
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {partners.map((x) => {
          // eslint-disable-next-line @next/next/no-img-element
          const logo = <img src={x.logoUrl} alt={x.name} title={x.name} loading="lazy" className="h-10 w-auto max-w-[8rem] object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0" />;
          return <li key={x.id}>{x.url ? <a href={x.url} target="_blank" rel="noopener noreferrer">{logo}</a> : logo}</li>;
        })}
      </ul>
    </Shell>
  );
}

async function AppBlock({ s, edit }: { s: Section; edit?: boolean }) {
  const p: P = s.props;
  const settings = await getSiteSettings();
  const mobile = (settings as unknown as Record<string, Record<string, string>>).mobile_app ?? {};
  const play = p.playStoreUrl || mobile.playStoreUrl || "https://play.google.com/store/search?q=moboo.ci";
  const apple = p.appStoreUrl || mobile.appStoreUrl || "";
  return (
    <Shell s={{ ...s, props: { ...p, background: "white" } }} edit={edit}>
      <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-slate-50 p-8 sm:p-12 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-black text-ink">{p.title}</h2>
          <p className="mt-3 text-muted">{p.text}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={play} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-white hover:bg-slate-800">
              <span className="text-xl">▶</span><span className="text-left leading-tight"><span className="block text-[10px] uppercase">Disponible sur</span><span className="font-semibold">Google Play</span></span>
            </a>
            {apple ? (
              <a href={apple} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-white hover:bg-slate-800">
                <span className="text-xl"></span><span className="text-left leading-tight"><span className="block text-[10px] uppercase">Télécharger sur</span><span className="font-semibold">l’App Store</span></span>
              </a>
            ) : null}
          </div>
        </div>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" className="mx-auto max-h-80 w-auto" />
        ) : (
          <div className="mx-auto hidden h-72 w-40 rounded-[2rem] border-[10px] border-ink bg-gradient-to-b from-brand-700 to-brand-900 shadow-2xl lg:block">
            <p className="mt-10 text-center font-display text-lg font-black text-white">Moboo</p>
          </div>
        )}
      </div>
    </Shell>
  );
}

/** Rendu d'une section publiée (null : type inconnu ou masquée). */
export async function HomeSection({ s, data, edit }: { s: Section; data: HomeData; edit?: boolean }) {
  if (!s.enabled) return null;
  const p = s.props;
  switch (s.type) {
    case "hero": return <Hero s={s} data={data} />;
    case "categories": return <Categories s={s} data={data} edit={edit} />;
    case "quickStart": return <QuickStart s={s} edit={edit} />;
    case "listings": return <Listings s={s} edit={edit} />;
    case "reservables": return <Reservables s={s} edit={edit} />;
    case "localities": return <Localities s={s} data={data} edit={edit} />;
    case "propertyTypes": return <PropertyTypes s={s} data={data} edit={edit} />;
    case "banner": return <Banner s={s} edit={edit} />;
    case "steps": return <Steps s={s} edit={edit} />;
    case "pros": return <Pros s={s} data={data} edit={edit} />;
    case "marketing": return <Marketing s={s} edit={edit} />;
    case "seoLinks": return <SeoLinksBlock s={s} edit={edit} />;
    case "stats": return <Stats s={s} data={data} edit={edit} />;
    case "calculator":
      return (
        <Shell s={s} edit={edit}>
          <Head title={p.title} subtitle={p.subtitle} dark={p.background === "brand"} />
          <LoanCalculator amount={Number(p.amount) || 30_000_000} rate={Number(p.rate) || 9} years={Number(p.years) || 15} ctaLabel={p.ctaLabel} ctaHref={p.ctaHref} />
        </Shell>
      );
    case "testimonials": return <Testimonials s={s} edit={edit} />;
    case "articles": return <Articles s={s} edit={edit} />;
    case "partners": return <Partners s={s} edit={edit} />;
    case "app": return <AppBlock s={s} edit={edit} />;
    case "faq":
      return (
        <Shell s={s} edit={edit}>
          <Head title={p.title} dark={p.background === "brand"} />
          <Faq items={(p.items ?? []) as { q: string; a: string }[]} />
        </Shell>
      );
    case "richText":
      return (
        <Shell s={s} edit={edit}>
          <div className="rich-text max-w-3xl" dangerouslySetInnerHTML={{ __html: String(p.html ?? "") }} />
        </Shell>
      );
    default: return null;
  }
}
