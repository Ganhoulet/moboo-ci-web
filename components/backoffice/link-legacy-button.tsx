"use client";

import { useState, useTransition } from "react";
import { linkLegacyListings } from "@/app/admin/immobilier/actions";

/** Rattacher les biens repris de moboo.ci à leurs comptes (aussi fait chaque nuit et à chaque connexion). */
export function LinkLegacyButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => {
          const r = await linkLegacyListings();
          setMsg(r.ok ? `${r.linked} bien(s) rattaché(s) sur ${r.accounts} compte(s).` : r.error ?? "Erreur.");
        })}
        title="Associe les biens de l'ancien moboo.ci aux comptes qui ont le même téléphone ou e-mail"
        className="rounded-md border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
      >
        {pending ? "Rattachement…" : "Rattacher les biens repris"}
      </button>
      {msg ? <span className="text-xs text-slate-600">{msg}</span> : null}
    </span>
  );
}
