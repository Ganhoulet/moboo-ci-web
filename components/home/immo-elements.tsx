import Link from "next/link";
import { SiteIcon } from "@/components/site-icon";
import type { Section } from "@/lib/page-blocks";
import { fcfa, getPriceCommunes } from "@/lib/prices";
import { waHref } from "@/lib/whatsapp";
import { Countdown, RentalYield, RentBudget } from "./immo-widgets";

// Rendu des éléments « Immobilier & PropTech » (lib/immo-blocks.ts).

export const IMMO_TYPES = new Set(["searchBar", "rentBudget", "rentalYield", "marketPrices", "neighborhood", "pricingTable", "lotsTable", "virtualTour", "whatsappCta", "countdown", "trustBadges"]);

const WIDTH: Record<string, string> = { narrow: "max-w-3xl", normal: "max-w-6xl", full: "max-w-none" };
const ALIGN: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" };
const TX_LABEL: Record<string, string> = { rent: "Louer", sale: "Acheter", furnished: "Meublés", event: "Espaces" };
const STATUS: Record<string, [string, string]> = { available: ["Disponible", "bg-emerald-100 text-emerald-800"], reserved: ["Réservé", "bg-amber-100 text-amber-800"], sold: ["Vendu", "bg-slate-200 text-slate-600"] };
/** Hébergeurs de visites virtuelles acceptés. */
const TOUR_HOSTS = /^(my\.matterport\.com|kuula\.co|app\.cloudpano\.com|momento360\.com|www\.youtube(-nocookie)?\.com|youtube\.com|player\.vimeo\.com|tour\.giraffe360\.com|my\.panoee\.com|www\.theasys\.io|roundme\.com)$/i;

function Title({ title, subtitle, align }: { title?: string; subtitle?: string; align: string }) {
  if (!title && !subtitle) return null;
  return (
    <div className={`mb-6 ${ALIGN[align] ?? ""}`}>
      {title ? <h2 className="font-display text-2xl font-black sm:text-3xl">{title}</h2> : null}
      {subtitle ? <p className="mt-1 opacity-75">{subtitle}</p> : null}
    </div>
  );
}
const A = ({ href, className, children }: { href: string; className: string; children: React.ReactNode }) =>
  /^https?:/.test(href) ? <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a> : <Link href={href} className={className}>{children}</Link>;

