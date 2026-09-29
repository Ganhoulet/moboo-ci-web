"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { LoginFlow } from "./login-flow";
import { googleLoginAction, passwordLoginAction, type PasswordState } from "@/app/compte/actions";

type Mode = "telephone" | "identifiant";

declare global {
  interface Window { google?: any }
}

/** Charge le script Google Identity Services une seule fois. */
function loadGoogle(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("gsi-client") as HTMLScriptElement | null;
    const s = existing ?? Object.assign(document.createElement("script"), {
      id: "gsi-client", src: "https://accounts.google.com/gsi/client", async: true, defer: true,
    });
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("gsi")));
    if (!existing) document.head.appendChild(s);
  });
}

/** Bouton officiel « Continuer avec Google » ; renvoie le jeton d'identité. */
export function GoogleButton({ clientId, onCredential, text = "continue_with" }: {
  clientId: string; onCredential: (credential: string) => void; text?: "continue_with" | "signin_with" | "signup_with";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadGoogle().then(() => {
      if (!alive || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r: { credential?: string }) => r.credential && cb.current(r.credential),
        ux_mode: "popup",
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline", size: "large", shape: "pill", text, locale: "fr",
        width: Math.min(ref.current.offsetWidth || 360, 400),
      });
    }).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [clientId, text]);

  if (failed) return <p className="text-center text-xs text-muted">Google est indisponible pour le moment.</p>;
  return <div ref={ref} className="flex min-h-[44px] w-full justify-center" />;
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-60">
      {pending ? "Un instant…" : label}
    </button>
  );
}

function PasswordForm({ onForgot }: { onForgot: () => void }) {
  const [state, action] = useFormState<PasswordState, FormData>(passwordLoginAction, null);
  const [show, setShow] = useState(false);
  useEffect(() => { if (state?.redirectTo) window.location.assign(state.redirectTo); }, [state]);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="identifier" className="mb-1 block text-sm font-semibold text-ink">Identifiant</label>
        <input id="identifier" name="identifier" autoComplete="username" autoCapitalize="none" spellCheck={false}
          placeholder="Nom d'utilisateur, e-mail ou numéro" className="input" required />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-semibold text-ink">Mot de passe</label>
          <button type="button" onClick={onForgot} className="text-xs font-semibold text-brand-800 hover:underline">Mot de passe oublié ?</button>
        </div>
        <div className="relative">
          <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password"
            placeholder="••••••••" className="input pr-20" required />
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">
            {show ? "Masquer" : "Afficher"}
          </button>
        </div>
      </div>
      {state?.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}
      <Submit label="Se connecter" />
      <p className="text-xs text-muted">
        Vos identifiants de l'application et du site moboo.ci fonctionnent aussi.
      </p>
    </form>
  );
}

/**
 * Connexion au choix : code reçu sur le numéro, identifiant + mot de passe,
 * ou Google (client OAuth : lib/google).
 */
export function LoginPanel({ initialMode = "telephone", googleClientId, methods = { phone: true, password: true } }: {
  initialMode?: Mode; googleClientId?: string;
  /** Méthodes activées dans le back-office (Connexion et inscription). */
  methods?: { phone: boolean; password: boolean };
}) {
  // Au moins une méthode : le code par téléphone reste le recours.
  const tabs = ([["telephone", "Par téléphone"], ["identifiant", "Par identifiant"]] as const)
    .filter(([m]) => (m === "telephone" ? methods.phone : methods.password));
  const available: Mode[] = tabs.length ? tabs.map(([m]) => m) : ["telephone"];
  const [mode, setMode] = useState<Mode>(available.includes(initialMode) ? initialMode : available[0]);
  const [google, setGoogle] = useState<{ ticket: string; email?: string | null } | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onCredential = async (credential: string) => {
    setBusy(true); setGoogleError(null);
    const r = await googleLoginAction(credential);
    if (r.status === "ok") { window.location.assign(r.redirectTo); return; }
    setBusy(false);
    if (r.status === "need_phone") { setGoogle({ ticket: r.googleTicket, email: r.email }); setMode("telephone"); }
    else setGoogleError(r.error);
  };

  if (google) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
          <p className="font-semibold">Dernière étape</p>
          <p className="mt-0.5">
            Confirmez votre numéro pour terminer{google.email ? <> avec <span className="font-semibold">{google.email}</span></> : null}.
            Ensuite, le bouton Google suffira.
          </p>
        </div>
        <LoginFlow googleTicket={google.ticket} />
        <button type="button" onClick={() => setGoogle(null)} className="w-full text-center text-sm font-semibold text-muted hover:text-ink">
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {googleClientId ? (
        <div className="space-y-2">
          {busy ? <p className="py-2.5 text-center text-sm font-semibold text-muted">Connexion avec Google…</p> : <GoogleButton clientId={googleClientId} onCredential={onCredential} />}
          {googleError ? <p className="text-center text-sm font-medium text-red-600">{googleError}</p> : null}
          <div className="flex items-center gap-3 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> ou <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      ) : null}

      {tabs.length > 1 ? <div role="tablist" className="grid grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
        {tabs.map(([m, label]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={"rounded-full px-3 py-2 transition " + (mode === m ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink")}>
            {label}
          </button>
        ))}
      </div> : null}

      {mode === "telephone" ? <LoginFlow /> : <PasswordForm onForgot={() => setMode("telephone")} />}
    </div>
  );
}
