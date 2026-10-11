"use client";

import { useState, useTransition } from "react";
import { checkAllBacklinksAction, checkBacklinkAction, deleteBacklinkAction, saveBacklinkAction, type Backlink, type BacklinkStats } from "@/app/admin/seo/backlinks/actions";

const KINDS: [string, string][] = [["partenaire", "Partenaire"], ["media", "Média / presse"], ["annuaire", "Annuaire"], ["blog", "Blog"], ["reseau", "Réseau social / forum"], ["autre", "Autre"]];
const STATUSES: [string, string, string][] = [
  ["a-contacter", "À contacter", "bg-slate-100 text-slate-700"], ["en-cours", "En discussion", "bg-amber-50 text-amber-800"],
  ["obtenu", "Obtenu", "bg-emerald-50 text-emerald-800"], ["perdu", "Perdu", "bg-red-50 text-red-700"], ["refuse", "Refusé", "bg-slate-100 text-slate-500"],
];
const IDEAS = [
  "Médias ivoiriens (Abidjan.net, Linfodrome, Fratmat…) : article sur l’indice des prix des loyers par quartier.",
  "Annuaires d’entreprises ivoiriens et africains (fiche Moboo avec lien vers moboo.ci).",
  "Agences partenaires : lien « Nos annonces sur Moboo.ci » vers leur page pro.",
  "Résidences meublées et salles partenaires : badge « Réservez sur Moboo.ci ».",
  "Blogs expatriés / diaspora : guide « Où habiter à Abidjan » avec lien vers les pages quartier.",
  "Écoles, banques, notaires, déménageurs : page « partenaires » avec lien réciproque.",
];
const empty = { sourceUrl: "", sourceName: "", kind: "partenaire", targetPath: "/", anchor: "", status: "a-contacter", contact: "", notes: "" };
const d = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "—");

export function BacklinksManager({ items, stats }: { items: Backlink[]; stats: BacklinkStats }) {
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [filter, setFilter] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (p: Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => { const r = await p; setMsg(r.ok ? { ok: true, text: ok } : { ok: false, text: r.error ?? "Action impossible." }); });
  const rows = items.filter((b) => !filter || b.status === filter);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["Liens suivis", stats.total], ["Obtenus", stats.obtenu], ["En ligne (vérifiés)", stats.live], ["Dont « follow »", stats.follow], ["Perdus", stats.perdu]].map(([k, v]) => (
          <div key={String(k)} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">{v}</p></div>
        ))}
      </div>
      {msg ? <p className={"rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>{msg.text}</p> : null}

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-ink">{form.id ? "Modifier le lien" : "Ajouter un lien (obtenu ou à obtenir)"}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="space-y-1 md:col-span-2"><span className="text-xs font-semibold text-ink">Page qui contient le lien</span><input className="input text-sm" placeholder="https://www.exemple.ci/article-immobilier" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-ink">Nom du site</span><input className="input text-sm" placeholder="Abidjan.net" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-ink">Page de moboo.ci visée</span><input className="input text-sm" placeholder="/immobilier/cocody" value={form.targetPath} onChange={(e) => setForm({ ...form, targetPath: e.target.value })} /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-ink">Texte du lien souhaité</span><input className="input text-sm" placeholder="location appartement Cocody" value={form.anchor} onChange={(e) => setForm({ ...form, anchor: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1"><span className="text-xs font-semibold text-ink">Type</span><select className="input text-sm" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-ink">Statut</span><select className="input text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          </div>
          <label className="space-y-1"><span className="text-xs font-semibold text-ink">Contact</span><input className="input text-sm" placeholder="Nom, e-mail, téléphone" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></label>
          <label className="space-y-1 md:col-span-2"><span className="text-xs font-semibold text-ink">Notes</span><input className="input text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={pending} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            onClick={() => run(saveBacklinkAction(form.id ?? null, form).then((r) => { if (r.ok) setForm(empty); return r; }), form.status === "obtenu" ? "Enregistré et vérifié sur la page." : "Enregistré.")}>
            {form.id ? "Enregistrer" : "Ajouter"}
          </button>
          {form.id ? <button type="button" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setForm(empty)}>Annuler</button> : null}
        </div>
      </section>

      <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setFilter("")} className={"rounded-full px-3 py-1 text-xs font-semibold " + (!filter ? "bg-ink text-white" : "bg-slate-100 text-ink")}>Tous</button>
            {STATUSES.map(([v, l]) => <button key={v} type="button" onClick={() => setFilter(v)} className={"rounded-full px-3 py-1 text-xs font-semibold " + (filter === v ? "bg-ink text-white" : "bg-slate-100 text-ink")}>{l}</button>)}
          </div>
          <button type="button" disabled={pending} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold" onClick={() => run(checkAllBacklinksAction(), "Liens vérifiés.")}>Tout vérifier maintenant</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="px-3 py-2">Site</th><th className="px-3 py-2">Vers</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2">Sur la page</th><th className="px-3 py-2">Vérifié</th><th className="px-3 py-2" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((b) => {
                const st = STATUSES.find((s) => s[0] === b.status);
                return (
                  <tr key={b.id}>
                    <td className="px-3 py-2"><p className="font-semibold text-ink">{b.sourceName || new URL(b.sourceUrl).hostname}</p><a href={b.sourceUrl} target="_blank" rel="noopener" className="block max-w-xs truncate text-xs text-brand-800 hover:underline">{b.sourceUrl}</a></td>
                    <td className="px-3 py-2"><p className="font-mono text-xs">{b.targetPath}</p>{b.anchor ? <p className="text-xs text-muted">« {b.anchor} »</p> : null}</td>
                    <td className="px-3 py-2"><span className={"rounded px-2 py-0.5 text-xs font-semibold " + (st?.[2] ?? "")}>{st?.[1] ?? b.status}</span></td>
                    <td className="px-3 py-2 text-xs">{b.live == null ? "—" : b.live ? <span className="text-emerald-700">Lien présent{b.follow === false ? " (nofollow)" : ""}</span> : <span className="text-red-700">Lien absent</span>}{b.lastError ? <p className="text-red-700">{b.lastError}</p> : null}</td>
                    <td className="px-3 py-2 text-xs text-muted">{d(b.lastCheckedAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                      <button type="button" className="font-semibold text-brand-800 hover:underline" onClick={() => run(checkBacklinkAction(b.id), "Vérification faite.")}>Vérifier</button>{" · "}
                      <button type="button" className="font-semibold text-ink hover:underline" onClick={() => setForm({ id: b.id, sourceUrl: b.sourceUrl, sourceName: b.sourceName, kind: b.kind, targetPath: b.targetPath, anchor: b.anchor, status: b.status, contact: b.contact, notes: b.notes })}>Modifier</button>{" · "}
                      <button type="button" className="font-semibold text-red-700 hover:underline" onClick={() => { if (confirm("Supprimer ce lien du suivi ?")) run(deleteBacklinkAction(b.id), "Supprimé."); }}>Supprimer</button>
                    </td>
                  </tr>
                );
              })}
              {!rows.length ? <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">Aucun lien pour l’instant.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-ink">Où chercher des liens</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">{IDEAS.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="mt-2 text-xs text-muted">Visez de vrais sites ivoiriens et africains. Les liens achetés en masse ou échangés en réseau sont sanctionnés par Google.</p>
      </section>
    </div>
  );
}
