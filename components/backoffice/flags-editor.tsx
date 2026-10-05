"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFlagAction, deleteFlagAction, saveFlagAction, type Flag } from "@/app/admin/fonctionnalites/actions";

const STEPS = [0, 5, 10, 25, 50, 100];

function state(f: Pick<Flag, "enabled" | "rollout" | "audiences" | "include">): [string, string] {
  if (!f.enabled) return ["Coupée", "bg-slate-200 text-slate-700"];
  if (f.rollout >= 100 && !f.audiences.length) return ["Active pour tous", "bg-emerald-100 text-emerald-800"];
  if (f.rollout <= 0 && !f.include.length) return ["Personne", "bg-slate-100 text-slate-600"];
  return ["Déploiement progressif", "bg-amber-100 text-amber-800"];
}

/** Un interrupteur : marche/arrêt, pourcentage, publics, comptes test. */
export function FlagCard({ flag, audiences, onForMe }: { flag: Flag; audiences: Record<string, string>; onForMe: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ enabled: flag.enabled, rollout: flag.rollout, audiences: flag.audiences, include: flag.include.join("\n") });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = f.enabled !== flag.enabled || f.rollout !== flag.rollout || f.audiences.join() !== flag.audiences.join() || f.include.trim() !== flag.include.join("\n");
  const [label, cls] = state({ ...f, include: f.include.split(/\s+/).filter(Boolean) });

  const save = () => start(async () => {
    const r = await saveFlagAction(flag.key, { enabled: f.enabled, rollout: f.rollout, audiences: f.audiences, include: f.include as unknown as string[] });
    setMsg(r.ok ? "Enregistré : appliqué sur le site d’ici 30 secondes." : r.error ?? "Erreur");
    if (r.ok) router.refresh();
  });
  const remove = () => {
    if (!confirm(`Supprimer l’interrupteur « ${flag.label} » ?`)) return;
    start(async () => { const r = await deleteFlagAction(flag.key); if (r.ok) router.refresh(); else setMsg(r.error ?? "Erreur"); });
  };

  return (
    <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 font-semibold text-ink">
            {flag.label}
            <span className={"rounded px-1.5 py-0.5 text-[11px] font-semibold " + cls}>{label}</span>
            {onForMe ? <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800 ring-1 ring-sky-200">Visible pour vous</span> : null}
          </h3>
          <p className="text-xs text-muted"><code>{flag.key}</code>{flag.description ? ` · ${flag.description}` : ""}</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} className="h-4 w-4" />
          {f.enabled ? "Allumée" : "Coupée"}
        </label>
      </div>

      <div className={"grid gap-4 md:grid-cols-3 " + (f.enabled ? "" : "pointer-events-none opacity-50")}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Part des visiteurs : {f.rollout} %</p>
          <input type="range" min={0} max={100} value={f.rollout} onChange={(e) => setF({ ...f, rollout: Number(e.target.value) })} className="mt-2 w-full" aria-label="Pourcentage" />
          <div className="mt-1 flex flex-wrap gap-1">
            {STEPS.map((s) => (
              <button key={s} type="button" onClick={() => setF({ ...f, rollout: s })}
                className={"rounded px-2 py-0.5 text-xs ring-1 ring-slate-300 " + (f.rollout === s ? "bg-ink text-white" : "bg-white hover:bg-slate-50")}>{s} %</button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted">Chaque visiteur reste dans le même groupe d’une visite à l’autre.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Réservée à</p>
          <div className="mt-1 space-y-1">
            {Object.entries(audiences).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.audiences.includes(k)} onChange={(e) => setF({ ...f, audiences: e.target.checked ? [...f.audiences, k] : f.audiences.filter((a) => a !== k) })} />
                {v}
              </label>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted">Rien de coché : tous les visiteurs, connectés ou non.</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`inc-${flag.key}`}>Comptes test (toujours activée)</label>
          <textarea id={`inc-${flag.key}`} value={f.include} onChange={(e) => setF({ ...f, include: e.target.value })} rows={4}
            placeholder={"+2250700000001\nun téléphone ou identifiant de compte par ligne"} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={save} disabled={!dirty || pending} className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40">{pending ? "…" : "Enregistrer"}</button>
        {!flag.builtin ? <button onClick={remove} disabled={pending} className="rounded-md px-3 py-1.5 text-sm text-red-700 ring-1 ring-red-200 hover:bg-red-50">Supprimer</button> : null}
        {msg ? <span className="text-xs text-muted">{msg}</span> : null}
        <span className="ml-auto text-[11px] text-muted">Modifiée le {new Date(flag.updatedAt).toLocaleString("fr-FR")}{flag.updatedBy ? ` par ${flag.updatedBy}` : ""}</span>
      </div>
    </div>
  );
}

/** Nouvel interrupteur (pour une fonctionnalité en préparation). */
export function NewFlagForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await createFlagAction({ key, label, description });
      if (r.ok) { setKey(""); setLabel(""); setDescription(""); setMsg("Créé (coupé). Allumez-le quand la fonctionnalité est prête."); router.refresh(); }
      else setMsg(r.error ?? "Erreur");
    });
  };
  return (
    <form onSubmit={submit} className="grid gap-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[1fr_1fr_2fr_auto]">
      <input value={key} onChange={(e) => setKey(e.target.value)} required placeholder="Clé (ex. accueil.nouveau-bandeau)" className="rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm" />
      <input value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="Nom" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (facultatif)" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      <button disabled={pending} className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">Ajouter</button>
      {msg ? <p className="text-xs text-muted md:col-span-4">{msg}</p> : null}
    </form>
  );
}
