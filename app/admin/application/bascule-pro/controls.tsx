"use client";

import { useState, useTransition } from "react";
import { resetBasculeAction, setBasculeOpenAction } from "../actions";

export function BasculeToggle({ domain, open }: { domain: string; open: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <button type="button" disabled={pending} onClick={() => {
        if (!confirm(open ? "Fermer ce domaine ? Les agences repasseront sur WordPress pour ce domaine." : "Ouvrir ce domaine ? Les agences enverront leurs données WordPress à leur prochaine connexion.")) return;
        start(async () => { const r = await setBasculeOpenAction(domain, !open); setErr(r.ok ? null : r.error ?? "Erreur."); });
      }} className={"rounded-md px-3 py-1.5 text-xs font-semibold " + (open ? "bg-white text-red-700 ring-1 ring-red-300" : "bg-brand-800 text-white")}>
        {pending ? "…" : open ? "Fermer le domaine" : "Ouvrir le domaine"}
      </button>
      {err ? <span className="text-xs text-red-700">{err}</span> : null}
    </div>
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
