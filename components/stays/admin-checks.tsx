"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCheckAction, saveCheckAction, type AdminCheck } from "@/app/admin/sejours/actions";

const STATE: Record<AdminCheck["state"], [string, string]> = {
  a_faire: ["À visiter", "bg-amber-100 text-amber-800"],
  valide: ["Vérifié", "bg-emerald-100 text-emerald-800"],
  expiree: ["Visite de plus d’un an", "bg-slate-200 text-slate-700"],
  masquee: ["Masqué", "bg-slate-200 text-slate-700"],
};
const OPTS = {
  power: [["", "—"], ["groupe", "Groupe électrogène"], ["stable", "Électricité stable"], ["coupures", "Coupures possibles"]],
  water: [["", "—"], ["continue", "Eau courante continue"], ["reservoir", "Réservoir"], ["forage", "Forage"], ["coupures", "Coupures possibles"]],
  aircon: [["", "—"], ["toutes", "Toutes les pièces"], ["certaines", "Certaines pièces"], ["aucune", "Aucune"]],
  security: [["", "—"], ["gardien_camera", "Gardien et caméras"], ["gardien", "Gardien"], ["camera", "Caméras"], ["aucune", "Aucun"]],
} as const;

/** Visites « Vérifié sur place » : une ligne par résidence visible, formulaire de visite dépliable. */
export function ChecksBoard({ rows }: { rows: AdminCheck[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[14rem] flex-1">
              <p className="font-semibold text-ink">{r.name}</p>
              <p className="text-sm text-muted">{r.place || "Lieu non renseigné"}{r.hasGps ? "" : " · sans position GPS"}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATE[r.state][1]}`}>{STATE[r.state][0]}</span>
            {r.check ? <span className="text-xs text-muted">Visite du {new Date(r.check.visitedAt).toLocaleDateString("fr-FR")} · {r.check.agentName}</span> : null}
            <a href={`/residence/${r.id}`} target="_blank" rel="noopener" className="text-sm font-semibold text-brand-800 hover:underline">Voir</a>
            <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} className="rounded-full bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-800">
              {r.check ? "Modifier la visite" : "Saisir la visite"}
            </button>
          </div>
          {open === r.id ? <CheckForm row={r} onDone={() => setOpen(null)} /> : null}
        </div>
      ))}
    </div>
  );
}

function CheckForm({ row, onDone }: { row: AdminCheck; onDone: () => void }) {
  const router = useRouter();
  const c = row.check;
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const sel = (name: keyof typeof OPTS, label: string, value: string | null | undefined) => (
    <label className="block text-sm">
      <span className="font-semibold text-ink">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 p-2">
        {OPTS[name].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v)]));
    start(async () => {
      const r = await saveCheckAction(row.id, { ...body, gpsChecked: f.get("gpsChecked") === "on", parking: f.get("parking") === "" ? null : f.get("parking") === "true" });
      if (!r.ok) setError(r.error); else { onDone(); router.refresh(); }
    });
  }
  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block text-sm"><span className="font-semibold text-ink">Date de la visite</span>
        <input type="date" name="visitedAt" required defaultValue={(c?.visitedAt ?? new Date().toISOString()).slice(0, 10)} className="mt-1 w-full rounded-lg border border-slate-300 p-2" /></label>
      <label className="block text-sm"><span className="font-semibold text-ink">Agent qui a visité</span>
        <input name="agentName" required defaultValue={c?.agentName ?? ""} placeholder="Prénom et nom" className="mt-1 w-full rounded-lg border border-slate-300 p-2" /></label>
      <label className="block text-sm"><span className="font-semibold text-ink">Conformité à l’annonce</span>
        <select name="conformity" defaultValue={c?.conformity ?? "conforme"} className="mt-1 w-full rounded-lg border border-slate-300 p-2"><option value="conforme">Conforme aux photos</option><option value="ecarts">Écarts constatés (préciser)</option></select></label>
      {sel("power", "Électricité", c?.power)}
      {sel("water", "Eau", c?.water)}
      <label className="block text-sm"><span className="font-semibold text-ink">Wi-Fi mesuré (Mb/s)</span>
        <input type="number" min={0} max={2000} name="wifiMbps" defaultValue={c?.wifiMbps ?? ""} placeholder="Test de débit sur place" className="mt-1 w-full rounded-lg border border-slate-300 p-2" /></label>
      {sel("aircon", "Climatisation", c?.aircon)}
      {sel("security", "Sécurité", c?.security)}
      <label className="block text-sm"><span className="font-semibold text-ink">Parking</span>
        <select name="parking" defaultValue={c?.parking == null ? "" : String(c.parking)} className="mt-1 w-full rounded-lg border border-slate-300 p-2"><option value="">—</option><option value="true">Oui</option><option value="false">Non</option></select></label>
      <label className="block text-sm sm:col-span-2"><span className="font-semibold text-ink">Vidéo de la visite (lien https)</span>
        <input name="videoUrl" defaultValue={c?.videoUrl ?? ""} placeholder="https://…" className="mt-1 w-full rounded-lg border border-slate-300 p-2" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="gpsChecked" defaultChecked={!!c?.gpsChecked} /> Position GPS contrôlée sur place</label>
      <label className="block text-sm sm:col-span-2 lg:col-span-3"><span className="font-semibold text-ink">Note publique <span className="font-normal text-muted">(écarts, conseils au voyageur)</span></span>
        <textarea name="notes" rows={2} maxLength={600} defaultValue={c?.notes ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 p-2" /></label>
      <label className="block text-sm"><span className="font-semibold text-ink">Affichage</span>
        <select name="status" defaultValue={c?.status ?? "published"} className="mt-1 w-full rounded-lg border border-slate-300 p-2"><option value="published">Badge affiché</option><option value="hidden">Masqué</option></select></label>
      {error ? <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
        <button type="submit" disabled={pending} className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer la visite"}</button>
        {c ? <button type="button" disabled={pending} onClick={() => window.confirm("Supprimer cette visite ? Le badge disparaîtra de la page.") && start(async () => { const r = await deleteCheckAction(row.id); if (!r.ok) setError(r.error); else { onDone(); router.refresh(); } })}
          className="rounded-full px-5 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50">Supprimer la visite</button> : null}
      </div>
    </form>
  );
}
