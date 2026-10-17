"use client";

import { useState, useTransition } from "react";
import { activateInvitationAction } from "./actions";

export function ActivateForm({ token, pending, login }: { token: string; pending: boolean; login: string }) {
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<null | "created" | "linked">(null);
  const [busy, start] = useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pending && pwd.length < 6) return setErr("Le mot de passe doit contenir au moins 6 caractères.");
    if (pending && pwd !== pwd2) return setErr("Les deux mots de passe ne correspondent pas.");
    start(async () => {
      const r = await activateInvitationAction(token, pending ? pwd : "");
      if (!r.ok) return setErr(r.error ?? "Activation impossible.");
      setDone(r.alreadyActive ? "linked" : "created");
    });
  };
  if (done) {
    return (
      <div className="mt-6 text-center">
        <p className="text-4xl" aria-hidden="true">✅</p>
        <h2 className="mt-2 font-display text-lg font-extrabold text-ink">{done === "created" ? "Votre compte est activé !" : "C’est fait !"}</h2>
        <p className="mt-1 text-sm text-muted">
          {done === "created" ? "Téléchargez Moboo Pro et connectez-vous" : "Votre espace est rattaché. Connectez-vous à Moboo Pro"}
          {login ? <> avec <strong>{login}</strong></> : null}.
        </p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="mt-5 space-y-3">
      {pending ? (
        <>
          <label className="block text-sm font-semibold text-slate-700">Créez votre mot de passe
            <input type="password" required minLength={6} autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Au moins 6 caractères"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Confirmez le mot de passe
            <input type="password" required minLength={6} autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} placeholder="Retapez le mot de passe"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          </label>
        </>
      ) : <p className="text-sm text-slate-700">Vous avez déjà un compte Moboo Pro : confirmez pour rattacher cet espace à votre compte.</p>}
      {err ? <p role="alert" className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{err}</p> : null}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand-800 py-3 text-sm font-bold text-white hover:bg-brand-900 disabled:opacity-60">
        {busy ? "Un instant…" : pending ? "✓ Activer mon compte" : "✓ Confirmer"}
      </button>
    </form>
  );
}