export async function ImmoElement({ s }: { s: Section }) {
  const p = s.props ?? {};
  const align = String(p.align || "left");
  const wrap = `${WIDTH[p.width] ?? WIDTH.normal} mx-auto`;
  const items: any[] = Array.isArray(p.items) ? p.items : [];

  switch (s.type) {
    case "searchBar": {
      const txs = (Array.isArray(p.transactions) && p.transactions.length ? p.transactions : ["rent", "sale"]).filter((t: string) => TX_LABEL[t]);
      return (
        <div className={wrap}>
          <Title title={p.title} align={align} />
          <form action="/annonces" method="get" className="grid gap-2 rounded-2xl bg-white p-3 text-ink shadow-card sm:grid-cols-[auto_1fr_auto_auto]">
            <select name="transaction" className="input text-sm" defaultValue={txs[0]} aria-label="Type de recherche">
              {txs.map((t: string) => <option key={t} value={t}>{TX_LABEL[t]}</option>)}
            </select>
            <input name="q" className="input text-sm" placeholder={p.placeholder || "Commune, quartier ou ville"} aria-label="Où ?" />
            {p.showBudget ? <input name="priceMax" type="number" min={0} step={5000} className="input text-sm sm:w-40" placeholder="Budget max (FCFA)" aria-label="Budget maximum" /> : null}
            <button className="rounded-xl bg-accent-600 px-6 py-3 text-sm font-bold text-white hover:bg-accent-700">{p.button || "Rechercher"}</button>
          </form>
        </div>
      );
    }
    case "rentBudget":
    case "rentalYield":
      return (
        <div className={wrap}>
          <Title title={p.title} subtitle={p.text} align={align} />
          {s.type === "rentBudget" ? <RentBudget ratio={Number(p.ratio) || 33} /> : <RentalYield price={Number(p.price) || 0} rent={Number(p.rent) || 0} charges={Number(p.charges) || 0} />}
        </div>
      );
    case "marketPrices": {
      const rows = (await getPriceCommunes()) ?? [];
      const wanted = String(p.communes || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
      const limit = Math.min(30, Math.max(3, Number(p.limit) || 8));
      const list = (wanted.length
        ? rows.filter((r) => wanted.includes(r.commune.toLowerCase()))
        : [...rows].sort((a, b) => ((b.rent?.count ?? 0) + (b.sale?.count ?? 0)) - ((a.rent?.count ?? 0) + (a.sale?.count ?? 0)))
      ).slice(0, limit);
      const show = String(p.show || "both");
      return (
        <div className={wrap}>
          <Title title={p.title} subtitle={p.subtitle} align={align} />
          {list.length ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white text-ink">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">Commune</th>{show !== "sale" ? <th className="px-4 py-3">Loyer médian</th> : null}{show !== "rent" ? <th className="px-4 py-3">Prix de vente médian</th> : null}<th /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((r) => (
                    <tr key={r.slug}>
                      <td className="px-4 py-3 font-semibold">{r.commune}<span className="block text-xs font-normal text-slate-500">{r.city}</span></td>
                      {show !== "sale" ? <td className="px-4 py-3">{r.rent ? `${fcfa(r.rent.median)} / mois` : "—"}</td> : null}
                      {show !== "rent" ? <td className="px-4 py-3">{r.sale ? fcfa(r.sale.median) : "—"}</td> : null}
                      <td className="px-4 py-3 text-right"><Link href={`/prix-immobilier/${r.slug}`} className="text-xs font-semibold text-brand-700 hover:underline">Détails →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm opacity-70">Les prix seront affichés dès que les données seront disponibles.</p>}
        </div>
      );
    }
    case "neighborhood":
      return (
        <div className={`${wrap} grid overflow-hidden rounded-3xl border border-slate-200 bg-white text-ink md:grid-cols-2`}>
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt={p.name || ""} loading="lazy" className="h-full min-h-[240px] w-full object-cover" />
          ) : <div className="grid min-h-[240px] place-items-center bg-brand-50 text-brand-800"><SiteIcon value="lieu" size={56} /></div>}
          <div className="p-6 sm:p-8">
            <h3 className="font-display text-2xl font-black">{p.name}</h3>
            {p.text ? <p className="mt-2 whitespace-pre-line text-slate-600">{p.text}</p> : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {p.rent ? <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Location</p><p className="font-semibold">{p.rent}</p></div> : null}
              {p.sale ? <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Vente</p><p className="font-semibold">{p.sale}</p></div> : null}
            </div>
            {items.length ? <ul className="mt-4 space-y-2 text-sm">{items.filter((x) => x?.text).map((x, i) => <li key={i} className="flex items-center gap-2"><SiteIcon value={x.icon || "succes"} size={18} className="text-brand-700" />{x.text}</li>)}</ul> : null}
            {p.searchQuery ? <Link href={`/annonces?q=${encodeURIComponent(p.searchQuery)}`} className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Voir les annonces à {p.name || p.searchQuery} →</Link> : null}
          </div>
        </div>
      );
    case "pricingTable":
      return (
        <div className={wrap}>
          <Title title={p.title} subtitle={p.subtitle} align={align} />
          <div className={`grid gap-5 ${items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "sm:grid-cols-2"} text-left`}>
            {items.map((o, i) => (
              <div key={i} className={`flex flex-col rounded-2xl bg-white p-6 text-ink ${o.featured ? "border-2 border-accent-600 shadow-xl" : "border border-slate-200"}`}>
                {o.featured ? <span className="mb-2 w-fit rounded-full bg-accent-600 px-2.5 py-0.5 text-xs font-bold text-white">Recommandé</span> : null}
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{o.name}</p>
                <p className="mt-2 font-display text-3xl font-black">{o.price}<span className="text-base font-semibold text-slate-500"> {o.period}</span></p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">{String(o.features || "").split("\n").filter(Boolean).map((f: string) => <li key={f}>✓ {f}</li>)}</ul>
                {o.buttonLabel && o.buttonHref ? <A href={o.buttonHref} className={`mt-6 rounded-full py-3 text-center text-sm font-bold ${o.featured ? "bg-accent-600 text-white hover:bg-accent-700" : "border border-ink hover:bg-ink hover:text-white"}`}>{o.buttonLabel}</A> : null}
              </div>
            ))}
          </div>
        </div>
      );
    case "lotsTable":
      return (
        <div className={wrap}>
          <Title title={p.title} align={align} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white text-ink">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Lot</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Surface</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Disponibilité</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((l, i) => {
                  const [label, cls] = STATUS[l.status] ?? STATUS.available;
                  return <tr key={i} className={l.status === "sold" ? "opacity-60" : ""}><td className="px-4 py-3 font-semibold">{l.lot}</td><td className="px-4 py-3">{l.type}</td><td className="px-4 py-3">{l.surface}</td><td className="px-4 py-3">{l.price}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span></td></tr>;
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs opacity-70">{items.filter((l) => (l.status ?? "available") === "available").length} lot(s) disponible(s) sur {items.length}</p>
          {p.buttonLabel && p.buttonHref ? <A href={p.buttonHref} className="mt-4 inline-flex rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white hover:bg-accent-700">{p.buttonLabel}</A> : null}
        </div>
      );
    case "virtualTour": {
      let ok = false;
      try { const u = new URL(String(p.url || "")); ok = u.protocol === "https:" && TOUR_HOSTS.test(u.hostname); } catch { ok = false; }
      return (
        <div className={wrap}>
          <Title title={p.title} align={align} />
          {ok ? <iframe src={p.url} title={p.title || "Visite virtuelle"} loading="lazy" allowFullScreen allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen" className="w-full rounded-2xl border-0 bg-slate-100" style={{ height: Math.min(900, Math.max(300, Number(p.height) || 520)) }} />
            : <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm opacity-70">Collez le lien d’une visite Matterport, Kuula, CloudPano, Momento360 ou YouTube 360.</div>}
        </div>
      );
    }
    case "whatsappCta": {
      const href = waHref(p.phone, p.message || undefined);
      return (
        <div className={`${wrap} ${ALIGN[align] ?? ""}`}>
          {p.title ? <h3 className="font-display text-2xl font-black">{p.title}</h3> : null}
          {p.text ? <p className="mt-1 opacity-80">{p.text}</p> : null}
          {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white hover:brightness-95"><SiteIcon value="message" size={18} />{p.button || "Écrire sur WhatsApp"}</a>
            : <p className="mt-4 text-sm opacity-70">Numéro WhatsApp à renseigner.</p>}
        </div>
      );
    }
    case "countdown":
      return (
        <div className={`${wrap} ${ALIGN[align] ?? ""}`}>
          {p.title ? <h3 className="mb-4 font-display text-2xl font-black">{p.title}</h3> : null}
          <Countdown date={String(p.date || "")} ended={String(p.ended || "")} />
          {p.buttonLabel && p.buttonHref ? <div className="mt-6"><A href={p.buttonHref} className="inline-flex rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white hover:bg-accent-700">{p.buttonLabel}</A></div> : null}
        </div>
      );
    case "trustBadges":
      return (
        <div className={`${wrap} grid grid-cols-2 gap-4 ${items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} ${ALIGN[align] ?? ""}`}>
          {items.map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-ink">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-800"><SiteIcon value={b.icon || "bouclier"} size={22} /></span>
              <p className="text-sm font-bold">{b.title}</p>
              {b.text ? <p className="text-xs text-slate-500">{b.text}</p> : null}
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}
