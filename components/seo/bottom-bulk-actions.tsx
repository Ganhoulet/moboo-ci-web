"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { draftMissingBottomAction, setBottomStatusAction, type BottomJob } from "@/app/admin/seo/actions";

/** Rédaction en lot des textes manquants (en brouillon) et publication des brouillons relus. */
export function BottomBulkActions({ missing, drafts, job }: { missing: number; drafts: string[]; job: BottomJob | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [limit, setLimit] = useState(missing || 5);
  const [direct, setDirect] = useState(true);

  // Rédaction en cours : la page se rafraîchit toutes les 10 secondes.
  useEffect(() => {
    if (!job?.running) return;
    const t = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(t);
  }, [job?.running, router]);

  const run = () => start(async () => {
    const r = await draftMissingBottomAction({ limit, publish: direct });
    setMsg(r.ok ? { ok: true, text: direct ? "Rédaction lancée : les textes sont publiés au fur et à mesure." : "Rédaction lancée : les textes arrivent en brouillon." } : { ok: false, text: r.error ?? "Impossible." });
    router.refresh();
  });
  const publish = () => start(async () => {
    if (!window.confirm(`Publier les ${drafts.length} brouillons ? Ils apparaîtront sur le site dans les 5 minutes.`)) return;
    const r = await setBottomStatusAction(drafts, "published");
    setMsg(r.ok ? { ok: true, text: `${r.updated} textes publiés.` } : { ok: false, text: r.error ?? "Impossible." });
    router.refresh();
  });

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div>
        <label htmlFor="bt-limit" className="block text-sm font-semibold text-ink">Rédiger avec Claude les textes manquants</label>
        <p className="text-xs text-muted">{missing} page{missing > 1 ? "s" : ""} sans texte. Les nouvelles pages reçoivent aussi leur texte chaque nuit, automatiquement.</p>
        <div className="mt-2 flex items-center gap-2">
          <input id="bt-limit" type="number" min={1} max={1000} className="input w-24" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
          <span className="text-sm text-muted">pages</span>
          <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="accent-brand-700" checked={direct} onChange={(e) => setDirect(e.target.checked)} />Publier directement</label>
          <button type="button" disabled={pending || !missing || job?.running} onClick={run} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Lancer la rédaction</button>
        </div>
      </div>
      <div>
        <button type="button" disabled={pending || !drafts.length} onClick={publish} className="rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-50">Publier les {drafts.length} brouillons</button>
      </div>
      {job ? (
        <p className="w-full text-sm text-slate-700">
          {job.running ? `Rédaction en cours : ${job.done} / ${job.total} pages…` : `Dernière rédaction : ${job.done} / ${job.total} pages${job.finishedAt ? ` (terminée le ${new Date(job.finishedAt).toLocaleString("fr-FR")})` : ""}.`}
          {job.failed.length ? <span className="block text-red-700">Échecs : {job.failed.map((f) => `/${f.slug} (${f.error})`).join(" · ")}</span> : null}
        </p>
      ) : null}
      {msg ? <p className={"w-full text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </div>
  );
}
