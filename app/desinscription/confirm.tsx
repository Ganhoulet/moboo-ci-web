"use client";

import { useState, useTransition } from "react";
import { unsubscribeAction } from "./actions";

/** Bouton de confirmation (un simple clic sur le lien, ou un antivirus qui l'ouvre, ne désinscrit pas). */
export function ConfirmUnsubscribe({ c, a, s }: { c: string; a: string; s: string }) {
  const [res, setRes] = useState<{ ok: boolean; address?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  if (res?.ok) return <p className="rounded-xl bg-emerald-50 p-4 text-emerald-900 ring-1 ring-emerald-200">C’est fait : <strong>{res.address}</strong> ne recevra plus nos {c === "email" ? "e-mails" : "messages WhatsApp"} d’information. Les messages liés à votre compte (réservations, demandes, sécurité) continuent.</p>;
  return (
    <div className="space-y-3">
      <button disabled={pending} onClick={() => start(async () => setRes(await unsubscribeAction(c, a, s)))}
        className="rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{pending ? "…" : "Confirmer la désinscription"}</button>
      {res?.error ? <p className="text-sm text-red-700">{res.error}</p> : null}
    </div>
  );
}
