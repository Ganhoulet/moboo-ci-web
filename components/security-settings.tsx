"use client";

import { useState, useTransition } from "react";
import { GoogleButton } from "./login-panel";
import {
  linkGoogleAction, sendPasswordCodeAction, setPasswordAction, unlinkGoogleAction,
} from "@/app/mon-espace/actions";

/** « Connexion & sécurité » : mot de passe (identifiant) et compte Google. */
export function SecuritySettings({ hasPassword, googleLinked, username, email, phone, googleClientId }: {
  hasPassword: boolean; googleLinked: boolean; username: string | null; email: string | null; phone: string;
  googleClientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [useCode, setUseCode] = useState(false);
  const [current, setCurrent] = useState("");
  const [code, setCode] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [pending, start] = useTransition();
  const [linked, setLinked] = useState(googleLinked);
  const [pwd, setPwd] = useState(hasPassword);

  const identifiers = [username, email, phone].filter(Boolean).join(" · ");

  const save = () => start(async () => {
    setMsg(null);
    if (next.length < 8) return setMsg({ ok: false, text: "8 caractères minimum." });
    if (next !== confirm) return setMsg({ ok: false, text: "Les deux mots de passe ne correspondent pas." });
    const r = await setPasswordAction({
      newPassword: next,
      ...(pwd && !useCode ? { currentPassword: current } : {}),
      ...(pwd && useCode ? { code } : {}),
    });
    if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Enregistrement impossible." });
    setPwd(true); setOpen(false); setCurrent(""); setCode(""); setNext(""); setConfirm("");
    setMsg({ ok: true, text: "Mot de passe enregistré. Vous pouvez vous connecter par identifiant." });
  });

  const sendCode = () => start(async () => {
    const r = await sendPasswordCodeAction();
    setUseCode(true); setDevCode(r.devCode);
    setMsg(r.ok ? { ok: true, text: "Code envoyé sur votre numéro." } : { ok: false, text: r.error ?? "Envoi impossible." });
  });

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-bold text-ink">Connexion & sécurité</h2>
      <p className="mt-1 text-sm text-muted">Choisissez comment vous connecter : code sur votre numéro, identifiant + mot de passe, ou Google.</p>

      <div className="mt-5 divide-y divide-slate-100">
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink">Code par téléphone</p>
            <p className="truncate text-sm text-muted">{phone}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Actif</span>
        </div>

        <div className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-ink">Identifiant + mot de passe</p>
              <p className="truncate text-sm text-muted">{pwd ? `Identifiants : ${identifiers}` : "Pas encore de mot de passe."}</p>
            </div>
            <button type="button" onClick={() => { setOpen((v) => !v); setMsg(null); }}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-50">
              {open ? "Fermer" : pwd ? "Changer" : "Créer"}
            </button>
          </div>
          {!username && !pwd ? (
            <p className="mt-2 text-xs text-muted">Astuce : ajoutez un nom d'utilisateur ci-dessus pour vous connecter avec lui.</p>
          ) : null}
          {open ? (
            <div className="mt-4 space-y-3">
              {pwd ? (
                useCode ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink">Code reçu par message</label>
                    <input className="input tracking-[0.3em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 chiffres" />
                    {devCode ? <p className="mt-1 text-xs font-semibold text-accent-700">Code de test : {devCode}</p> : null}
                  </div>
                ) : (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-semibold text-ink">Mot de passe actuel</label>
                      <button type="button" onClick={sendCode} disabled={pending} className="text-xs font-semibold text-brand-800 hover:underline">Oublié ? Recevoir un code</button>
                    </div>
                    <input className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                  </div>
                )
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Nouveau mot de passe</label>
                  <input className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="8 caractères minimum" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Confirmer</label>
                  <input className="input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
              </div>
              <button type="button" onClick={save} disabled={pending} className="btn-primary w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60 sm:w-auto">
                {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink">Google</p>
            <p className="text-sm text-muted">{linked ? "Compte Google relié : « Continuer avec Google » suffit." : "Connectez-vous en un clic avec votre Gmail."}</p>
          </div>
          {linked ? (
            <button type="button" disabled={pending}
              onClick={() => start(async () => { const r = await unlinkGoogleAction(); if (r.ok) setLinked(false); })}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Délier
            </button>
          ) : null}
        </div>
        {!linked && googleClientId ? (
          <div className="pb-2">
            <GoogleButton clientId={googleClientId} text="signin_with" onCredential={(c) => start(async () => {
              const r = await linkGoogleAction(c);
              if (r.ok) { setLinked(true); setMsg({ ok: true, text: "Compte Google relié." }); }
              else setMsg({ ok: false, text: r.error ?? "Liaison impossible." });
            })} />
          </div>
        ) : null}
        {!linked && !googleClientId ? <p className="pb-2 text-xs text-muted">La connexion Google sera disponible très bientôt.</p> : null}
      </div>

      {msg ? <p className={"mt-3 text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </section>
  );
}
