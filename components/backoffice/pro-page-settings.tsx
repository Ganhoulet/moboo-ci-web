"use client";

import { useState, useTransition } from "react";
import { saveProPageSettings } from "@/app/admin/immobilier/pages-pros/actions";

const input = "w-28 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm";

export function ProPageSettingsForm({ initial }: { initial: any }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const num = (k: string, label: string, hint: string) => (
    <label className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm">
      <span><span className="font-semibold text-ink">{label}</span><span className="block text-xs text-muted">{hint}</span></span>
      <input type="number" className={input} value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} />
    </label>
  );
  const check = (k: string, label: string) => (
    <label className="flex items-center gap-2 py-2 text-sm"><input type="checkbox" checked={!!v[k]} onChange={(e) => setV({ ...v, [k]: e.target.checked })} /> <span className="font-semibold text-ink">{label}</span></label>
  );
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
      {check("enabled", "Photos et vidéos activées sur les pages des pros")}
      {num("maxVideos", "Vidéos par page", "Liens YouTube, TikTok ou Vimeo ; 0 à 10 (par défaut 2)")}
      {num("maxPhotos", "Photos par page", "0 à 30 (par défaut 8)")}
      {num("maxPhotoMb", "Taille max d’une photo (Mo)", "Les photos sont réduites automatiquement avant l’envoi")}
      {num("maxDeals", "Biens vendus / loués par pro", "Réalisations affichées sur la page ; 0 à 2000")}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={pending} onClick={() => start(async () => { const r = await saveProPageSettings(v); if (r.ok) setV(r.data); setMsg(r.ok ? { ok: true, text: "Réglages enregistrés." } : { ok: false, text: r.error }); })} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">Enregistrer</button>
        {msg ? <span className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
      </div>
      <p className="mt-3 text-xs text-muted">Les médias déjà en ligne restent visibles si vous baissez une limite ; le pro ne pourra simplement plus en ajouter tant qu’il dépasse.</p>
    </div>
  );
}
