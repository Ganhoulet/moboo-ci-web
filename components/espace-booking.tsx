"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitEventReservation, type ReserveState } from "@/app/reserver/actions";
import { LoginToBook } from "@/components/login-to-book";
import { useBookingContact } from "./use-booking-contact";
import { useLiveOccupied } from "./use-live-occupied";
import { AvailabilityCalendar, type CalendarSelection } from "./availability-calendar";
import { API_URL, formatXOF, type OccupiedRange } from "@/lib/api";

const EVENTS = ["mariage", "anniversaire", "conférence", "séminaire", "réception", "autre"];

type CreneauKey = "matinee" | "apres_midi" | "soiree" | "journee";
interface Slots { creneaux: { key: CreneauKey; label: string; debut: string; fin: string }[]; days: Record<string, { pris: CreneauKey[]; full: boolean }> }
interface Devis { total: number; lignes: { label: string; montant: number }[]; disponible: boolean; start: string; end: string }
const nextDay = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-50">
      {pending ? "Envoi…" : "Demander à réserver"}
    </button>
  );
}

export function EspaceBooking({
  espaceId,
  occupied,
  fromPrice,
}: {
  espaceId: string;
  occupied: OccupiedRange[];
  fromPrice?: number | null;
}) {
  const [sel, setSel] = useState<CalendarSelection>({ checkIn: null, checkOut: null, nights: 0 });
  // Calendrier en direct : réservations Moboo Event, site et application.
  const liveOcc = useLiveOccupied("esp", { [espaceId]: occupied })[espaceId] ?? occupied;
  const [state, action] = useFormState<ReserveState, FormData>(submitEventReservation, null);
  const contact = useBookingContact();

  // Lot 2 : réservation par créneau (matinée, après-midi, soirée, journée) avec prix calculé.
  const [slots, setSlots] = useState<Slots | null>(null);
  const [creneau, setCreneau] = useState<CreneauKey | null>(null);
  const [invites, setInvites] = useState(50);
  const [devis, setDevis] = useState<Devis | null>(null);
  const [devisErr, setDevisErr] = useState<string | null>(null);
  useEffect(() => {
    fetch(`${API_URL}/marketplace/espaces/${encodeURIComponent(espaceId)}/creneaux`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null)).then((d) => setSlots(d && Array.isArray(d.creneaux) ? d : null)).catch(() => setSlots(null));
  }, [espaceId, JSON.stringify(liveOcc)]); // eslint-disable-line react-hooks/exhaustive-deps
  const parCreneau = !!slots?.creneaux.length;
  const day = sel.checkIn;
  const nbJours = creneau === "journee" && sel.checkOut ? Math.max(1, sel.nights) : 1;
  const prisCeJour = (day && slots?.days[day]?.pris) || [];
  const fullDays = useMemo<OccupiedRange[]>(
    () => Object.entries(slots?.days ?? {}).filter(([, v]) => v.full).map(([d]) => ({ from: d, to: nextDay(d) })),
    [slots],
  );
  useEffect(() => { if (creneau && prisCeJour.includes(creneau)) setCreneau(null); }, [day, slots]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setDevis(null); setDevisErr(null);
    if (!parCreneau || !day || !creneau) return;
    const t = setTimeout(() => {
      const q = new URLSearchParams({ date: day, creneau, jours: String(nbJours), invites: String(invites || 1) });
      fetch(`${API_URL}/marketplace/espaces/${encodeURIComponent(espaceId)}/devis?${q}`, { cache: "no-store" })
        .then(async (r) => { const d = await r.json().catch(() => null); if (r.ok) setDevis(d); else setDevisErr(d?.message || "Prix indisponible."); })
        .catch(() => setDevisErr("Prix indisponible."));
    }, 300);
    return () => clearTimeout(t);
  }, [parCreneau, day, creneau, nbJours, invites, espaceId]);

  const ready = parCreneau ? !!(day && creneau && devis?.disponible) : !!(sel.checkIn && sel.checkOut);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-green-600 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="mt-3 font-semibold text-ink">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="espaceId" value={espaceId} />
      <input type="hidden" name="dateDebut" value={sel.checkIn ?? ""} />
      <input type="hidden" name="dateFin" value={parCreneau ? sel.checkIn ?? "" : sel.checkOut ?? ""} />
      {parCreneau ? <input type="hidden" name="creneau" value={creneau ?? ""} /> : null}
      {parCreneau ? <input type="hidden" name="nbJours" value={nbJours} /> : null}

      {fromPrice ? (
        <div className="mb-3 flex items-baseline gap-1">
          <span className="text-sm text-muted">À partir de</span>
          <span className="text-2xl font-extrabold text-ink">{formatXOF(fromPrice)}</span>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 p-3">
        <AvailabilityCalendar occupied={parCreneau ? fullDays : liveOcc} onChange={setSel} />
      </div>

      {parCreneau ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">{day ? "Choisissez le créneau" : "Choisissez d’abord une date"}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {slots!.creneaux.map((c) => {
              const pris = prisCeJour.includes(c.key);
              const on = creneau === c.key;
              return (
                <button key={c.key} type="button" disabled={!day || pris} onClick={() => setCreneau(c.key)}
                  className={"rounded-xl px-3 py-2 text-left text-sm ring-1 disabled:opacity-40 " + (on ? "bg-accent-600 text-white ring-accent-600" : "bg-white text-ink ring-slate-300 hover:bg-slate-50")}>
                  <span className="block font-semibold">{c.label}</span>
                  <span className={"block text-xs " + (on ? "text-white/90" : "text-muted")}>{pris ? "Déjà réservé" : `${c.debut} – ${c.fin}`}</span>
                </button>
              );
            })}
          </div>
          {creneau === "journee" ? <p className="mt-1 text-xs text-muted">Plusieurs jours ? Choisissez aussi la date de fin dans le calendrier.</p> : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <label className="text-sm font-semibold text-ink">
          Type d'événement
          <select name="typeEvenement" defaultValue="mariage" className="input mt-1">
            {EVENTS.map((e) => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
        </label>
        <input name="nomEvenement" placeholder="Nom de l'événement (optionnel)" className="input" />
        <input name="nbInvites" type="number" min={1} value={invites} onChange={(e) => setInvites(Number(e.target.value) || 0)} placeholder="Nombre d'invités" className="input" aria-label="Nombre d'invités" />
        <input ref={contact.name} name="guestName" required placeholder="Votre nom" className="input" />
        <input ref={contact.phone} name="guestPhone" required inputMode="tel" placeholder="Téléphone" className="input" />
        <input name="guestEmail" type="email" inputMode="email" autoComplete="email" placeholder="E-mail (facultatif, pour la confirmation)" className="input" aria-label="E-mail pour recevoir la confirmation" />
      </div>

      {devis ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
          {devis.lignes.map((l) => (
            <div key={l.label} className="flex justify-between gap-3"><span className="text-slate-600">{l.label}</span><span className="font-semibold text-ink">{formatXOF(l.montant)}</span></div>
          ))}
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base"><span className="font-bold text-ink">Total</span><span className="font-extrabold text-ink">{formatXOF(devis.total)}</span></div>
          {!devis.disponible ? <p className="mt-1 font-semibold text-red-600">Ce créneau vient d’être réservé : choisissez-en un autre.</p> : null}
        </div>
      ) : devisErr ? <p className="mt-3 text-sm font-medium text-red-600">{devisErr}</p> : null}

      {state && !state.ok && state.loginRequired ? <LoginToBook message={state.message} /> : null}
      {state && !state.ok && !state.loginRequired ? <p className="mt-2 text-sm font-medium text-red-600">{state.message}</p> : null}

      <div className="mt-4">
        <SubmitBtn disabled={!ready} />
      </div>
      <p className="mt-3 text-xs text-muted">
        {parCreneau
          ? "Le propriétaire confirme la date et le prix. Vous payez ensuite 30 % en ligne pour bloquer la date, le solde quelques jours avant ; l’argent est gardé par Moboo jusqu’après l’événement."
          : "Le propriétaire confirme la date et vous envoie un devis. Aucun débit avant confirmation."}
      </p>
    </form>
  );
}
