"use client";

import { useMemo, useState, useTransition } from "react";
import type { LayoutView, LayoutsConfig, ResultLayout } from "@/lib/result-layouts";
import { saveLayoutsAction, type LayoutsView } from "@/app/admin/accueil/resultats/actions";

const VIEWS: { v: LayoutView; l: string; d: string }[] = [
  { v: "map-left", l: "Carte à gauche", d: "Annonces à droite (façon Zillow)" },
  { v: "map-right", l: "Carte à droite", d: "Annonces à gauche (façon Airbnb)" },
  { v: "map-top", l: "Carte en haut", d: "Annonces en dessous" },
  { v: "map-full", l: "Carte plein écran", d: "Liste compacte qui défile à côté" },
  { v: "standard", l: "Sans carte", d: "Grille ou liste seule" },
];
const MARKERS: { v: ResultLayout["marker"]; l: string }[] = [
  { v: "dot", l: "Points" }, { v: "price", l: "Prix" }, { v: "pin", l: "Épingles" },
];
const TABS: { v: string; l: string }[] = [
  { v: "search:all", l: "Recherche — Tout" }, { v: "search:rent", l: "Recherche — À louer" }, { v: "search:sale", l: "Recherche — À vendre" },
  { v: "search:furnished", l: "Recherche — Meublés" }, { v: "search:event", l: "Recherche — Espaces" },
  { v: "search:near", l: "Autour de moi (recherche par point)" }, { v: "agent", l: "Annonces d’un agent / d’une agence" },
];

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Schéma miniature d'un modèle (carte en orange avec ses points, annonces en blocs). */
export function LayoutThumb({ l, className = "h-20 w-32" }: { l: Pick<ResultLayout, "view" | "mapWidth" | "listStyle" | "columns" | "mapHeight">; className?: string }) {
  const W = 128, H = 80, p = 4;
  const cards = (x: number, y: number, w: number, h: number, cols: number, list: boolean) => {
    const out: JSX.Element[] = [];
    const c = list ? 1 : Math.max(1, Math.min(cols, 4));
    const rows = list ? 4 : 3;
    const cw = (w - (c - 1) * 3) / c, ch = (h - (rows - 1) * 3) / rows;
    for (let r = 0; r < rows; r++) for (let i = 0; i < c; i++) out.push(<rect key={`${r}-${i}`} x={x + i * (cw + 3)} y={y + r * (ch + 3)} width={cw} height={ch} rx="2" fill="#cbd5e1" />);
    return out;
  };
  const map = (x: number, y: number, w: number, h: number) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill="#dbeafe" />
      {[[0.3, 0.3], [0.6, 0.45], [0.45, 0.7], [0.75, 0.25], [0.2, 0.6]].map(([a, b], i) => <circle key={i} cx={x + w * a} cy={y + h * b} r="2.6" fill="#ea580c" stroke="#fff" strokeWidth="1" />)}
    </g>
  );
  const mw = ((W - 3 * p) * l.mapWidth) / 100;
  let body: JSX.Element;
  if (l.view === "standard") body = <g>{cards(p, p, W - 2 * p, H - 2 * p, l.columns, l.listStyle === "list")}</g>;
  else if (l.view === "map-top") {
    const mh = { small: 22, medium: 30, large: 38 }[l.mapHeight];
    body = <g>{map(p, p, W - 2 * p, mh)}{cards(p, p + mh + 4, W - 2 * p, H - 2 * p - mh - 4, l.columns, l.listStyle === "list")}</g>;
  } else {
    const left = l.view !== "map-right";
    const lw = W - 3 * p - mw;
    const list = l.listStyle === "list" || l.view === "map-full";
    body = left
      ? <g>{map(p, p, mw, H - 2 * p)}{cards(2 * p + mw, p, lw, H - 2 * p, Math.min(l.columns, 2), list)}</g>
      : <g>{cards(p, p, lw, H - 2 * p, Math.min(l.columns, 2), list)}{map(2 * p + lw, p, mw, H - 2 * p)}</g>;
  }
  return <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true"><rect width={W} height={H} rx="6" fill="#f8fafc" stroke="#e2e8f0" />{body}</svg>;
}

