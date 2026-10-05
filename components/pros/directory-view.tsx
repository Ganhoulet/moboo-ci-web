import Link from "next/link";
import { img } from "@/lib/img";
import { Stars } from "@/components/reviews";
import { VerifiedBadge } from "@/components/verified-badge";
import { searchPros, getZones, slugZone, type DirectoryPro, type DirectoryQuery } from "@/lib/pro-reviews";

const SORTS = [
  { v: "", l: "Recommandés" }, { v: "rating", l: "Mieux notés" }, { v: "reviews", l: "Plus d’avis" },
  { v: "listings", l: "Plus d’annonces" }, { v: "name", l: "Nom (A → Z)" },
];

function href(base: string, q: DirectoryQuery, patch: Partial<DirectoryQuery>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...q, ...patch })) if (v !== undefined && v !== null && String(v) !== "" && k !== "zone") p.set(k, String(v));
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}

function ProCard({ p }: { p: DirectoryPro }) {
  const wa = (p.whatsapp || "").replace(/[^0-9]/g, "");
  const waLink = wa ? `https://wa.me/${wa.startsWith("225") ? wa : "225" + wa}?text=${encodeURIComponent("Bonjour, je vous ai trouvé sur Moboo.ci.")}` : null;
  return (
    <li className="flex flex-col rounded-2xl bg-white p-5 shadow-card transition hover:shadow-lg">
      <div className="flex gap-4">
        <Link href={p.href} className="shrink-0">
          {p.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img(p.photo, 160)} alt="" loading="lazy" className={`h-20 w-20 object-cover ${p.kind === "agence" ? "rounded-xl" : "rounded-full"}`} />
          ) : (
            <span className={`grid h-20 w-20 place-items-center bg-brand-800 font-display text-2xl font-bold text-white ${p.kind === "agence" ? "rounded-xl" : "rounded-full"}`}>{p.name.charAt(0).toUpperCase()}</span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{p.kind === "agence" ? "Agence immobilière" : "Agent immobilier"}</p>
          <Link href={p.href} className="mt-0.5 flex flex-wrap items-center gap-1.5 font-display text-lg font-bold leading-tight text-ink hover:text-brand-800">
            <span className="truncate">{p.name}</span>
            {p.businessVerified ? <VerifiedBadge kind="business" /> : p.verified ? <VerifiedBadge /> : null}
          </Link>
          {p.company ? <p className="truncate text-sm text-muted">{p.company}</p> : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
            {p.reviews ? (<><Stars value={p.rating} size={14} /><strong className="text-ink">{p.rating.toLocaleString("fr-FR")}</strong><span className="text-muted">({p.reviews} avis)</span></>) : <span className="text-muted">Pas encore d’avis</span>}
          </div>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 px-2 py-2"><dt className="text-[11px] text-muted">Annonces en ligne</dt><dd className="font-display text-lg font-bold text-ink">{p.listings}</dd></div>
        <div className="rounded-xl bg-slate-50 px-2 py-2"><dt className="text-[11px] text-muted">Recommandent</dt><dd className="font-display text-lg font-bold text-emerald-700">{p.recommend !== null ? `${p.recommend} %` : "—"}</dd></div>
      </dl>
      {p.zones.length ? (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">📍 {p.zones.slice(0, 5).join(" · ")}{p.zones.length > 5 ? ` +${p.zones.length - 5}` : ""}</p>
      ) : null}
      <div className="mt-auto flex gap-2 pt-4">
        <Link href={p.href} className="btn-primary flex-1 bg-brand-800 py-2 text-center text-sm hover:bg-brand-900">Voir le profil</Link>
        {waLink ? <a href={waLink} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary bg-[#25D366] px-4 py-2 text-sm text-white hover:opacity-90" aria-label={`WhatsApp ${p.name}`}>WhatsApp</a> : null}
      </div>
    </li>
  );
}

/**
 * Annuaire des agents et agences (façon Zillow « Trouver un agent ») :
 * recherche par zone d'intervention, nom, type ; notes des avis certifiés.
 */
export async function DirectoryView({ base, query, zoneLabel }: { base: string; query: DirectoryQuery; zoneLabel?: string | null }) {
  const [res, zones] = await Promise.all([searchPros(query), getZones()]);
  const place = zoneLabel || null;
  const type = query.type === "agent" || query.type === "agence" ? query.type : "";
  const page = Number(query.page) || 1;

  return (
    <div>
      <div className="bg-gradient-to-br from-brand-800 to-brand-900 text-white">
        <div className="container-page py-10 sm:py-14">
          <nav className="text-sm text-white/70" aria-label="Fil d’Ariane">
            <Link href="/" className="hover:underline">Accueil</Link> › <Link href="/agents-immobiliers" className="hover:underline">Agents immobiliers</Link>{place ? <> › <span className="text-white">{place}</span></> : null}
          </nav>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold sm:text-4xl">
            {place ? `Agents et agences immobilières à ${place}` : "Trouvez un agent immobilier près de chez vous"}
          </h1>
          <p className="mt-2 max-w-2xl text-white/80">
            Comparez les agents et agences de Côte d’Ivoire selon leur zone d’intervention, leurs avis certifiés et leurs annonces en ligne. Les avis viennent de vrais clients qui les ont contactés via Moboo.
          </p>
          <form action="/agents-immobiliers" method="get" className="mt-6 grid max-w-4xl gap-2 rounded-2xl bg-white p-2 text-ink shadow-xl sm:grid-cols-[1.3fr_1fr_auto_auto]">
            <label className="flex items-center gap-2 rounded-xl px-3">
              <span aria-hidden="true">📍</span>
              <input name="zone" list="dir-zones" defaultValue={place ?? query.zone ?? ""} placeholder="Commune, quartier ou ville" className="w-full py-3 outline-none" aria-label="Zone" />
            </label>
            <label className="flex items-center gap-2 rounded-xl px-3 sm:border-l sm:border-slate-200">
              <span aria-hidden="true">🔎</span>
              <input name="q" defaultValue={query.q ?? ""} placeholder="Nom de l’agent ou de l’agence" className="w-full py-3 outline-none" aria-label="Nom" />
            </label>
            <select name="type" defaultValue={type} className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium outline-none" aria-label="Type">
              <option value="">Agents et agences</option>
              <option value="agent">Agents</option>
              <option value="agence">Agences</option>
            </select>
            <button className="btn-primary bg-accent-600 px-6 py-3 hover:bg-accent-700">Rechercher</button>
            <datalist id="dir-zones">{zones.map((z) => <option key={z.slug} value={z.label} />)}</datalist>
          </form>
        </div>
      </div>

      <div className="container-page py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Type de professionnel">
            {[{ v: "", l: "Tous" }, { v: "agent", l: "Agents" }, { v: "agence", l: "Agences" }].map((t) => (
              <Link key={t.v} href={href(base, query, { type: t.v, page: "" })} role="tab" aria-selected={type === t.v}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${type === t.v ? "bg-brand-800 text-white" : "bg-white text-slate-700 shadow-card hover:text-brand-800"}`}>{t.l}</Link>
            ))}
            <Link href={href(base, query, { verified: query.verified === "1" ? "" : "1", page: "" })}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${query.verified === "1" ? "bg-emerald-700 text-white" : "bg-white text-slate-700 shadow-card hover:text-brand-800"}`}>✓ Vérifiés</Link>
            <Link href={href(base, query, { minRating: query.minRating === "4" ? "" : "4", page: "" })}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${query.minRating === "4" ? "bg-amber-500 text-white" : "bg-white text-slate-700 shadow-card hover:text-brand-800"}`}>★ 4 et plus</Link>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Trier :</span>
            {SORTS.map((s) => (
              <Link key={s.v} href={href(base, query, { sort: s.v, page: "" })} className={(query.sort ?? "") === s.v ? "font-semibold text-brand-800" : "text-slate-600 hover:text-brand-800"}>{s.l}</Link>
            ))}
          </div>
        </div>

        <p className="mt-5 text-sm text-muted">
          <strong className="text-ink">{res.total}</strong> professionnel{res.total > 1 ? "s" : ""}{place ? ` à ${place}` : ""}
          {" "}({res.counts.agent} agent{res.counts.agent > 1 ? "s" : ""}, {res.counts.agence} agence{res.counts.agence > 1 ? "s" : ""})
        </p>

        {res.items.length ? (
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {res.items.map((p) => <ProCard key={p.ref} p={p} />)}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
            <p className="font-display text-lg font-bold text-ink">Aucun professionnel trouvé{place ? ` à ${place}` : ""}</p>
            <p className="mt-1 text-sm text-muted">Essayez une commune voisine ou retirez un filtre.</p>
            <Link href="/agents-immobiliers" className="mt-4 inline-block font-semibold text-brand-800 hover:underline">Voir tous les agents</Link>
          </div>
        )}

        {res.pages > 1 ? (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
            {page > 1 ? <Link href={href(base, query, { page: String(page - 1) })} className="btn-ghost text-sm" rel="prev">← Précédent</Link> : null}
            <span className="text-sm text-muted">Page {page} / {res.pages}</span>
            {page < res.pages ? <Link href={href(base, query, { page: String(page + 1) })} className="btn-ghost text-sm" rel="next">Suivant →</Link> : null}
          </nav>
        ) : null}

        {zones.length ? (
          <section className="mt-14">
            <h2 className="font-display text-xl font-bold text-ink">Agents immobiliers par zone</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {zones.slice(0, 48).map((z) => (
                <li key={z.slug}><Link href={`/agents-immobiliers/${z.slug}`} className={`hover:text-brand-800 hover:underline ${slugZone(place ?? "") === z.slug ? "font-semibold text-brand-800" : "text-slate-700"}`}>Agents à {z.label} <span className="text-muted">({z.n})</span></Link></li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-14 grid gap-6 rounded-3xl bg-white p-6 shadow-card sm:p-8 lg:grid-cols-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Comment choisir son agent ?</h2>
            <p className="mt-2 text-sm text-slate-600">Regardez ses zones d’intervention, ses annonces en ligne et surtout ses avis : fiabilité, réactivité, connaissance du secteur et accompagnement jusqu’à la signature.</p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Des avis certifiés</h2>
            <p className="mt-2 text-sm text-slate-600">Seuls les clients qui ont réellement contacté un professionnel via Moboo (demande, visite, message) peuvent le noter. Mêmes avis sur le site et l’application Moboo.ci.</p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Vous êtes agent ou agence ?</h2>
            <p className="mt-2 text-sm text-slate-600">Indiquez vos zones dans votre profil pour apparaître ici, et invitez vos clients à vous noter.</p>
            <Link href="/professionnels/agents" className="mt-2 inline-block text-sm font-semibold text-brand-800 hover:underline">Développer mon activité avec Moboo →</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
