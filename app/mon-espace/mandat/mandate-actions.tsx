"use client";

import { useState, useTransition } from "react";
import { growthAction } from "../actions";

/** Valider, confirmer ou retirer l'accord donné à l'équipe Moboo. */
export function MandateActions({ mode, token }: { mode: "accept" | "confirm" | "revoke"; token?: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (kind: "accept" | "confirm" | "revoke") => start(async () => {
    if (kind === "revoke" && !window.confirm("Retirer l’accord ? Moboo ne publiera plus de nouvelles annonces pour vous (vos annonces en ligne restent).")) return;
    const r = await growthAction(kind, token);
    if (!r.ok) setError(r.error ?? "Action impossible.");
    else if (kind === "accept") window.history.replaceState(null, "", "/mon-espace/mandat");
  });
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {mode !== "revoke" ? (
          <button type="button" disabled={pending} onClick={() => run(mode)} className="rounded-xl bg-brand-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {mode === "accept" ? "Oui, j’autorise" : "Je confirme"}
          </button>
        ) : null}
        {mode !== "accept" ? (
          <button type="button" disabled={pending} onClick={() => run("revoke")} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 disabled:opacity-50">Retirer l’accord</button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
