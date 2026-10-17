"use client";

import { useState, useTransition } from "react";
import { fileToDataUri } from "@/lib/file-data-uri";
import {
  deleteProAnnouncementAction, proAnnouncementListenersAction, saveProAnnouncementAction, uploadProAnnouncementMediaAction, type ProAnnouncement,
} from "../pro-actions";

const COLORS = [["blue", "Bleu"], ["orange", "Orange"], ["green", "Vert"], ["purple", "Violet"], ["teal", "Turquoise"]];
const SWATCH: Record<string, string> = { blue: "#1565C0", orange: "#FF6600", green: "#2E7D32", purple: "#7B1FA2", teal: "#00897B" };
const CIBLES = [["tous", "Tout le monde"], ["agence", "Agences / agents"], ["proprietaire", "Propriétaires"], ["locataire", "Locataires"]];
const EMPTY = { title: "", body: "", image: "", color: "blue", btn_label: "", link: "", audio: "", cible: "tous", published: true, position: 0 };
const field = "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm";

const readAudio = (f: File) => new Promise<string>((res, rej) => {
  if (f.size > 7 * 1024 * 1024) return rej(new Error("Audio trop lourd (7 Mo maximum)."));
  const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f);
});

export function AnnouncementsManager({ items }: { items: ProAnnouncement[] }) {
  const [edit, setEdit] = useState<{ id: number | null; v: typeof EMPTY } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [listeners, setListeners] = useState<{ id: number; rows: { name: string; email: string; role: string; date: string }[] } | null>(null);
  const [busy, start] = useTransition();

  const open = (a?: ProAnnouncement) => setEdit({
    id: a?.id ?? null,
    v: a ? { title: a.title, body: a.body, image: a.image ?? "", color: a.color, btn_label: a.btn_label ?? "", link: a.link ?? "", audio: a.audio ?? "", cible: a.cible, published: a.published, position: a.position } : { ...EMPTY },
  });
  const upload = (kind: "image" | "audio", f: File | undefined) => f && start(async () => {
    setMsg(null);
    try {
      const uri = kind === "image" ? await fileToDataUri(f, 1400) : await readAudio(f);
      const r = await uploadProAnnouncementMediaAction(uri);
      if (!r.ok) return setMsg(r.error ?? "Envoi impossible.");
      setEdit((e) => (e ? { ...e, v: { ...e.v, [kind]: r.url! } } : e));
    } catch (err: any) { setMsg(err?.message ?? "Fichier illisible."); }
  });
  const save = () => edit && start(async () => {
    const r = await saveProAnnouncementAction(edit.id, edit.v);
    if (!r.ok) return setMsg(r.error ?? "Erreur.");
    setEdit(null); setMsg("Annonce enregistrée.");
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => open()} className="rounded-full bg-brand-800 px-4 py-2 text-sm font-bold text-white hover:bg-brand-900">Nouvelle annonce</button>
        {msg ? <p role="status" className="text-sm text-ink">{msg}</p> : null}
      </div>

      {edit ? (
        <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-ink">{edit.id ? "Modifier l’annonce" : "Nouvelle annonce"}</h2>
          <label className="block text-sm">Titre <input className={field} value={edit.v.title} maxLength={190} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, title: e.target.value } })} /></label>
          <label className="block text-sm">Texte <textarea className={field} rows={3} value={edit.v.body} maxLength={2000} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, body: e.target.value } })} /></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Couleur <select className={field} value={edit.v.color} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, color: e.target.value } })}>{COLORS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label className="text-sm">Afficher pour <select className={field} value={edit.v.cible} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, cible: e.target.value } })}>{CIBLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label className="text-sm">Ordre <input type="number" className={field} value={edit.v.position} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, position: Number(e.target.value) } })} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Texte du bouton <input className={field} value={edit.v.btn_label} maxLength={60} placeholder="Ex : En savoir plus" onChange={(e) => setEdit({ ...edit, v: { ...edit.v, btn_label: e.target.value } })} /></label>
            <label className="text-sm">Lien du bouton <input className={field} value={edit.v.link} placeholder="https://…" onChange={(e) => setEdit({ ...edit, v: { ...edit.v, link: e.target.value } })} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="text-sm">Illustration
              <input type="file" accept="image/*" className="mt-1 block text-xs" onChange={(e) => upload("image", e.target.files?.[0])} />
              {edit.v.image ? <span className="mt-1 flex items-center gap-2"><img src={edit.v.image} alt="" className="h-12 rounded" /><button type="button" className="text-xs text-red-700" onClick={() => setEdit({ ...edit, v: { ...edit.v, image: "" } })}>Retirer</button></span> : null}
            </div>
            <div className="text-sm">Audio (MP3 conseillé)
              <input type="file" accept="audio/*" className="mt-1 block text-xs" onChange={(e) => upload("audio", e.target.files?.[0])} />
              {edit.v.audio ? <span className="mt-1 flex items-center gap-2"><audio controls src={edit.v.audio} className="h-8" /><button type="button" className="text-xs text-red-700" onClick={() => setEdit({ ...edit, v: { ...edit.v, audio: "" } })}>Retirer</button></span> : null}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.v.published} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, published: e.target.checked } })} /> Publiée (visible dans l’application)</label>
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={busy || !edit.v.title.trim()} className="rounded-full bg-brand-800 px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "…" : "Enregistrer"}</button>
            <button type="button" onClick={() => setEdit(null)} className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted ring-1 ring-slate-300">Annuler</button>
          </div>
        </section>
      ) : null}

      <div className="space-y-3">
        {items.length ? items.map((a) => (
          <article key={a.id} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-10 w-1.5 rounded-full" style={{ background: SWATCH[a.color] ?? "#1565C0" }} aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-ink">{a.title} {a.published ? null : <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-muted">brouillon</span>}</h3>
                  <p className="text-xs text-muted">{CIBLES.find(([k]) => k === a.cible)?.[1]} · ordre {a.position}{a.audio ? " · audio" : ""}</p>
                  {a.body ? <p className="mt-1 max-w-2xl text-sm text-slate-700">{a.body}</p> : null}
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <button type="button" className="font-semibold text-brand-800" onClick={() => open(a)}>Modifier</button>
                <button type="button" className="font-semibold text-red-700" onClick={() => { if (confirm("Supprimer cette annonce et ses statistiques ?")) start(async () => { await deleteProAnnouncementAction(a.id); }); }}>Supprimer</button>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              👁️ {a.stats.totals.view ?? 0} vues · 🔊 {a.stats.totals.play ?? 0} écoutes · 👆 {a.stats.totals.click ?? 0} clics · ✕ {a.stats.totals.dismiss ?? 0} fermetures
              {" — "}agences {a.stats.byRole.agence?.view ?? 0}, propriétaires {a.stats.byRole.proprietaire?.view ?? 0}, locataires {a.stats.byRole.locataire?.view ?? 0} vues
              {(a.stats.totals.play ?? 0) > 0 ? <button type="button" className="ml-2 font-semibold text-brand-800" onClick={() => start(async () => setListeners({ id: a.id, rows: await proAnnouncementListenersAction(a.id) }))}>Qui a écouté ?</button> : null}
            </p>
            {listeners?.id === a.id ? (
              <ul className="mt-2 divide-y divide-slate-100 rounded-md text-xs ring-1 ring-slate-200">
                {listeners.rows.map((l, i) => <li key={i} className="flex justify-between gap-2 px-3 py-1.5"><span>{l.name} {l.email ? <span className="text-muted">· {l.email}</span> : null}</span><span className="text-muted">{l.role} · {new Date(l.date).toLocaleString("fr-FR")}</span></li>)}
              </ul>
            ) : null}
          </article>
        )) : <p className="rounded-lg bg-white p-6 text-center text-sm text-muted ring-1 ring-slate-200">Aucune annonce. Les annonces WordPress arrivent avec l’envoi « Plateforme Moboo Pro » de Moboo Migration.</p>}
      </div>
    </div>
  );
}
