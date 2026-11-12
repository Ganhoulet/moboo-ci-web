"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { decideAction, type DecisionState } from "./actions";

function Btn({ value, children, className }: { value: string; children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" name="decision" value={value} disabled={pending} className={className}>{pending ? "Envoi…" : children}</button>;
}

const DONE: Record<string, string> = {
  accepted: "C’est accepté. Le voyageur reçoit le lien pour payer l’acompte ; vous serez prévenu dès le paiement.",
  refused: "La demande est refusée. Le voyageur est prévenu.",
  other: "Cette demande n’est plus en attente.",
};

/** Accepter ou refuser : rien ne se passe à l'ouverture du lien, seulement au clic. */
export function DecisionForm({ token, initialChoice }: { token: string; initialChoice: "accept" | "refuse" | null }) {
  const [state, action] = useFormState<DecisionState, FormData>(decideAction, null);
  const [refusing, setRefusing] = useState(initialChoice === "refuse");
  if (state?.ok) {
    return <p className="rounded-xl bg-emerald-50 p-4 text-base font-semibold text-emerald-800">{state.already ? "Cette demande a déjà reçu une réponse. " : ""}{DONE[state.state ?? "other"] ?? DONE.other}</p>;
  }
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {refusing ? (
        <>
          <label className="block text-sm font-semibold text-ink">Motif (facultatif, transmis au voyageur)
            <input name="reason" maxLength={200} placeholder="ex. Logement déjà occupé à ces dates" className="input mt-1" />
          </label>
          <Btn value="refuse" className="h-12 w-full rounded-xl bg-slate-800 text-base font-bold text-white disabled:opacity-60">Confirmer le refus</Btn>
          <button type="button" onClick={() => setRefusing(false)} className="w-full text-sm font-semibold text-brand-800 underline">Revenir pour accepter</button>
        </>
      ) : (
        <>
          <Btn value="accept" className="h-12 w-full rounded-xl bg-accent-600 text-base font-bold text-white hover:bg-accent-700 disabled:opacity-60">Accepter la demande</Btn>
          <button type="button" onClick={() => setRefusing(true)} className="h-12 w-full rounded-xl text-base font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Refuser</button>
        </>
      )}
      {state && !state.ok ? <p className="text-sm font-medium text-red-700">{state.message}</p> : null}
    </form>
  );
}
