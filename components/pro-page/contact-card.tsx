"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendProInquiryAction, type ProInquiryState } from "@/app/pro/[username]/contact-action";

function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="w-full rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60">{pending ? "Envoi…" : "Envoyer"}</button>;
}

const input = "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink";

/** Formulaire « Contacter » de la page pro (la réponse arrive dans Messages si le visiteur est connecté). */
export function ContactForm({ username, firstName, defaults }: { username: string; firstName: string; defaults?: { name?: string; phone?: string } }) {
  const [state, action] = useFormState<ProInquiryState, FormData>(sendProInquiryAction, null);
  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
        <p className="font-semibold">Message envoyé ✓</p>
        <p className="mt-1">{state.message}</p>
        {state.link ? <a href={state.link.href} className="mt-2 inline-block font-semibold underline">{state.link.label}</a> : null}
      </div>
    );
  }
  return (
    <form action={action} className="space-y-2.5">
      <input type="hidden" name="toUsername" value={username} />
      <input name="name" required placeholder="Votre nom" defaultValue={defaults?.name} className={input} />
      <input name="phone" required type="tel" placeholder="Téléphone (WhatsApp)" defaultValue={defaults?.phone} className={input} />
      <input name="email" type="email" placeholder="E-mail (facultatif)" className={input} />
      <select name="userType" className={input} defaultValue="">
        <option value="" disabled>Vous êtes…</option>
        <option value="buyer">Acheteur</option><option value="tenant">Locataire</option><option value="seller">Vendeur / propriétaire</option><option value="other">Autre</option>
      </select>
      <textarea name="message" rows={3} className={input} defaultValue={`Bonjour ${firstName}, je souhaite être accompagné(e) pour un projet immobilier.`} />
      {state && !state.ok ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <Submit />
      <p className="text-center text-[11px] text-muted">En envoyant, vous acceptez d’être recontacté par ce professionnel.</p>
    </form>
  );
}
