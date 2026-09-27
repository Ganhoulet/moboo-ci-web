"use client";

import { useFormState, useFormStatus } from "react-dom";
import { agentLoginAction, type AgentLoginState } from "@/app/agent/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60">
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export function AgentLoginForm() {
  const [state, action] = useFormState<AgentLoginState, FormData>(agentLoginAction, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="login" className="mb-1 block text-sm font-semibold text-ink">Identifiant ou e-mail moboo.ci</label>
        <input id="login" name="login" autoComplete="username" placeholder="votre@email.ci" className="input" required />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ink">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" className="input" required />
      </div>
      {state && !state.ok ? <p className="text-sm font-medium text-red-600">{state.message}</p> : null}
      <Submit />
      <p className="text-xs text-muted">
        Utilisez les mêmes identifiants que sur l'application / le site moboo.ci.
      </p>
    </form>
  );
}
