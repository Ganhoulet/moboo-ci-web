"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { coListingAction } from "@/app/mon-espace/actions";

/** Accepter ou refuser la proposition (compte agent / agence connecté). */
export function CoDecision({ token }: { token: string }) {
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const go = (what: "accept" | "reject") => start(async () => {
    const r = await coListingAction(token, what);
    setState(r.ok ? { ok: true, text: what === "accept" ? "Collaboration acceptée ! Votre lien de diffusion est dans Mon espace → Collaborations." : "Proposition refusée." } : { ok: false, text: r.error });
  });
  if (state?.ok) return <div className="rounded-2xl bg-emerald-50 p-4 text-center text-emerald-900"><p className="font-semibold">{state.text}</p><Link href="/mon-espace/collaborations" className="mt-2 inline-block font-bold underline">Mes collaborations</Link></div>;
  return (
    <div className="space-y-2">
      <button type="button" disabled={pending} onClick={() => go("accept")} className="w-full rounded-full bg-accent-600 px-6 py-3.5 font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "…" : "Accepter la collaboration"}</button>
      <button type="button" disabled={pending} onClick={() => go("reject")} className="w-full rounded-full px-6 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300">Refuser</button>
      {state && !state.ok ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.text}</p> : null}
    </div>
  );
}
