"use client";

import { useState, useTransition } from "react";
import { cancelEventAction, releaseEventAction } from "@/app/admin/comptes/evenements/actions";

/** Décisions de l'équipe Moboo sur un événement payé en ligne. */
export function EventTeamActions({ id, canRelease, canCancel }: { id: string; canRelease: boolean; canCancel: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="flex flex-wrap items-center gap-2">
      {canRelease ? (
        <button type="button" disabled={pending} className="rounded-full px-3 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
          onClick={() => window.confirm("Débloquer la part de l’hôte sans code du jour J ? À faire seulement si l’événement a bien eu lieu.") && start(async () => {
            const r = await releaseEventAction(id); setMsg(r.ok ? "Part de l’hôte débloquée." : r.error ?? "Erreur");
          })}>Débloquer la part de l’hôte</button>
      ) : null}
      {canCancel ? (
        <button type="button" disabled={pending} className="rounded-full px-3 py-1 font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
          onClick={() => {
            const motif = window.prompt("Annuler cet événement (le client sera remboursé à 100 %). Motif :");
            if (motif) start(async () => { const r = await cancelEventAction(id, motif); setMsg(r.ok ? "Événement annulé." : r.error ?? "Erreur"); });
          }}>Annuler (Moboo)</button>
      ) : null}
      {msg ? <span className="text-muted">{msg}</span> : null}
    </span>
  );
}
