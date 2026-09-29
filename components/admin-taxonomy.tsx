"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTaxonomyAction, editTaxonomyAction, removeTaxonomyAction, type AdminTaxItem } from "@/app/admin/immobilier/actions";

/** Une liste du back-office Immobilier : ajouter, renommer, couleur, ville parente, supprimer. */
export function AdminTaxonomy({ kind, items, cities }: { kind: string; items: AdminTaxItem[]; cities: { slug: string; label: string }[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#ea580c");
  const [parent, setParent] = useState(cities[0]?.slug ?? "");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const withColor = kind === "label";
  const withParent = kind === "area";

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => {
    setMsg(null);
    const r = await fn();
    setMsg(r.ok ? { ok: true, text: ok } : { ok: false, text: r.error ?? "Action impossible." });
    if (r.ok) router.refresh();
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form className="h-fit rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"
        onSubmit={(e) => { e.preventDefault(); if (!label.trim()) return; run(() => addTaxonomyAction(kind, { label, ...(withColor ? { color } : {}), ...(withParent ? { parent } : {}) }), "Ajouté."); setLabel(""); }}>
        <p className="font-semibold text-ink">Ajouter</p>
        <label className="mt-3 block text-sm font-semibold">Nom</label>
        <input className="input mt-1" value={label} onChange={(e) => setLabel(e.target.value)} required maxLength={80} />
        {withColor ? (<><label className="mt-3 block text-sm font-semibold">Couleur</label><input type="color" className="mt-1 h-10 w-16 cursor-pointer rounded border border-slate-300" value={color} onChange={(e) => setColor(e.target.value)} /></>) : null}
        {withParent ? (<><label className="mt-3 block text-sm font-semibold">Ville</label>
          <select className="input mt-1" value={parent} onChange={(e) => setParent(e.target.value)}>{cities.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></>) : null}
        <button disabled={pending} className="mt-4 w-full rounded-md bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Ajouter</button>
        {msg ? <p className={"mt-2 text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="border-b border-slate-200 text-left">
            <tr><th className="px-4 py-3">Nom</th>{withParent ? <th className="px-4 py-3">Ville</th> : null}<th className="px-4 py-3">Identifiant</th><th className="px-4 py-3 text-right">Annonces</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2.5">
                  {editing === t.id ? (
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => editTaxonomyAction(t.id, { label: draft }), "Renommé."); setEditing(null); }}>
                      <input className="input py-1.5" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
                      <button className="rounded-md bg-brand-700 px-3 text-xs font-semibold text-white">OK</button>
                    </form>
                  ) : (
                    <span className="inline-flex items-center gap-2 font-semibold text-ink">
                      {withColor ? (
                        <input type="color" title="Changer la couleur" value={t.color ?? "#334155"} className="h-6 w-6 cursor-pointer rounded border-0 p-0"
                          onChange={(e) => run(() => editTaxonomyAction(t.id, { color: e.target.value }), "Couleur enregistrée.")} />
                      ) : null}
                      {withColor ? <span className="rounded px-2 py-0.5 text-xs font-bold uppercase text-white" style={{ background: t.color ?? "#334155" }}>{t.label}</span> : t.label}
                    </span>
                  )}
                </td>
                {withParent ? (
                  <td className="px-4 py-2.5">
                    <select className="rounded border border-slate-300 px-2 py-1 text-sm" value={t.parent ?? ""} onChange={(e) => run(() => editTaxonomyAction(t.id, { parent: e.target.value || null }), "Ville enregistrée.")}>
                      <option value="">—</option>{cities.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                    </select>
                  </td>
                ) : null}
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{t.slug}</td>
                <td className="px-4 py-2.5 text-right">{t.count}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button type="button" onClick={() => { setEditing(t.id); setDraft(t.label); }} className="mr-3 text-xs font-semibold text-brand-800 hover:underline">Renommer</button>
                  <button type="button" disabled={pending} onClick={() => window.confirm(`Supprimer « ${t.label} » ?`) && run(() => removeTaxonomyAction(t.id), "Supprimé.")} className="text-xs font-semibold text-red-600 hover:underline">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
