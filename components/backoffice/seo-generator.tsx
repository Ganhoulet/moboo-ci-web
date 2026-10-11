"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  planAction, refreshAction, removeGeneratedAction, runAction,
  type GenPlan, type GenSpec, type GenZone, type Opportunity,
} from "@/app/admin/seo/generateur/actions";

const TX = [
  { v: "rent", l: "Location" }, { v: "sale", l: "Vente" }, { v: "furnished", l: "Résidences meublées" }, { v: "event", l: "Espaces événementiels" },
];
const TYPES = [
  { v: "appartement", l: "Appartement" }, { v: "villa", l: "Villa" }, { v: "maison", l: "Maison" }, { v: "studio", l: "Studio" },
  { v: "terrain", l: "Terrain" }, { v: "bureau", l: "Bureau" }, { v: "magasin", l: "Magasin" },
];
const MODS = [
  { v: "pas-cher", l: "« pas cher »" }, { v: "1-chambre", l: "1 chambre" }, { v: "2-chambres", l: "2 chambres" },
  { v: "3-chambres", l: "3 chambres" }, { v: "4-chambres-et-plus", l: "4 chambres et +" },
];
const LEVEL: Record<string, string> = { pays: "Pays", ville: "Ville", commune: "Commune", quartier: "Quartier" };
const TXL: Record<string, string> = { rent: "Location", sale: "Vente", furnished: "Meublé", event: "Espace", hub: "Quartier" };

function Checks({ items, value, onChange }: { items: { v: string; l: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => {
        const on = value.includes(i.v);
        return (
          <button key={i.v} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== i.v) : [...value, i.v])}
            className={"rounded-full px-3 py-1.5 text-sm font-semibold ring-1 " + (on ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-ink ring-slate-300 hover:ring-ink")}>
            {i.l}
          </button>
        );
      })}
    </div>
  );
}

