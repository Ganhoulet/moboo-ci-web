"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMobooPackagesAction, removePackageAction, savePackageAction, type AdminPackage } from "@/app/admin/immobilier/actions";
import { fcfa, periodLabel } from "@/lib/community";

type Form = { name: string; description: string; price: string; durationDays: string; listings: string; unlimited: boolean; featured: string; popular: boolean; active: boolean };
const EMPTY: Form = { name: "", description: "", price: "", durationDays: "30", listings: "10", unlimited: false, featured: "0", popular: false, active: true };
const toForm = (p: AdminPackage): Form => ({
  name: p.name, description: p.description ?? "", price: String(p.price), durationDays: String(p.durationDays),
  listings: p.listings < 0 ? "10" : String(p.listings), unlimited: p.listings < 0, featured: String(p.featured), popular: p.popular, active: p.active,
});

/** Forfaits (façon Houzez « Packages ») : prix, durée, annonces en ligne, vedettes. */
export function AdminPackages({ items }: { items: AdminPackage[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) => start(async () => {
    setMsg(null);
    const r = await fn();
    setMsg(r.ok ? { ok: true, text: ok } : { ok: false, text: r.error ?? "Action impossible." });
    if (r.ok) { after?.(); router.refresh(); }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name, description: form.description, price: Number(form.price) || 0, durationDays: Number(form.durationDays) || 30,
      listings: form.unlimited ? -1 : Number(form.listings) || 0, featured: Number(form.featured) || 0, popular: form.popular, active: form.active,
    };
    run(() => savePackageAction(editing, payload), editing ? "Forfait modifié." : "Forfait ajouté.", () => { setForm(EMPTY); setEditing(null); });
  };

  const missing = ["chap chap", "standard", "lancement", "croissance"].filter((n) => !items.some((p) => p.name.trim().toLowerCase() === n));
  return (
    <div className="space-y-4">
    {missing.length ? (
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-900 ring-1 ring-sky-200">
        <span>Forfaits actuels de moboo.ci : <strong>Chap Chap</strong> 3 000 F · <strong>Standard</strong> 10 000 F · <strong>Lancement</strong> 25 000 F · <strong>Croissance</strong> 60 000 F{missing.length < 4 ? ` (${missing.length} manquant${missing.length > 1 ? "s" : ""})` : ""}.</span>
        <button type="button" disabled={pending} onClick={() => run(async () => { const r = await createMobooPackagesAction(); return r; }, "Forfaits de moboo.ci créés.")}
          className="ml-auto rounded-md bg-brand-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-800 disabled:opacity-50">Créer les forfaits de moboo.ci</button>
      </div>
    ) : null}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <form onSubmit={submit} className="h-fit space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="font-semibold text-ink">{editing ? "Modifier le forfait" : "Nouveau forfait"}</p>
        <div><label className="block text-sm font-semibold">Nom</label><input className="input mt-1" value={form.name} onChange={(e) => set({ name: e.target.value })} required maxLength={60} placeholder="Pro" /></div>
        <div><label className="block text-sm font-semibold">Description</label><textarea className="input mt-1" rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={500} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-semibold">Prix (FCFA)</label><input className="input mt-1" type="number" min={0} value={form.price} onChange={(e) => set({ price: e.target.value })} required /></div>
          <div><label className="block text-sm font-semibold">Durée (jours)</label><input className="input mt-1" type="number" min={1} max={3650} value={form.durationDays} onChange={(e) => set({ durationDays: e.target.value })} required /></div>
          <div>
            <label className="block text-sm font-semibold">Annonces en ligne</label>
            <input className="input mt-1" type="number" min={0} value={form.listings} disabled={form.unlimited} onChange={(e) => set({ listings: e.target.value })} />
            <label className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" checked={form.unlimited} onChange={(e) => set({ unlimited: e.target.checked })} /> Illimitées</label>
          </div>
          <div><label className="block text-sm font-semibold">Annonces sponsorisées</label><input className="input mt-1" type="number" min={0} value={form.featured} onChange={(e) => set({ featured: e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.popular} onChange={(e) => set({ popular: e.target.checked })} /> Mis en avant (« Le plus choisi »)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} /> Proposé sur le site</label>
        <div className="flex gap-2">
          <button disabled={pending} className="flex-1 rounded-md bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{editing ? "Enregistrer" : "Ajouter"}</button>
          {editing ? <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="rounded-md border border-slate-300 px-3 text-sm font-semibold">Annuler</button> : null}
        </div>
        {msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {items.length ? (
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-slate-200 text-left">
              <tr><th className="px-4 py-3">Forfait</th><th className="px-4 py-3 text-right">Prix</th><th className="px-4 py-3">Durée</th><th className="px-4 py-3">Annonces</th><th className="px-4 py-3">Sponsorisées</th><th className="px-4 py-3 text-right">Abonnés</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => (
                <tr key={p.id} className={p.active ? "" : "opacity-60"}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{p.name}
                      {p.popular ? <span className="ml-2 rounded bg-accent-100 px-1.5 py-0.5 text-[11px] font-bold text-accent-700">Mis en avant</span> : null}
                      {p.active ? null : <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">Masqué</span>}</p>
                    {p.description ? <p className="line-clamp-1 text-xs text-muted">{p.description}</p> : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{p.price ? fcfa(p.price) : "Gratuit"}</td>
                  <td className="px-4 py-3">{periodLabel(p.durationDays)}</td>
                  <td className="px-4 py-3">{p.listings < 0 ? "Illimitées" : p.listings}</td>
                  <td className="px-4 py-3">{p.featured}</td>
                  <td className="px-4 py-3 text-right">{p.subscribers}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold">
                    <button type="button" onClick={() => { setEditing(p.id); setForm(toForm(p)); }} className="mr-3 text-brand-800 hover:underline">Modifier</button>
                    <button type="button" onClick={() => window.confirm(`Supprimer le forfait « ${p.name} » ? Les abonnements en cours et les factures sont conservés.`) && run(() => removePackageAction(p.id), "Supprimé.")} className="text-red-600 hover:underline">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-sm text-muted">Aucun forfait. Ajoutez-en un pour ouvrir la page « Forfaits » du site.</p>}
      </div>
    </div>
    </div>
  );
}
