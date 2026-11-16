"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { requestVisit, type VisitState } from "@/app/reserver/actions";
import { API_URL } from "@/lib/api";
import { useBookingContact } from "./use-booking-contact";

interface VisitSlots { actif: boolean; dureeMin: number; jours: { day: string; heures: string[] }[] }
const jour = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function Send() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-50">{pending ? "Envoi…" : "Demander la visite"}</button>;
}

/** Visite gratuite d'une salle, dans les horaires du propriétaire (lot 3). */
export function VisitRequest({ espaceId }: { espaceId: string }) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<VisitSlots | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [heure, setHeure] = useState<string | null>(null);
  const [state, action] = useFormState<VisitState, FormData>(requestVisit, null);
  const contact = useBookingContact();
  useEffect(() => {
    fetch(`${API_URL}/marketplace/espaces/${encodeURIComponent(espaceId)}/visites`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null)).then(setSlots).catch(() => setSlots(null));
  }, [espaceId]);
  if (!slots?.actif || !slots.jours.length) return null;
  if (state?.ok) {
    return (
      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm">
        <p className="font-semibold text-ink">Demande de visite envoyée !</p>
        <p className="mt-1 text-slate-700">Le propriétaire confirme l’heure ; vous recevez l’adresse et l’itinéraire.</p>
        {state.token ? <Link href={`/visite/${state.token}`} className="mt-2 inline-block font-semibold text-green-800 underline">Suivre ma demande</Link> : null}
      </div>
    );
  }
  const heures = slots.jours.find((j) => j.day === day)?.heures ?? [];
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="w-full rounded-full px-4 py-2 text-sm font-semibold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50">
          Visiter la salle avant de réserver (gratuit)
        </button>
      ) : (
        <form action={action} className="grid gap-3">
          <p className="text-sm font-semibold text-ink">Choisissez un moment pour visiter ({slots.dureeMin} min)</p>
          <input type="hidden" name="espaceId" value={espaceId} />
          <input type="hidden" name="debut" value={day && heure ? `${day}T${heure}:00.000Z` : ""} />
          <div className="flex flex-wrap gap-2">
            {slots.jours.slice(0, 10).map((j) => (
              <button key={j.day} type="button" onClick={() => { setDay(j.day); setHeure(null); }}
                className={"rounded-full px-3 py-1 text-xs font-semibold ring-1 " + (day === j.day ? "bg-brand-800 text-white ring-brand-800" : "ring-slate-300 hover:bg-slate-50")}>
                {jour(j.day)}
              </button>
            ))}
          </div>
          {day ? (
            <div className="flex flex-wrap gap-2">
              {heures.map((h) => (
                <button key={h} type="button" onClick={() => setHeure(h)}
                  className={"rounded-lg px-3 py-1 text-sm ring-1 " + (heure === h ? "bg-accent-600 text-white ring-accent-600" : "ring-slate-300 hover:bg-slate-50")}>{h}</button>
              ))}
            </div>
          ) : null}
          <input ref={contact.name} name="nom" required placeholder="Votre nom" className="input" />
          <input ref={contact.phone} name="telephone" required inputMode="tel" placeholder="Téléphone" className="input" />
          <input name="email" type="email" placeholder="E-mail (facultatif)" className="input" />
          {state && !state.ok ? <p className="text-sm font-medium text-red-600">{state.message}</p> : null}
          {day && heure ? <Send /> : <p className="text-xs text-muted">Choisissez un jour puis une heure.</p>}
        </form>
      )}
    </div>
  );
}
