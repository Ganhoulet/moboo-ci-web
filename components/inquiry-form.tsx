"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendInquiryAction, type InquiryState } from "@/app/annonce/[id]/inquiry-action";
import { USER_TYPES } from "@/lib/api";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60">
      {pending ? "Envoi…" : "Envoyer la demande"}
    </button>
  );
}

export function InquiryForm({ listingId, title }: { listingId: string; title: string }) {
  const [state, action] = useFormState<InquiryState, FormData>(sendInquiryAction, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-green-600 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="mt-3 font-semibold text-ink">{state.message}</p>
        {state.link ? <a href={state.link.href} className="mt-3 inline-block rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900">{state.link.label}</a> : null}
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="font-display font-bold text-ink">Envoyer une demande</h3>
      <p className="mt-0.5 text-sm text-muted">Intéressé par « {title} » ? Laissez vos coordonnées.</p>
      <input type="hidden" name="listingId" value={listingId} />
      <div className="mt-4 space-y-3">
        <input name="name" placeholder="Votre nom" className="input" required />
        <input name="phone" type="tel" inputMode="tel" placeholder="Votre téléphone" className="input" required />
        <input name="email" type="email" placeholder="Votre e-mail (optionnel)" className="input" />
        <select name="userType" className="input" defaultValue="" aria-label="Vous êtes">
          <option value="">Vous êtes… (optionnel)</option>
          {USER_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <textarea
          name="message"
          rows={3}
          placeholder="Votre message (optionnel)"
          className="input resize-none"
          defaultValue="Bonjour, ce bien est-il toujours disponible ?"
        />
      </div>
      {state && !state.ok ? <p className="mt-2 text-sm font-medium text-red-600">{state.message}</p> : null}
      <div className="mt-4">
        <Submit />
      </div>
    </form>
  );
}
