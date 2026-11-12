"use client";

import { useState, useTransition } from "react";
import { deleteEventAction, saveEventAction, type EventRow } from "@/app/admin/sejours/actions";

const EMPTY = { name: "", venue: "", city: "Abidjan", lat: "", lng: "", radiusKm: "6", startDate: "", endDate: "", slug: "", description: "", status: "published" };

/** Événements : une page « Où dormir pendant … » par événement, dates de séjour pré-remplies. */
export function EventsBoard({ rows }: { rows: EventRow[] }) {
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [id, setId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const set = (k: string) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const edit = (r: EventRow) => {
    setId(r.id);
    setForm(Object.fromEntries(Object.entries({ ...EMPTY, ...r, startDate: r.startDate.slice(0, 10), endDate: r.endDate.slice(0, 10) }).map(([k, v]) => [k, v == null ? "" : String(v)])));
    setMsg("");
  };
  const save = () => start(async () => {
    const r = await saveEventAction(id, form);
    setMsg(r.ok ? `Enregistré : /ou-dormir/${r.slug}` : r.error);
    if (r.ok) { setId(null); setForm(EMPTY); }
  });
  const del = (r: EventRow) => { if (confirm(`Supprimer l’événement « ${r.name} » ? Sa page disparaîtra.`)) start(async () => { const x = await deleteEventAction(r.id); setMsg(x.ok ? "Événement supprimé." : x.error); }); };
  const input = "mt-1 w-full rounded-lg border border-slate-300 p-2";
  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg bg-white p-5 text-sm shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <label className="sm:col-span-2"><span className="font-semibold text-ink">Nom de l’événement</span><input value={form.name} onChange={set("name")} placeholder="Festival des musiques urbaines d’Anoumabo" className={input} /></label>
        <label className="sm:col-span-2"><span className="font-semibold text-ink">Lieu</span><input value={form.venue} onChange={set("venue")} placeholder="Palais de la culture, Treichville" className={input} /></label>
        <label><span className="font-semibold text-ink">Ville</span><input value={form.city} onChange={set("city")} className={input} /></label>
        <label><span className="font-semibold text-ink">Latitude du lieu</span><input value={form.lat} onChange={set("lat")} placeholder="5.3050" className={input} /></label>
        <label><span className="font-semibold text-ink">Longitude du lieu</span><input value={form.lng} onChange={set("lng")} placeholder="-4.0135" className={input} /></label>
        <label><span className="font-semibold text-ink">Rayon (km)</span><input value={form.radiusKm} onChange={set("radiusKm")} className={input} /></label>
        <label><span className="font-semibold text-ink">Premier jour</span><input type="date" value={form.startDate} onChange={set("startDate")} className={input} /></label>
        <label><span className="font-semibold text-ink">Dernier jour</span><input type="date" value={form.endDate} onChange={set("endDate")} className={input} /></label>
        <label><span className="font-semibold text-ink">Adresse de la page (facultatif)</span><input value={form.slug} onChange={set("slug")} placeholder="femua-2027" className={input} /></label>
        <label><span className="font-semibold text-ink">Statut</span><select value={form.status} onChange={set("status")} className={input}><option value="published">Publié</option><option value="draft">Brouillon</option></select></label>
        <label className="sm:col-span-2 lg:col-span-4"><span className="font-semibold text-ink">Présentation (facultatif)</span><textarea rows={3} value={form.description} onChange={set("description")} className={input} /></label>
        <p className="text-xs text-muted sm:col-span-2 lg:col-span-4">Coordonnées : clic droit sur le lieu dans Google Maps, puis copiez les deux nombres. Les dates de séjour proposées vont de la veille du premier jour au lendemain du dernier.</p>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
          <button type="button" onClick={save} disabled={pending} className="rounded-full bg-ink px-5 py-2 font-semibold text-white hover:bg-black disabled:opacity-50">{id ? "Enregistrer les changements" : "Créer la page"}</button>
          {id ? <button type="button" onClick={() => { setId(null); setForm(EMPTY); }} className="rounded-full px-4 py-2 font-semibold text-ink ring-1 ring-slate-300">Annuler</button> : null}
          {msg ? <span className="text-muted" role="status">{msg}</span> : null}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Dates</th><th className="px-3 py-2">Événement</th><th className="px-3 py-2">Lieu</th><th className="px-3 py-2">Page</th><th className="px-3 py-2" /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-slate-100 ${r.status === "draft" ? "opacity-60" : ""}`}>
                <td className="px-3 py-2 tabular-nums">{r.startDate.slice(0, 10)}{r.endDate.slice(0, 10) !== r.startDate.slice(0, 10) ? ` → ${r.endDate.slice(0, 10)}` : ""}</td>
                <td className="px-3 py-2 font-semibold text-ink">{r.name}{r.status === "draft" ? " (brouillon)" : ""}</td>
                <td className="px-3 py-2 text-muted">{r.venue}, {r.city} · {r.radiusKm} km</td>
                <td className="px-3 py-2">{r.status === "published" ? <a href={`/ou-dormir/${r.slug}`} target="_blank" rel="noreferrer" className="underline">/ou-dormir/{r.slug}</a> : <span className="text-muted">/ou-dormir/{r.slug}</span>}</td>
                <td className="px-3 py-2 text-right"><button type="button" onClick={() => edit(r)} className="font-semibold text-ink underline">Modifier</button> <button type="button" onClick={() => del(r)} className="ml-2 text-muted underline">Supprimer</button></td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={5} className="px-3 py-6 text-center text-muted">Aucun événement pour le moment.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
