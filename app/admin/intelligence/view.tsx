import Link from "next/link";
import { qs, type Filtre } from "./qs";
import { LiveMarket } from "./live";
import { F, Fc, pct, UNITE, variation, type Intelligence, type MarketEvent, type Zone } from "./types";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const moisCourt = (m: string) => MOIS[Number(m.slice(5, 7)) - 1] ?? m;

function Delta({ v, suffix = "" }: { v: number | null | undefined; suffix?: string }) {
  if (v == null) return null;
  if (Math.abs(v) < 0.5) return <span className="text-xs font-semibold text-slate-500">= stable{suffix}</span>;
  return <span className={"text-xs font-bold tabular-nums " + (v > 0 ? "text-emerald-700" : "text-red-600")}>{v > 0 ? "▲" : "▼"} {pct(v)}{suffix}</span>;
}

function Kpi({ label, value, delta, hint }: { label: string; value: string; delta?: number | null; hint?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-2"><span className="font-display text-2xl font-extrabold tabular-nums text-ink">{value}</span><Delta v={delta} /></p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Section({ title, sub, children, right }: { title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div><h2 className="font-bold text-ink">{title}</h2>{sub ? <p className="text-xs text-muted">{sub}</p> : null}</div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Barres verticales d'une seule série (survol : valeur exacte). */
function Bars({ data, format, color = "#1e40af" }: { data: { label: string; value: number | null }[]; format: (n: number) => string; color?: string }) {
  const W = 640, H = 160, pad = 22, n = data.length || 1, bw = (W - 8) / n;
  const max = Math.max(1, ...data.map((d) => d.value ?? 0));
  return (
    <svg viewBox={`0 0 ${W} ${H + pad}`} className="h-auto w-full" role="img">
      <line x1="0" x2={W} y1={H} y2={H} stroke="#e2e8f0" />
      {data.map((d, i) => {
        const h = d.value ? Math.max(3, (d.value / max) * (H - 18)) : 0;
        const x = 4 + i * bw + bw * 0.18, w = bw * 0.64;
        return (
          <g key={i}>
            <rect x={4 + i * bw} y={0} width={bw} height={H} fill="transparent"><title>{`${d.label} : ${d.value == null ? "pas assez d’annonces" : format(d.value)}`}</title></rect>
            {h ? <rect x={x} y={H - h} width={w} height={h} rx={4} fill={color} pointerEvents="none" /> : <text x={x + w / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">—</text>}
            {i === n - 1 && d.value ? <text x={x + w / 2} y={H - h - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{format(d.value)}</text> : null}
            <text x={x + w / 2} y={H + 15} textAnchor="middle" fontSize="10.5" fill="#64748b">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Meter({ value, max, label, sub }: { value: number; max: number; label: string; sub: string }) {
  return (
    <li className="text-sm">
      <div className="flex justify-between gap-3"><span className="font-medium text-slate-700">{label}</span><span className="tabular-nums text-slate-500">{sub}</span></div>
      <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-700" style={{ width: `${Math.max(2, Math.round((value / Math.max(1, max)) * 100))}%` }} /></div>
    </li>
  );
}

/** Contenu de la page (séparé pour pouvoir l'afficher avec des données d'essai). */
export function IntelligenceView({ d, f, initialEvents }: { d: Intelligence; f: Filtre; initialEvents?: MarketEvent[] }) {
  const t = d.totals;
  const zoneLink = (c: string) => `/admin/intelligence?${qs({ ...f, commune: c, quartier: undefined })}`;
  const scope = [f.commune, f.quartier, f.type, f.tx === "rent" ? "location" : f.tx === "sale" ? "vente" : null, f.source === "moboo" ? "Moboo.ci seulement" : f.source === "externe" ? "catalogues d’agences seulement" : null].filter(Boolean).join(" · ");
  const zone1: Zone | undefined = f.commune ? d.zones[0] : undefined;
  const maxType = Math.max(1, ...d.types.map((x) => x.count));
  const maxDem = Math.max(1, ...d.demande.top.map((x) => x.n30));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Intelligence immobilière</h1>
          <p className="max-w-3xl text-sm text-muted">
            Tout le marché Moboo.ci (appli et site) par commune, quartier, type de bien et prix, avec la demande des visiteurs et l’activité des agences Moboo Pro.
            {scope ? <> Filtre : <strong>{scope}</strong>.</> : null} Les chiffres se mettent à jour seuls.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <a href={`/admin/intelligence/export?${qs(f)}`} className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Exporter (Excel)</a>
          <Link href="/admin/statistiques/prix" className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Indice des prix</Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <select name="commune" defaultValue={f.commune ?? ""} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
          <option value="">Toutes les communes</option>
          {d.options.communes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {d.options.quartiers.length ? (
          <select name="quartier" defaultValue={f.quartier ?? ""} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
            <option value="">Tous les quartiers</option>
            {d.options.quartiers.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        ) : null}
        <select name="type" defaultValue={f.type ?? ""} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
          <option value="">Tous les types de bien</option>
          {d.options.types.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select name="tx" defaultValue={f.tx ?? ""} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
          <option value="">Location et vente</option><option value="rent">Location</option><option value="sale">Vente</option>
        </select>
        <select name="source" defaultValue={f.source ?? ""} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
          <option value="">Marché général (toutes sources)</option><option value="moboo">Moboo.ci seulement</option><option value="externe">Catalogues des agences seulement</option>
        </select>
        <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Analyser</button>
        {scope ? <Link href="/admin/intelligence" className="px-2 py-2 text-sm font-semibold text-brand-800 hover:underline">Tout le marché</Link> : null}
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Annonces en ligne" value={t.active.toLocaleString("fr-FR")} hint={`${t.rent} à louer · ${t.sale} à vendre`} />
        <Kpi label="Nouvelles · 7 j" value={String(t.new7)} delta={variation(t.new7, t.new7Prev)} hint="vs 7 jours avant" />
        <Kpi label="Nouvelles · 30 j" value={String(t.new30)} delta={variation(t.new30, t.new30Prev)} hint="vs 30 jours avant" />
        <Kpi label="Baisses de prix · 7 j" value={String(t.drops7)} />
        <Kpi label="Recherches · 7 j" value={d.demande.recherches7.toLocaleString("fr-FR")} hint={`${d.demande.recherches30.toLocaleString("fr-FR")} sur 30 jours`} />
        <Kpi label="Sans résultat · 7 j" value={String(d.demande.sansResultat7)} hint="clients sans offre" />
        <Kpi label="Départs signalés" value={String(d.departs.reduce((s, x) => s + x.n, 0))} hint="30 derniers jours" />
      </div>

      <LiveMarket commune={f.commune ?? ""} initialQuotes={d.quotes} initialEvents={initialEvents} />

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 text-sm shadow-sm ring-1 ring-slate-200">
        <span className="font-semibold text-slate-600">Sources :</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-800">Moboo.ci · {d.totals.moboo.toLocaleString("fr-FR")} annonces</span>
        <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-800">Catalogues d’agences · {d.totals.externe.toLocaleString("fr-FR")} annonces ({d.sources.catalogues.length} source{d.sources.catalogues.length > 1 ? "s" : ""})</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-800">Loyers signés · {d.loyersSignes.baux} baux, {d.loyersSignes.communes} commune{d.loyersSignes.communes > 1 ? "s" : ""}</span>
        <Link href="/admin/intelligence/catalogues" className="ml-auto font-semibold text-brand-800 hover:underline">Gérer les catalogues →</Link>
      </div>

      <Section title="Marché par commune" sub="Loyer et prix de vente médians (prix du milieu), variations sur 7 et 30 jours, demande des visiteurs et présence des agences Moboo Pro. Cliquez une commune pour l’analyser.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Commune</th><th className="px-2 py-2 text-right">En ligne</th><th className="px-2 py-2 text-right">Nouvelles 30 j</th>
                <th className="px-2 py-2 text-right">Loyer médian</th><th className="px-2 py-2 text-right">7 j</th><th className="px-2 py-2 text-right">30 j</th><th className="px-2 py-2 text-right" title="Loyer médian des baux actifs Moboo Pro (au moins 5 baux et 3 agences)">Loyer signé</th>
                <th className="px-2 py-2 text-right">Vente médiane</th><th className="px-2 py-2 text-right">Recherches 7 j</th><th className="px-2 py-2 text-right" title="Recherches de la semaine par annonce en ligne">Pression</th>
                <th className="px-2 py-2 text-right">Départs</th><th className="px-3 py-2 text-right">Agences Pro</th>
              </tr>
            </thead>
            <tbody>
              {d.zones.map((z) => (
                <tr key={z.commune} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-3 py-2 font-semibold"><Link href={zoneLink(z.commune)} className="text-brand-800 hover:underline">{z.commune}</Link><span className="ml-1 text-xs font-normal text-muted">{z.share.toLocaleString("fr-FR")} %</span></td>
                  <td className="px-2 py-2 text-right tabular-nums">{z.active}<span className="block text-[11px] text-muted">{z.rent} loc. · {z.sale} vente</span></td>
                  <td className="px-2 py-2 text-right tabular-nums">{z.new30} <Delta v={z.newVariation} /></td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">{F(z.rentMedian)}<span className="block text-[11px] font-normal text-muted">{z.rentCount} annonces</span></td>
                  <td className="px-2 py-2 text-right"><Delta v={z.rentChange7} /></td>
                  <td className="px-2 py-2 text-right"><Delta v={z.rentChange30} /></td>
                  <td className="px-2 py-2 text-right tabular-nums">{z.loyerSigne ? <>{F(z.loyerSigne)}<span className="block text-[11px] text-muted">{z.loyerSigneBaux} baux{z.ecartAffiche != null ? ` · affiché ${pct(z.ecartAffiche)}` : ""}</span></> : "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{Fc(z.saleMedian)} <Delta v={z.saleChange30} /></td>
                  <td className="px-2 py-2 text-right tabular-nums">{z.searches7}{z.zero7 ? <span className="block text-[11px] text-amber-700">{z.zero7} sans résultat</span> : null}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{z.pression >= 2 ? <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800">{z.pression.toLocaleString("fr-FR")}</span> : z.pression.toLocaleString("fr-FR")}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{z.departs || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{z.agences ? <>{z.agences}<span className="block text-[11px] text-muted">{z.biensPro} biens</span></> : "—"}</td>
                </tr>
              ))}
              {!d.zones.length ? <tr><td colSpan={12} className="p-6 text-center text-muted">Aucune annonce pour ce filtre.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">« — » : moins de {d.minSample} annonces, le prix n’est pas calculé (aucune annonce isolée ne doit être reconnaissable). Pression : recherches de la semaine par annonce en ligne ; au-dessus de 2, la demande dépasse l’offre. Loyer signé : loyer réel des baux actifs Moboo Pro, affiché à partir de 5 baux et 3 agences ; « affiché +x % » = les annonces sont plus chères que les loyers signés.</p>
      </Section>

      {zone1?.quartiers.length ? (
        <Section title={`Quartiers de ${zone1.commune}`} sub="Annonces en ligne et loyer médian par quartier (tel que saisi dans les annonces).">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {zone1.quartiers.map((q) => (
              <Link key={q.quartier} href={`/admin/intelligence?${qs({ ...f, quartier: q.quartier })}`} className="flex items-center justify-between rounded-lg px-3 py-2 ring-1 ring-slate-200 hover:bg-slate-50">
                <span className="font-semibold text-ink">{q.quartier}</span>
                <span className="text-right text-sm tabular-nums"><b>{q.active}</b> en ligne<span className="block text-xs text-muted">{q.rentMedian ? `loyer ${F(q.rentMedian)}` : "peu de données"}</span></span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Chiffres publiés par d’autres sources" sub="Rapports, observatoires et articles saisis à la main, avec leur source, comparés au prix médian Moboo de la même commune." right={<Link href="/admin/intelligence/chiffres-publies" className="text-sm font-semibold text-brand-800 hover:underline">Ajouter un chiffre →</Link>}>
        {d.references.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-1.5">Zone · bien</th><th className="py-1.5 text-right">Chiffre publié</th><th className="py-1.5 text-right">Moboo (médiane)</th><th className="py-1.5 pl-6">Source</th></tr></thead>
              <tbody>
                {d.references.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium">{[r.quartier, r.commune ?? r.ville ?? "Tout le pays"].filter(Boolean).join(", ")}<span className="block text-[11px] text-muted">{r.typeBien ?? "Tous types"} · {UNITE[r.unite]}</span></td>
                    <td className="py-2 text-right tabular-nums"><b>{Fc(r.valeur)}</b>{r.valeurMin && r.valeurMax ? <span className="block text-[11px] text-muted">{Fc(r.valeurMin)} – {Fc(r.valeurMax)}</span> : null}</td>
                    <td className="py-2 text-right tabular-nums">{r.mobooMedian ? <>{Fc(r.mobooMedian)}<span className="block text-[11px] text-muted">Moboo {pct(r.ecartMoboo)}</span></> : "—"}</td>
                    <td className="py-2 pl-6 text-xs">{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-800 hover:underline">{r.source}</a> : r.source}{r.publieLe ? <span className="block text-muted">publié le {new Date(r.publieLe).toLocaleDateString("fr-FR")}</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted">Aucun chiffre saisi pour cette zone. Exemple : le « Panorama du marché de l’immobilier » annuel de H&A Properties.</p>}
      </Section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Prix affichés par catégorie" sub={`Médiane et fourchette du milieu (25 % – 75 %)${f.commune ? ` à ${f.commune}` : " sur tout le marché"}.`}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-1.5">Catégorie</th><th className="py-1.5 text-right">Loyer / mois</th><th className="py-1.5 text-right">Vente</th></tr></thead>
            <tbody>
              {d.segments.map((s) => (
                <tr key={s.segment} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{s.label}<span className="ml-1 text-xs text-muted">{s.count}</span></td>
                  <td className="py-2 text-right tabular-nums">{s.rent ? <><b>{F(s.rent.median)}</b><span className="block text-[11px] text-muted">{Fc(s.rent.p25)} – {Fc(s.rent.p75)}</span></> : "—"}</td>
                  <td className="py-2 text-right tabular-nums">{s.sale ? <><b>{Fc(s.sale.median)}</b><span className="block text-[11px] text-muted">{Fc(s.sale.p25)} – {Fc(s.sale.p75)}</span></> : "—"}</td>
                </tr>
              ))}
              {!d.segments.length ? <tr><td colSpan={3} className="py-6 text-center text-muted">Pas encore assez d’annonces.</td></tr> : null}
            </tbody>
          </table>
        </Section>
        <Section title="Types de biens les plus représentés" sub="Part des annonces en ligne.">
          <ul className="space-y-2.5">
            {d.types.map((x) => <Meter key={x.label} label={x.label} value={x.count} max={maxType} sub={`${x.count} · ${x.share.toLocaleString("fr-FR")} % (${x.rent} loc. · ${x.sale} vente)`} />)}
          </ul>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Nouvelles annonces par mois" sub="12 derniers mois, filtres appliqués.">
          <Bars data={d.tendance.map((m) => ({ label: moisCourt(m.month), value: m.nouvelles }))} format={(n) => String(n)} />
        </Section>
        <Section title="Loyer médian des annonces publiées dans le mois" sub="« — » : moins de 3 annonces ce mois-là.">
          <Bars data={d.tendance.map((m) => ({ label: moisCourt(m.month), value: m.loyerMedian }))} format={Fc} color="#0f766e" />
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Ce que cherchent les visiteurs (30 jours)" sub="Recherches anonymes sur le site et l’appli Moboo.ci, par commune et type de bien.">
          <ul className="space-y-2.5">
            {d.demande.top.map((x) => <Meter key={`${x.commune}-${x.type}`} label={`${x.type} · ${x.commune}`} value={x.n30} max={maxDem} sub={`${x.n30} recherches${x.budget ? ` · budget ${Fc(x.budget)}` : ""}`} />)}
            {!d.demande.top.length ? <li className="text-sm text-muted">Aucune recherche enregistrée.</li> : null}
          </ul>
        </Section>
        <Section title="Demande sans offre" sub="Recherches qui n’ont trouvé aucune annonce : des biens à capter en priorité.">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-1.5">Recherche</th><th className="py-1.5 text-right">Sans résultat 7 j</th><th className="py-1.5 text-right">30 j</th><th className="py-1.5 text-right">Budget médian</th></tr></thead>
            <tbody>
              {d.demande.sansOffre.map((x) => (
                <tr key={`${x.commune}-${x.type}`} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{x.type} · {x.commune}</td>
                  <td className="py-2 text-right font-bold tabular-nums text-amber-700">{x.zero7}</td>
                  <td className="py-2 text-right tabular-nums">{x.zero30}</td>
                  <td className="py-2 text-right tabular-nums">{Fc(x.budget)}</td>
                </tr>
              ))}
              {!d.demande.sansOffre.length ? <tr><td colSpan={4} className="py-6 text-center text-muted">Toutes les recherches ont trouvé des annonces.</td></tr> : null}
            </tbody>
          </table>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Section title="Départs de locataires signalés" sub="QR « signaler mon départ » des logements (30 jours) : des biens bientôt libres.">
          <ul className="divide-y divide-slate-100 text-sm">
            {d.departs.map((x, i) => <li key={i} className="flex justify-between py-2"><span>{x.type} · {x.quartier || x.commune}{x.commune && x.quartier ? <span className="text-muted">, {x.commune}</span> : null}</span><b className="tabular-nums">{x.n}</b></li>)}
            {!d.departs.length ? <li className="py-4 text-center text-muted">Aucun départ signalé.</li> : null}
          </ul>
          <Link href="/admin/moboo-pro/departs" className="mt-2 inline-block text-sm font-semibold text-brand-800 hover:underline">Voir les départs →</Link>
        </Section>
        <Section title="Annonceurs les plus actifs" sub="Comptes Moboo.ci qui publient le plus dans ce périmètre.">
          <ol className="divide-y divide-slate-100 text-sm">
            {d.editeurs.map((x, i) => (
              <li key={x.id} className="flex items-center gap-3 py-2">
                <span className="w-5 text-right text-xs font-bold text-slate-400">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{x.username ? <a href={`/pro/${x.username}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{x.nom}</a> : <span className="font-medium">{x.nom}</span>}<span className="ml-1 text-xs text-muted">{x.type}</span></span>
                <b className="tabular-nums">{x.annonces}</b>
              </li>
            ))}
            {!d.editeurs.length ? <li className="py-4 text-center text-muted">Aucun annonceur.</li> : null}
          </ol>
        </Section>
        <Section title="Terrain : prix de référence au m²" sub="Grille « marché » des estimations foncières (source indiquée), pour comparer aux annonces.">
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto text-sm">
            {d.foncier.map((x) => (
              <li key={`${x.zone}-${x.usage}`} className="flex justify-between gap-3 py-2">
                <span className="min-w-0"><span className="font-medium">{x.zone}</span><span className="block text-[11px] text-muted">{x.commune} · {x.usage} · {x.source}</span></span>
                <span className="text-right tabular-nums"><b>{F(x.priceSqm)}</b>/m²{x.priceMin && x.priceMax && x.priceMin !== x.priceMax ? <span className="block text-[11px] text-muted">{F(x.priceMin)} – {F(x.priceMax)}</span> : null}</span>
              </li>
            ))}
            {!d.foncier.length ? <li className="py-4 text-center text-muted">Pas de référence pour cette commune.</li> : null}
          </ul>
        </Section>
      </div>

      <p className="text-xs text-muted">
        Sources : annonces publiées sur Moboo.ci (site et appli), catalogues envoyés par les agences partenaires avec leur accord (non publiés), chiffres publiés saisis avec leur source, baux actifs Moboo Pro (agrégés), recherches anonymes des visiteurs, départs signalés par QR, grille foncière des estimations.
        Aucune donnée n’est copiée d’autres sites. Calcul du {new Date(d.version).toLocaleString("fr-FR")}, recalculé toutes les 5 minutes ; variations comparées aux relevés quotidiens.
      </p>
    </div>
  );
}
