"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveSearchAction } from "@/app/compte/searches-actions";
import type { SearchParams } from "@/lib/searches";

export function SaveSearchButton({
  params,
  loggedIn,
  variant = "ghost",
}: {
  params: SearchParams;
  loggedIn: boolean;
  /** primary : bouton plein de la barre façon Zillow (« Enregistrer la recherche »). */
  variant?: "ghost" | "primary";
}) {
  const primary = variant === "primary";
  const btn = primary
    ? "inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-xl bg-brand-800 px-4 text-sm font-bold text-white transition hover:bg-brand-900 disabled:opacity-60"
    : "btn-ghost text-sm disabled:opacity-60";
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rien à enregistrer si aucun critère.
  const hasCriteria = Object.values(params).some((v) => v != null && v !== "");
  if (!hasCriteria && !primary) return null;

  if (!loggedIn) {
    return (
      <Link href="/compte" className={btn}>
        <BellIcon /> {primary ? "Enregistrer la recherche" : "Connexion pour créer une alerte"}
      </Link>
    );
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Recherche enregistrée
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending || !hasCriteria}
        title={hasCriteria ? undefined : "Choisissez d’abord un lieu, un prix ou un type de bien"}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await saveSearchAction(params);
            if (res.ok) setDone(true);
            else setError(res.message);
          })
        }
        className={btn}
      >
        <BellIcon /> {pending ? "Enregistrement…" : primary ? "Enregistrer la recherche" : "Enregistrer cette recherche"}
      </button>
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5 inline">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
