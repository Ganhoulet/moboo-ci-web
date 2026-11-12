"use client";

import { useFormState, useFormStatus } from "react-dom";
import { payAction, type PayState } from "./actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="w-full rounded-full bg-accent-600 px-6 py-4 text-base font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "Ouverture du paiement…" : label}</button>;
}

/** Bouton « Payer » : rien n'est débité avant la validation sur la page de paiement. */
export function PayButton({ token, label }: { token: string; label: string }) {
  const [state, action] = useFormState<PayState, FormData>(payAction, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Submit label={label} />
      {state && !state.ok ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p> : null}
      {state?.ok ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Cette facture est déjà réglée. Merci !</p> : null}
    </form>
  );
}
