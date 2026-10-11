"use client";

import { useState, useTransition } from "react";
import { recoverAction } from "./actions";

export function RecoveryForm({ token }: { token: string }) {
  const [p, setP] = useState(""); const [c, setC] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await recoverAction(token, p, c); if (r && !r.ok) setErr(r.error ?? "Erreur."); }); }}>
      <label className="block text-sm font-semibold text-ink">Nouveau mot de passe
        <input type={show ? "text" : "password"} autoComplete="new-password" className="input mt-1" value={p} onChange={(e) => setP(e.target.value)} minLength={8} required />
      </label>
      <label className="block text-sm font-semibold text-ink">Confirmez
        <input type={show ? "text" : "password"} autoComplete="new-password" className="input mt-1" value={c} onChange={(e) => setC(e.target.value)} minLength={8} required />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Afficher</label>
      {err ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p> : null}
      <button disabled={pending} className="btn-primary w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer et me connecter"}</button>
    </form>
  );
}