export function ResultLayoutsEditor({ initial, seoPages, communes }: { initial: LayoutsView; seoPages: { slug: string; title: string }[]; communes: readonly string[] }) {
  const [cfg, setCfg] = useState<LayoutsConfig>(initial.config);
  const [sel, setSel] = useState(initial.config.defaultId);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [newTarget, setNewTarget] = useState({ kind: "tab", value: "search:rent", layoutId: initial.config.layouts[0]?.id ?? "" });
  const cur = cfg.layouts.find((l) => l.id === sel) ?? cfg.layouts[0];
  const names = useMemo(() => new Map(cfg.layouts.map((l) => [l.id, l.name])), [cfg.layouts]);

  const touch = (c: LayoutsConfig) => { setCfg(c); setMsg(null); };
  const patch = (p: Partial<ResultLayout>) => touch({ ...cfg, layouts: cfg.layouts.map((l) => (l.id === cur.id ? { ...l, ...p } : l)) });
  const add = (base: ResultLayout) => {
    let id = slug(base.name) || "modele", n = 2;
    while (cfg.layouts.some((l) => l.id === id)) id = `${slug(base.name) || "modele"}-${n++}`;
    touch({ ...cfg, layouts: [...cfg.layouts, { ...base, id, name: cfg.layouts.some((l) => l.name === base.name) ? `${base.name} (copie)` : base.name }] });
    setSel(id);
  };
  const remove = () => {
    if (cfg.layouts.length < 2) return;
    const layouts = cfg.layouts.filter((l) => l.id !== cur.id);
    touch({ defaultId: cfg.defaultId === cur.id ? layouts[0].id : cfg.defaultId, layouts, assignments: cfg.assignments.filter((a) => a.layoutId !== cur.id) });
    setSel(layouts[0].id);
  };
  const targetLabel = (t: string) => {
    const tab = TABS.find((x) => x.v === t);
    if (tab) return tab.l;
    if (t.startsWith("zone:")) return `Recherche sur « ${communes.find((c) => slug(c) === t.slice(5)) ?? t.slice(5)} »`;
    if (t.startsWith("seo:")) return `Page SEO « ${seoPages.find((p) => p.slug === t.slice(4))?.title ?? t.slice(4)} »`;
    return t;
  };
  const previewHref = (t: string) => {
    if (t.startsWith("seo:")) return `/${t.slice(4)}`;
    if (t.startsWith("zone:")) return `/annonces?q=${encodeURIComponent(communes.find((c) => slug(c) === t.slice(5)) ?? t.slice(5))}`;
    if (t === "search:near") return "/annonces?lat=5.3599&lng=-3.9870&radius=3";
    if (t === "agent") return null;
    const tx = t.slice(7);
    return tx === "all" ? "/annonces" : `/annonces?transaction=${tx}`;
  };
  const addAssignment = () => {
    const target = newTarget.kind === "zone" ? (newTarget.value ? `zone:${slug(newTarget.value)}` : "") : newTarget.kind === "seo" ? (newTarget.value ? `seo:${newTarget.value}` : "") : newTarget.value;
    if (!target || !newTarget.layoutId) return;
    touch({ ...cfg, assignments: [...cfg.assignments.filter((a) => a.target !== target), { target, layoutId: newTarget.layoutId }] });
  };
  const save = () => start(async () => {
    const r = await saveLayoutsAction(cfg);
    if (r.ok && r.view) { setCfg(r.view.config); setMsg({ ok: true, text: "Enregistré ✓ — appliqué sur le site." }); }
    else setMsg({ ok: false, text: r.error ?? "Erreur." });
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">Modèles</h2>
          <div className="flex flex-wrap gap-2">
            <select className="input w-auto py-1.5 text-sm" value="" onChange={(e) => { const p = initial.presets.find((x) => x.id === e.target.value); if (p) add(p); }} aria-label="Ajouter un modèle">
              <option value="">+ Ajouter un modèle…</option>
              {initial.presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cfg.layouts.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => setSel(l.id)} aria-pressed={l.id === cur.id}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${l.id === cur.id ? "border-brand-700 bg-brand-50 ring-2 ring-brand-700/20" : "border-slate-200 hover:border-slate-300"}`}>
                <LayoutThumb l={l} className="h-14 w-24 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{l.name}</span>
                  <span className="block text-xs text-muted">{cfg.defaultId === l.id ? "★ Par défaut" : `${cfg.assignments.filter((a) => a.layoutId === l.id).length} page(s)`}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {cur ? (
        <section className="grid gap-6 rounded-xl bg-white p-5 ring-1 ring-slate-200 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block min-w-[16rem] flex-1">
                <span className="mb-1 block text-sm font-semibold text-ink">Nom du modèle</span>
                <input className="input" value={cur.name} maxLength={80} onChange={(e) => patch({ name: e.target.value })} />
              </label>
              {cfg.defaultId === cur.id ? <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">★ Modèle par défaut</span>
                : <button type="button" onClick={() => touch({ ...cfg, defaultId: cur.id })} className="btn-ghost text-sm">★ Utiliser par défaut</button>}
              <button type="button" onClick={() => add(cur)} className="btn-ghost text-sm">Dupliquer</button>
              {cfg.layouts.length > 1 ? <button type="button" onClick={remove} className="btn-ghost text-sm text-red-600">Supprimer</button> : null}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Disposition</p>
              <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {VIEWS.map((v) => (
                  <button key={v.v} type="button" onClick={() => patch({ view: v.v })} aria-pressed={cur.view === v.v}
                    className={`rounded-xl border p-2 text-left ${cur.view === v.v ? "border-brand-700 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <LayoutThumb l={{ ...cur, view: v.v }} className="h-16 w-full" />
                    <span className="mt-1 block text-xs font-semibold text-ink">{v.l}</span>
                    <span className="block text-[11px] leading-tight text-muted">{v.d}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {cur.view === "map-left" || cur.view === "map-right" || cur.view === "map-full" ? (
                <label className="block">
                  <span className="mb-1 flex justify-between text-sm font-semibold text-ink">Largeur de la carte <span className="text-brand-800">{cur.mapWidth} %</span></span>
                  <input type="range" min={35} max={60} step={5} value={cur.mapWidth} onChange={(e) => patch({ mapWidth: Number(e.target.value) })} className="w-full accent-brand-800" />
                  <span className="flex justify-between text-[11px] text-muted"><span>Plus d’annonces</span><span>Plus de carte</span></span>
                </label>
              ) : null}
              {cur.view === "map-top" ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-ink">Hauteur de la carte</span>
                  <select className="input" value={cur.mapHeight} onChange={(e) => patch({ mapHeight: e.target.value as ResultLayout["mapHeight"] })}>
                    <option value="small">Petite (280 px)</option><option value="medium">Moyenne (420 px)</option><option value="large">Grande (560 px)</option>
                  </select>
                </label>
              ) : null}
              {cur.view !== "map-full" ? (
                <div>
                  <span className="mb-1 block text-sm font-semibold text-ink">Annonces</span>
                  <div className="flex flex-wrap gap-2">
                    {[{ v: "grid", l: "Cartes" }, { v: "list", l: "Liste détaillée" }].map((o) => (
                      <button key={o.v} type="button" onClick={() => patch({ listStyle: o.v as ResultLayout["listStyle"], columns: o.v === "list" ? 1 : Math.max(2, cur.columns) })} aria-pressed={cur.listStyle === o.v}
                        className={`rounded-full border px-3 py-1 text-sm font-medium ${cur.listStyle === o.v ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 text-slate-700"}`}>{o.l}</button>
                    ))}
                    {cur.listStyle === "grid" ? (
                      <select className="input w-auto py-1 text-sm" value={cur.columns} onChange={(e) => patch({ columns: Number(e.target.value) })} aria-label="Colonnes">
                        {(cur.view === "standard" || cur.view === "map-top" ? [2, 3, 4] : [1, 2, 3]).map((n) => <option key={n} value={n}>{n} colonne{n > 1 ? "s" : ""} max.</option>)}
                      </select>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {cur.view !== "standard" ? (
                <div>
                  <span className="mb-1 block text-sm font-semibold text-ink">Repères sur la carte</span>
                  <div className="flex flex-wrap gap-2">
                    {MARKERS.map((m) => (
                      <button key={m.v} type="button" onClick={() => patch({ marker: m.v })} aria-pressed={cur.marker === m.v}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${cur.marker === m.v ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 text-slate-700"}`}>
                        {m.v === "dot" ? <span className="h-2.5 w-2.5 rounded-full bg-accent-600 ring-2 ring-white" /> : m.v === "price" ? <span className="rounded-full bg-brand-900 px-1.5 text-[10px] font-bold text-white">250 k</span> : <span aria-hidden="true">📍</span>}
                        {m.l}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {cur.view !== "standard" ? (
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={cur.autoLoad} onChange={(e) => patch({ autoLoad: e.target.checked })} />
                  <span><span className="font-semibold text-ink">Charger les biens en déplaçant la carte</span><span className="block text-xs text-muted">Le visiteur explore une zone : les annonces localisées s’ajoutent sur la carte.</span></span>
                </label>
              ) : null}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Aperçu</p>
            <LayoutThumb l={cur} className="h-auto w-full" />
            <p className="mt-2 text-xs text-muted">Sur téléphone, la liste s’affiche d’abord avec un bouton « Voir la carte ».</p>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="font-display text-lg font-bold text-ink">Pages où appliquer les modèles</h2>
        <p className="mt-1 text-sm text-muted">Le réglage le plus précis l’emporte : page SEO, puis commune recherchée, puis onglet de recherche. Ailleurs : le modèle par défaut (« {names.get(cfg.defaultId)} »).</p>
        {cfg.assignments.length ? (
          <table className="mt-4 w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted"><th className="py-2">Page</th><th className="py-2">Modèle</th><th /></tr></thead>
            <tbody>
              {cfg.assignments.map((a) => (
                <tr key={a.target} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-ink">{targetLabel(a.target)}</td>
                  <td className="py-2 pr-3">
                    <select className="input py-1 text-sm" value={a.layoutId} onChange={(e) => touch({ ...cfg, assignments: cfg.assignments.map((x) => (x.target === a.target ? { ...x, layoutId: e.target.value } : x)) })}>
                      {cfg.layouts.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </td>
                  <td className="whitespace-nowrap py-2 text-right">
                    {previewHref(a.target) ? <a href={previewHref(a.target)!} target="_blank" className="mr-3 text-xs font-semibold text-brand-800 hover:underline">Voir ↗</a> : null}
                    <button type="button" onClick={() => touch({ ...cfg, assignments: cfg.assignments.filter((x) => x.target !== a.target) })} className="text-xs font-semibold text-red-600 hover:underline">Retirer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-muted">Aucune page particulière : le modèle par défaut s’applique partout.</p>}

        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Type de page</span>
            <select className="input py-1.5 text-sm" value={newTarget.kind} onChange={(e) => setNewTarget({ ...newTarget, kind: e.target.value, value: e.target.value === "tab" ? "search:rent" : "" })}>
              <option value="tab">Onglet de recherche</option><option value="zone">Commune / quartier recherché</option><option value="seo">Page SEO</option>
            </select>
          </label>
          <label className="block min-w-[14rem] flex-1">
            <span className="mb-1 block text-xs font-semibold text-muted">Page</span>
            {newTarget.kind === "tab" ? (
              <select className="input py-1.5 text-sm" value={newTarget.value} onChange={(e) => setNewTarget({ ...newTarget, value: e.target.value })}>
                {TABS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            ) : newTarget.kind === "zone" ? (
              <>
                <input className="input py-1.5 text-sm" list="layout-communes" value={newTarget.value} placeholder="Ex. Cocody, Riviera 3…" onChange={(e) => setNewTarget({ ...newTarget, value: e.target.value })} />
                <datalist id="layout-communes">{communes.map((c) => <option key={c} value={c} />)}</datalist>
              </>
            ) : (
              <select className="input py-1.5 text-sm" value={newTarget.value} onChange={(e) => setNewTarget({ ...newTarget, value: e.target.value })}>
                <option value="">— Choisir une page SEO —</option>
                {seoPages.map((p) => <option key={p.slug} value={p.slug}>{p.title} (/{p.slug})</option>)}
              </select>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">Modèle</span>
            <select className="input py-1.5 text-sm" value={newTarget.layoutId} onChange={(e) => setNewTarget({ ...newTarget, layoutId: e.target.value })}>
              {cfg.layouts.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={addAssignment} className="btn-ghost text-sm">Appliquer</button>
        </div>
      </section>

      {msg ? <p className={"rounded-lg p-3 text-sm font-medium " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}
      <button type="button" onClick={save} disabled={pending} className="btn-primary bg-brand-800 px-8 hover:bg-brand-900 disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer"}</button>
    </div>
  );
}
