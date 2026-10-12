"use client";

import { useState, useTransition } from "react";
import {
  addBasculePilotAction, removeBasculePilotAction, resetBasculeAction, searchBasculeOrgsAction, setBasculeModeAction,
  type BasculeMode, type BasculeOrg,
} from "../actions";

const MODES: { mode: BasculeMode; label: string; confirm: string }[] = [
  { mode: "off", label: "Fermé", confirm: "Fermer ce domaine ? Toutes les agences repasseront sur WordPress. Ce qu’elles ont saisi sur Render depuis la bascule n’y sera pas visible." },
  { mode: "pilot", label: "Agences pilotes", confirm: "Passer en mode pilote ? Seules les agences pilotes utiliseront Render." },
  { mode: "on", label: "Ouvert à toutes", confirm: "Ouvrir à toutes les agences ? Chacune enverra ses données WordPress à sa prochaine connexion, puis utilisera Render." },
];

export function BasculeModeSwitch({ domain, mode }: { domain: string; mode: BasculeMode }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <div className="inline-flex rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label="Mode de bascule">
        {MODES.map((m) => (
          <button key={m.mode} type="button" role="radio" aria-checked={mode === m.mode} disabled={pending || mode === m.mode}
            onClick={() => { if (confirm(m.confirm)) start(async () => { const r = await setBasculeModeAction(domain, m.mode); setErr(r.ok ? null : r.error ?? "Erreur."); }); }}
            className={"rounded-md px-3 py-1.5 text-xs font-semibold " + (mode === m.mode ? (m.mode === "on" ? "bg-emerald-600 text-white" : m.mode === "pilot" ? "bg-amber-500 text-white" : "bg-white text-ink shadow-sm") : "text-slate-600 hover:text-ink")}>
            {m.label}
          </button>
        ))}
      </div>
      {err ? <p className="mt-1 text-xs text-red-700">{err}</p> : null}
    </div>
  );
}

export function PilotAdd({ domain, existing }: { domain: string; existing: string[] }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<BasculeOrg[] | null>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="mt-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => setResults(await searchBasculeOrgsAction(q))); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom de l’agence, e-mail ou téléphone"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" aria-label="Rechercher une agence Moboo Pro" />
        <button type="submit" disabled={pending || q.trim().length < 2} className="rounded-md bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Rechercher</button>
      </form>
      {results ? (
        results.length ? (
          <ul className="mt-2 divide-y divide-slate-100 rounded-md ring-1 ring-slate-200">
            {results.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span><span className="font-semibold text-ink">{o.name}</span>{o.contact ? <span className="block text-xs text-muted">{o.contact}</span> : null}</span>
                {existing.includes(o.id) ? <span className="text-xs text-muted">Déjà pilote</span> : (
                  <button type="button" disabled={pending} onClick={() => start(async () => { const r = await addBasculePilotAction(domain, o.id); setMsg(r.ok ? `${o.name} ajoutée.` : r.error ?? "Erreur."); })}
                    className="text-xs font-semibold text-brand-800 hover:underline">Ajouter comme pilote</button>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-xs text-muted">Aucun compte Moboo Pro trouvé. L’agence doit s’être connectée au moins une fois avec la nouvelle version de l’app.</p>
      ) : null}
      {msg ? <p className="mt-1 text-xs text-muted">{msg}</p> : null}
    </div>
  );
}

export function PilotRemove({ domain, orgId, name }: { domain: string; orgId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => {
      if (!confirm(`Retirer « ${name} » des pilotes ? Elle repassera sur WordPress pour ce domaine (ce qu’elle a saisi sur Render n’y sera pas visible).`)) return;
      start(async () => { const r = await removeBasculePilotAction(domain, orgId); if (!r.ok) alert(r.error); });
    }} className="text-xs font-semibold text-red-700 hover:underline">{pending ? "…" : "Retirer"}</button>
  );
}

export function BasculeReset({ domain, orgId, name }: { domain: string; orgId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => {
      if (!confirm(`Refaire la reprise de « ${name} » ?`)) return;
      start(async () => { const r = await resetBasculeAction(domain, orgId); if (!r.ok) alert(r.error); });
    }} className="text-xs font-semibold text-brand-800 hover:underline">{pending ? "…" : "Refaire la reprise"}</button>
  );
}
