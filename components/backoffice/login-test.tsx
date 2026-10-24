"use client";

import { useState, useTransition } from "react";
import { loginTestAction, type LoginTestResult } from "@/app/admin/utilisateurs/diagnostic/actions";

const yn = (b: boolean | null | undefined) => (b == null ? "—" : b ? "oui" : "non");

/** Tester un identifiant + mot de passe dans les contrôles Moboo.ci et Moboo Pro. */
export function LoginTest({ initialIdentifier }: { initialIdentifier: string }) {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState("");
  const [res, setRes] = useState<LoginTestResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
      <h2 className="font-semibold text-ink">Tester un mot de passe</h2>
      <p className="text-xs text-muted">Saisissez l’identifiant et le mot de passe exactement comme dans l’application. Ils passent dans les contrôles de Moboo.ci et de Moboo Pro, sans ouvrir de session ; rien n’est enregistré.</p>
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { setRes(await loginTestAction(identifier, password)); setPassword(""); }); }}>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Identifiant" className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="min-w-[180px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button disabled={pending || !identifier || !password} className="rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-50">{pending ? "Test…" : "Tester"}</button>
      </form>
      {res?.error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{res.error}</p> : null}
      {res?.mobooCi ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-ink">Application Moboo.ci</p>
            <p className={"mt-1 font-medium " + (res.mobooCi.result.startsWith("ACCEPTÉ") ? "text-emerald-700" : "text-red-700")}>{res.mobooCi.result}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
              <dt className="text-muted">Compte trouvé par</dt><dd>{res.mobooCi.account?.foundBy ?? "aucun compte"}</dd>
              <dt className="text-muted">Mot de passe du nouveau site</dt><dd>{res.mobooCi.sitePasswordMatches == null ? "aucun" : res.mobooCi.sitePasswordMatches ? "correct" : "différent"}</dd>
              <dt className="text-muted">Ancien mot de passe moboo.ci</dt><dd>{res.mobooCi.legacyPasswordMatches ? `correct (${res.mobooCi.legacyLogin})` : "non"}</dd>
              <dt className="text-muted">Ancien compte relié à ce compte</dt><dd>{yn(res.mobooCi.legacyLinkedToSameAccount)}</dd>
              <dt className="text-muted">Bloqué (trop d’essais)</dt><dd>{yn(res.mobooCi.lockedNow)} · {res.mobooCi.failuresCounted} échec(s)</dd>
            </dl>
          </div>
          <div className="rounded-md bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-ink">Moboo Pro (même contrôle que l’application Pro)</p>
            <p className={"mt-1 font-medium " + (res.mobooPro?.startsWith("ACCEPTÉ") ? "text-emerald-700" : "text-red-700")}>{res.mobooPro}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
