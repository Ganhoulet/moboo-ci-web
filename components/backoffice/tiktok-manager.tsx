"use client";

import { useState, useTransition } from "react";
import { deleteVideoAction, saveVideoAction, type SocialVideo } from "@/app/admin/seo/backlinks/actions";

const empty = { url: "", title: "", zoneSlug: "", targetPath: "/", views: 0, showOnSite: true };
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://moboo.ci").replace(/\/+$/, "");

/** Vidéos TikTok : lien court suivi pour la bio / la description, vidéo affichée sur les pages du quartier. */
export function TiktokManager({ items, zones }: { items: SocialVideo[]; zones: { slug: string; name: string }[] }) {
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const totalClicks = items.reduce((n, v) => n + v.clicks, 0);
  const totalViews = items.reduce((n, v) => n + v.views, 0);
  const save = () => start(async () => {
    const r = await saveVideoAction(form.id ?? null, { ...form, zoneSlug: form.zoneSlug || null });
    setMsg(r.ok ? { ok: true, text: "Vidéo enregistrée : copiez son lien court pour la description ou la bio." } : { ok: false, text: r.error ?? "Enregistrement impossible." });
    if (r.ok) setForm(empty);
  });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[["Vidéos", items.length], ["Vues (relevées)", totalViews], ["Visites sur moboo.ci", totalClicks]].map(([k, v]) => (
          <div key={String(k)} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">{Number(v).toLocaleString("fr-FR")}</p></div>
        ))}
      </div>
      {msg ? <p className={"rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>{msg.text}</p> : null}
      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-ink">{form.id ? "Modifier la vidéo" : "Ajouter une vidéo TikTok"}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="space-y-1 md:col-span-2"><span className="text-xs font-semibold text-ink">Lien de la vidéo</span><input className="input text-sm" placeholder="https://www.tiktok.com/@moboo.ci/video/7234…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-ink">Titre</span><input className="input text-sm" placeholder="Visite d’un 3 pièces à la Riviera" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-ink">Quartier (vidéo affichée sur ses pages)</span>
            <select className="input text-sm" value={form.zoneSlug} onChange={(e) => setForm({ ...form, zoneSlug: e.target.value, targetPath: form.targetPath === "/" && e.target.value ? `/immobilier/${e.target.value}` : form.targetPath })}>
              <option value="">— Aucun —</option>{zones.map((z) => <option key={z.slug} value={z.slug}>{z.name}</option>)}
            </select>
          </label>
          <label className="space-y-1"><span className="text-xs font-semibold text-ink">Page où envoyer les spectateurs</span><input className="input text-sm" placeholder="/immobilier/cocody" value={form.targetPath} onChange={(e) => setForm({ ...form, targetPath: e.target.value })} /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-ink">Vues (statistiques TikTok)</span><input type="number" min={0} className="input text-sm" value={form.views} onChange={(e) => setForm({ ...form, views: Number(e.target.value) || 0 })} /></label>
          <label className="flex items-center gap-2 text-sm md:col-span-3"><input type="checkbox" checked={form.showOnSite} onChange={(e) => setForm({ ...form, showOnSite: e.target.checked })} /> Afficher la vidéo sur les pages du quartier</label>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={pending} onClick={save} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{form.id ? "Enregistrer" : "Ajouter"}</button>
          {form.id ? <button type="button" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setForm(empty)}>Annuler</button> : null}
        </div>
      </section>
      <section className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-muted"><tr><th className="px-3 py-2">Vidéo</th><th className="px-3 py-2">Lien court (bio / description)</th><th className="px-3 py-2 text-right">Vues</th><th className="px-3 py-2 text-right">Visites</th><th className="px-3 py-2" /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((v) => {
              const short = `${SITE}/go/${v.code}`;
              return (
                <tr key={v.id}>
                  <td className="px-3 py-2"><a href={v.url} target="_blank" rel="noopener" className="font-semibold text-ink hover:underline">{v.title || `Vidéo ${v.videoId}`}</a><p className="text-xs text-muted">{v.zoneSlug ? `Quartier : ${zones.find((z) => z.slug === v.zoneSlug)?.name ?? v.zoneSlug}` : "Sans quartier"} · vers {v.targetPath}{v.showOnSite ? "" : " · masquée du site"}</p></td>
                  <td className="px-3 py-2"><button type="button" className="font-mono text-xs text-brand-800 hover:underline" onClick={() => { void navigator.clipboard?.writeText(short); setCopied(v.id); }}>{short}</button>{copied === v.id ? <span className="ml-2 text-xs text-emerald-700">copié</span> : null}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{v.views.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{v.clicks.toLocaleString("fr-FR")}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                    <button type="button" className="font-semibold text-ink hover:underline" onClick={() => setForm({ id: v.id, url: v.url, title: v.title, zoneSlug: v.zoneSlug ?? "", targetPath: v.targetPath, views: v.views, showOnSite: v.showOnSite })}>Modifier</button>{" · "}
                    <button type="button" className="font-semibold text-red-700 hover:underline" onClick={() => { if (confirm("Supprimer cette vidéo ?")) start(async () => { await deleteVideoAction(v.id); }); }}>Supprimer</button>
                  </td>
                </tr>
              );
            })}
            {!items.length ? <tr><td colSpan={5} className="px-3 py-6 text-center text-muted">Aucune vidéo pour l’instant.</td></tr> : null}
          </tbody>
        </table>
      </section>
      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-ink">Idées de vidéos qui ramènent du monde</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
          <li>« Combien coûte un 3 pièces à Cocody ? » avec les chiffres de la page Prix de l’immobilier.</li>
          <li>Visite express d’une annonce (30 secondes), lien court vers l’annonce ou la page du quartier.</li>
          <li>« Cocody ou Marcory ? » : comparaison de deux quartiers, lien vers les deux pages quartier.</li>
          <li>Résidence meublée de la semaine, lien vers la réservation.</li>
          <li>Conseils pour éviter les arnaques à la location (crédibilité et partages).</li>
        </ul>
      </section>
    </div>
  );
}
