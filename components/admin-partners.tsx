"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removePartnerAction, savePartnerAction, type AdminPartner } from "@/app/admin/immobilier/actions";
import { uploadImageAction } from "@/app/mon-espace/actions";
import { shrink } from "./settings-form";

const EMPTY = { name: "", logoUrl: "", url: "" };

/** Partenaires (logos de l'accueil) : ajouter, modifier, masquer, ordonner, supprimer. */
export function AdminPartners({ items }: { items: AdminPartner[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) => start(async () => {
    setMsg(null);
    const r = await fn();
    setMsg(r.ok ? { ok: true, text: ok } : { ok: false, text: r.error ?? "Action impossible." });
    if (r.ok) { after?.(); router.refresh(); }
  });

  const move = (i: number, d: -1 | 1) => {
    const a = items[i], b = items[i + d];
    if (!a || !b) return;
    run(async () => {
      const r1 = await savePartnerAction(a.id, { sort: b.sort === a.sort ? a.sort + d : b.sort });
      return r1.ok ? savePartnerAction(b.id, { sort: a.sort }) : r1;
    }, "Ordre enregistré.");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form className="h-fit space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => savePartnerAction(editing, { name: form.name, logoUrl: form.logoUrl, url: form.url || null }), editing ? "Partenaire modifié." : "Partenaire ajouté.", () => { setForm(EMPTY); setEditing(null); });
        }}>
        <p className="font-semibold text-ink">{editing ? "Modifier le partenaire" : "Ajouter un partenaire"}</p>
        <div>
          <label className="block text-sm font-semibold">Nom</label>
          <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} />
        </div>
        <div>
          <label className="block text-sm font-semibold">Logo</label>
          {form.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logoUrl} alt="" className="mt-1 h-14 max-w-full rounded border border-slate-200 object-contain p-1" />
          ) : null}
          <div className="mt-1 flex gap-2">
            <input className="input flex-1 text-sm" placeholder="https://…" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} required />
            <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50">
              Téléverser
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]; e.target.value = "";
                if (!file) return;
                start(async () => {
                  const r = await uploadImageAction(await shrink(file), "annonce");
                  if (r.ok && r.url) setForm((f) => ({ ...f, logoUrl: r.url! })); else setMsg({ ok: false, text: r.error ?? "Envoi impossible." });
                });
              }} />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold">Lien (facultatif)</label>
          <input className="input mt-1" type="url" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button disabled={pending} className="flex-1 rounded-md bg-brand-700 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{editing ? "Enregistrer" : "Ajouter"}</button>
          {editing ? <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="rounded-md border border-slate-300 px-3 text-sm font-semibold">Annuler</button> : null}
        </div>
        {msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </form>

      <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {items.length ? (
          <ul className="divide-y divide-slate-100">
            {items.map((p, i) => (
              <li key={p.id} className={"flex flex-wrap items-center gap-3 px-4 py-3 " + (p.active ? "" : "opacity-60")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logoUrl} alt="" className="h-12 w-24 shrink-0 rounded border border-slate-200 object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{p.name} {p.active ? null : <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">Masqué</span>}</p>
                  {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-brand-700 hover:underline">{p.url}</a> : <p className="text-xs text-muted">Sans lien</p>}
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button type="button" disabled={pending || i === 0} onClick={() => move(i, -1)} className="text-slate-500 disabled:opacity-30" aria-label="Monter">▲</button>
                  <button type="button" disabled={pending || i === items.length - 1} onClick={() => move(i, 1)} className="text-slate-500 disabled:opacity-30" aria-label="Descendre">▼</button>
                  <button type="button" onClick={() => run(() => savePartnerAction(p.id, { active: !p.active }), p.active ? "Masqué." : "Affiché.")} className="text-slate-700 hover:underline">{p.active ? "Masquer" : "Afficher"}</button>
                  <button type="button" onClick={() => { setEditing(p.id); setForm({ name: p.name, logoUrl: p.logoUrl, url: p.url ?? "" }); }} className="text-brand-800 hover:underline">Modifier</button>
                  <button type="button" onClick={() => window.confirm(`Supprimer « ${p.name} » ?`) && run(() => removePartnerAction(p.id), "Supprimé.")} className="text-red-600 hover:underline">Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="p-6 text-center text-sm text-muted">Aucun partenaire pour l’instant.</p>}
      </div>
    </div>
  );
}