/** Générateur SEO : choix des combinaisons, aperçu chiffré, génération, opportunités. */
export function SeoGenerator({ zones, opportunities }: { zones: GenZone[]; opportunities: Opportunity[] }) {
  const [spec, setSpec] = useState<GenSpec>({ tx: ["rent", "sale", "furnished", "event"], types: TYPES.map((t) => t.v), zones: [], mods: ["pas-cher", "2-chambres", "3-chambres"], national: true, hubs: true });
  const [filter, setFilter] = useState("");
  const [plan, setPlan] = useState<GenPlan | null>(null);
  const [onlyIdx, setOnlyIdx] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (p: Partial<GenSpec>) => { setSpec((s) => ({ ...s, ...p })); setPlan(null); };

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return zones.filter((z) => z.level !== "pays" && (!q || z.name.toLowerCase().includes(q) || z.city.toLowerCase().includes(q)));
  }, [zones, filter]);
  const rows = (plan?.rows ?? []).filter((r) => !onlyIdx || r.indexable);

  const preview = () => start(async () => {
    setMsg(null);
    const r = await planAction(spec);
    if (r.ok && r.plan) setPlan(r.plan); else setMsg({ ok: false, text: r.error ?? "Aperçu impossible." });
  });
  const run = (s: GenSpec = spec) => start(async () => {
    const r = await runAction(s);
    setMsg(r.ok ? { ok: true, text: `${r.created} page(s) créée(s), ${r.updated} mise(s) à jour, ${r.skipped} ignorée(s) (trop peu d’annonces ou page manuelle).` } : { ok: false, text: r.error ?? "Génération impossible." });
    if (r.ok) setPlan(null);
  });

  return (
    <div className="space-y-5">
      {msg ? <p className={"rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>{msg.text}</p> : null}

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-ink">1. Ce qu’il faut générer</h2>
        <div className="mt-3 space-y-4">
          <div><p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Transactions</p><Checks items={TX} value={spec.tx} onChange={(tx) => set({ tx })} /></div>
          <div><p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Types de bien (location et vente)</p><Checks items={TYPES} value={spec.types} onChange={(types) => set({ types })} /></div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Pages de longue traîne</p>
            <Checks items={MODS} value={spec.mods} onChange={(mods) => set({ mods })} />
            <p className="mt-1 text-xs text-muted">« 2 chambres » : appartements, villas et maisons seulement. « Pas cher » : le quart le moins cher des annonces de la zone.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={spec.hubs} onChange={(e) => set({ hubs: e.target.checked })} /> Pages quartier « Immobilier à … »</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={spec.national} onChange={(e) => set({ national: e.target.checked })} /> Pages « en Côte d’Ivoire »</label>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-semibold text-ink">2. Zones</h2>
            <p className="text-xs text-muted">{spec.zones.length ? `${spec.zones.length} zone(s) choisie(s)` : "Aucune sélection : toutes les zones où il y a des annonces."}</p>
          </div>
          <div className="flex gap-2">
            <input className="input w-48 text-sm" placeholder="Filtrer (Cocody, Bouaké…)" value={filter} onChange={(e) => setFilter(e.target.value)} />
            {spec.zones.length ? <button type="button" className="text-sm font-semibold text-brand-800" onClick={() => set({ zones: [] })}>Toutes</button> : null}
          </div>
        </div>
        <div className="mt-3 max-h-72 overflow-y-auto rounded-md ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs text-muted">
              <tr><th className="p-2" /><th className="p-2">Zone</th><th className="p-2">Niveau</th><th className="p-2 text-right">Location</th><th className="p-2 text-right">Vente</th><th className="p-2 text-right">Meublés</th><th className="p-2 text-right">Espaces</th><th className="p-2">Guide</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((z) => {
                const on = spec.zones.includes(z.slug);
                return (
                  <tr key={z.slug} className={on ? "bg-brand-50" : ""}>
                    <td className="p-2"><input type="checkbox" aria-label={z.name} checked={on} onChange={() => set({ zones: on ? spec.zones.filter((x) => x !== z.slug) : [...spec.zones, z.slug] })} /></td>
                    <td className="p-2 font-semibold text-ink">{z.name}{z.city && z.city !== z.name ? <span className="font-normal text-muted"> · {z.city}</span> : null}</td>
                    <td className="p-2 text-muted">{LEVEL[z.level] ?? z.level}</td>
                    <td className="p-2 text-right">{z.rent || "–"}</td><td className="p-2 text-right">{z.sale || "–"}</td>
                    <td className="p-2 text-right">{z.furnished || "–"}</td><td className="p-2 text-right">{z.event || "–"}</td>
                    <td className="p-2"><Link href={`/admin/seo/quartiers/${z.slug}`} className="text-xs font-semibold text-brand-800 hover:underline">{z.guide === "published" ? "Publié" : z.guide ? "Brouillon" : "Rédiger"}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-ink">3. Aperçu puis génération</h2>
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={preview} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">{pending && !plan ? "Calcul…" : "Voir l’aperçu"}</button>
            <button type="button" disabled={pending || !plan || !(plan.create + plan.update)} onClick={() => run()} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-40">
              {pending && plan ? "Génération…" : plan ? `Générer ${plan.create + plan.update} page(s)` : "Générer"}
            </button>
          </div>
        </div>
        {plan ? (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
              {[["Combinaisons", plan.total], ["À créer", plan.create], ["À mettre à jour", plan.update], ["Indexables par Google", plan.indexable], ["Ignorées", plan.skipped + plan.manual]].map(([k, v]) => (
                <div key={k} className="rounded-md bg-slate-50 p-2 ring-1 ring-slate-200"><p className="text-xs text-muted">{k}</p><p className="font-display text-lg font-bold text-ink">{Number(v).toLocaleString("fr-FR")}</p></div>
              ))}
            </div>
            <p className="text-xs text-muted">
              Une page n’est proposée à Google qu’à partir de {plan.minIndex} annonce(s) ; en dessous elle reste visible mais en « noindex », pour ne pas pénaliser le site avec des pages vides.
              Les pages créées à la main ne sont jamais modifiées.
            </p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyIdx} onChange={(e) => setOnlyIdx(e.target.checked)} /> Seulement les pages indexables</label>
            <div className="max-h-[28rem] overflow-y-auto rounded-md ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs text-muted"><tr><th className="p-2">Page</th><th className="p-2">Type</th><th className="p-2 text-right">Annonces</th><th className="p-2">Google</th><th className="p-2">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 500).map((r) => (
                    <tr key={r.slug}>
                      <td className="p-2"><p className="font-semibold text-ink">{r.title}</p><p className="font-mono text-xs text-muted">/{r.slug}</p></td>
                      <td className="p-2 text-muted">{TXL[r.tx] ?? r.tx}</td>
                      <td className="p-2 text-right">{r.count}</td>
                      <td className="p-2">{r.indexable ? <span className="text-emerald-700">Indexée</span> : <span className="text-slate-500">noindex</span>}</td>
                      <td className="p-2 text-xs">{r.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 500 ? <p className="text-xs text-muted">500 premières lignes sur {rows.length.toLocaleString("fr-FR")} (triées par nombre d’annonces).</p> : null}
          </div>
        ) : <p className="mt-2 text-sm text-muted">L’aperçu calcule chaque page possible avec le nombre réel d’annonces, avant de créer quoi que ce soit.</p>}
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-ink">Opportunités : ce que cherchent les visiteurs</h2>
        <p className="text-xs text-muted">Recherches des 90 derniers jours (site et application) par quartier et type de bien. Les pages qui manquent sont en tête.</p>
        {opportunities.length ? (
          <div className="mt-3 max-h-96 overflow-y-auto rounded-md ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs text-muted"><tr><th className="p-2">Page</th><th className="p-2 text-right">Recherches</th><th className="p-2 text-right">Résultats moy.</th><th className="p-2" /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities.map((o) => (
                  <tr key={o.slug}>
                    <td className="p-2"><p className="font-semibold text-ink">{o.title}</p><p className="font-mono text-xs text-muted">/{o.slug}</p></td>
                    <td className="p-2 text-right">{o.searches}</td>
                    <td className="p-2 text-right">{o.avgResults}</td>
                    <td className="p-2 text-right">
                      {o.exists ? <Link href={`/${o.slug}`} target="_blank" className="text-xs font-semibold text-emerald-700 hover:underline">Page en ligne</Link> : (
                        <button type="button" disabled={pending} className="text-xs font-semibold text-brand-800 hover:underline"
                          onClick={() => run({ tx: o.tx === "hub" ? [] : [o.tx], types: o.type ? [o.type] : [], zones: [o.zone], mods: [], national: false, hubs: o.tx === "hub" })}>
                          Créer la page
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-2 text-sm text-muted">Pas encore assez de recherches enregistrées.</p>}
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-ink">Entretien</h2>
        <p className="text-xs text-muted">Chaque nuit, les pages générées sont recontrôlées : nombre d’annonces, prix, titres et indexation. Vous pouvez le lancer maintenant.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={pending} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-ink"
            onClick={() => start(async () => { const r = await refreshAction(); setMsg(r.ok ? { ok: true, text: `${r.checked} page(s) contrôlée(s), ${r.indexable} indexable(s).` } : { ok: false, text: r.error ?? "Contrôle impossible." }); })}>
            Contrôler maintenant
          </button>
          <button type="button" disabled={pending || !spec.zones.length} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40"
            onClick={() => { if (confirm(`Supprimer toutes les pages générées des ${spec.zones.length} zone(s) choisie(s) ?`)) start(async () => {
              let n = 0;
              for (const z of spec.zones) { const r = await removeGeneratedAction({ zone: z }); n += r.deleted ?? 0; }
              setMsg({ ok: true, text: `${n} page(s) générée(s) supprimée(s).` });
            }); }}>
            Supprimer les pages des zones choisies
          </button>
        </div>
      </section>
    </div>
  );
}
