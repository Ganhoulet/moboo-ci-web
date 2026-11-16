"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Answer = "arrived" | "absent" | "problem";
type Send = (answer: Answer, note?: string) => Promise<{ ok: true } | { ok: false; error: string }>;

const CONFIRM: Record<Answer, string> = {
  arrived: "Confirmer que vous êtes bien arrivé dans le logement ?",
  absent: "Confirmer que vous n’êtes pas venu ? La réservation sera marquée « non présenté ».",
  problem: "",
};

/**
 * « Êtes-vous bien arrivé ? » (l'hôte n'a pas saisi le code d'arrivée) : trois réponses.
 * `noShow` rappelle la règle de non-présentation réglée dans le back-office.
 */
export function ArrivalAnswer({ send, noShow }: { send: Send; noShow?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [problem, setProblem] = useState(false);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<Answer | null>(null);

  const go = (answer: Answer) => {
    if (answer !== "problem" && !window.confirm(CONFIRM[answer])) return;
    setErr(null);
    start(async () => {
      const r = await send(answer, answer === "problem" ? note.trim() : undefined);
      if (!r.ok) setErr(r.error);
      else { setDone(answer); router.refresh(); }
    });
  };

  if (done) {
    return (
      <p className="rounded-xl bg-white p-4 text-sm text-ink ring-1 ring-slate-200">
        {done === "arrived" ? "Merci ! Votre arrivée est enregistrée. Bon séjour." : done === "absent" ? "C’est noté : la réservation est marquée « non présenté »." : "Votre signalement est transmis : l’équipe Moboo vous contacte rapidement."}
      </p>
    );
  }
  return (
    <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-display text-lg font-bold text-ink">Êtes-vous bien arrivé ?</h2>
      <p className="text-sm text-slate-700">L’hôte n’a pas encore enregistré votre arrivée avec votre code. Dites-nous ce qu’il en est : sans réponse, l’équipe Moboo vous contactera.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => go("arrived")} className="btn-primary bg-green-700 hover:bg-green-800 disabled:opacity-60">Je suis arrivé</button>
        <button type="button" disabled={pending} onClick={() => go("absent")} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-white disabled:opacity-60">Je ne suis pas venu</button>
        <button type="button" disabled={pending} onClick={() => setProblem(true)} className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60">Il y a un problème</button>
      </div>
      {noShow ? <p className="text-xs text-slate-600">{noShow}</p> : null}
      {problem ? (
        <div className="space-y-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000}
            placeholder="Ex. : porte fermée, hôte injoignable, logement différent de l’annonce…"
            className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
          <button type="button" disabled={pending || note.trim().length < 5} onClick={() => go("problem")} className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
            {pending ? "Envoi…" : "Envoyer à l’équipe Moboo"}
          </button>
        </div>
      ) : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </section>
  );
}
