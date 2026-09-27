"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { requestVisitAction, type InquiryState } from "@/app/annonce/[id]/inquiry-action";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-60">
      {pending ? "Envoi…" : "Demander la visite"}
    </button>
  );
}

export function VisitForm({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<InquiryState, FormData>(requestVisitAction, null);
  const today = new Date().toISOString().slice(0, 10);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm font-semibold text-ink">
        {state.message}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-ink shadow-card transition hover:border-slate-300"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-600"><path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Planifier une visite
      </button>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="font-display font-bold text-ink">Planifier une visite</h3>
      <p className="mt-0.5 text-sm text-muted">Choisissez une date, l'annonceur confirmera.</p>
      <input type="hidden" name="listingId" value={listingId} />
      <div className="mt-4 space-y-3">
        <input name="name" placeholder="Votre nom" className="input" required />
        <input name="phone" type="tel" inputMode="tel" placeholder="Votre téléphone" className="input" required />
        <label className="block text-sm font-semibold text-ink">
          Date souhaitée
          <input name="preferredDate" type="date" min={today} className="input mt-1" />
        </label>
      </div>
      {state && !state.ok ? <p className="mt-2 text-sm font-medium text-red-600">{state.message}</p> : null}
      <div className="mt-4">
        <Submit />
      </div>
    </form>
  );
}
