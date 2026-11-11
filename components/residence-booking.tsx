"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitReservation, type ReserveState } from "@/app/reserver/actions";
import { LoginToBook } from "@/components/login-to-book";
import { useBookingContact } from "./use-booking-contact";
import { useLiveOccupied } from "./use-live-occupied";
import { AvailabilityCalendar, type CalendarSelection } from "./availability-calendar";
import { formatXOF, type OccupiedRange } from "@/lib/api";

export type BookableApt = { id: string; type: string; nightlyPrice: number };

/** Modèle et textes du bloc de réservation (back-office → Réglages → Formulaire de réservation). */
export interface BookingLook { template: "classic" | "availability" | "express"; buttonText: string; buttonColor: string; note: string }
export const DEFAULT_LOOK: BookingLook = { template: "classic", buttonText: "Réserver", buttonColor: "#ea580c", note: "Aucun paiement avant la confirmation de l’hôte" };

const SAFE_COLOR = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
const WEEK = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
function shortDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return `${WEEK[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;
}
/** Aucune nuit occupée entre l'arrivée (incluse) et le départ (exclu). */
function rangeFree(occ: OccupiedRange[], from: string, to: string) {
  for (let d = from; d < to; d = addDays(d, 1)) if (occ.some((r) => d >= r.from && d < r.to)) return false;
  return true;
}

function SubmitBtn({ disabled, look }: { disabled: boolean; look: BookingLook }) {
  const { pending } = useFormStatus();
  const color = SAFE_COLOR.test(look.buttonColor) ? look.buttonColor : DEFAULT_LOOK.buttonColor;
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      style={{ backgroundColor: color }}
      className="btn-primary h-12 w-full text-base hover:brightness-95 disabled:opacity-50"
    >
      {pending ? "Envoi…" : look.buttonText || DEFAULT_LOOK.buttonText}
    </button>
  );
}

export function ResidenceBooking({
  apartments,
  occupiedByApt,
  depositPercent = 30,
  look = DEFAULT_LOOK,
}: {
  apartments: BookableApt[];
  occupiedByApt: Record<string, OccupiedRange[]>;
  depositPercent?: number;
  look?: BookingLook;
}) {
  const [aptId, setAptId] = useState(apartments[0]?.id ?? "");
  // Calendrier en direct : réservations Moboo Resi, site et application.
  const liveOcc = useLiveOccupied("apt", occupiedByApt);
  const [sel, setSel] = useState<CalendarSelection>({ checkIn: null, checkOut: null, nights: 0 });
  const [calendarOpen, setCalendarOpen] = useState(look.template !== "classic");
  const [state, action] = useFormState<ReserveState, FormData>(submitReservation, null);
  const contact = useBookingContact();

  const apt = apartments.find((a) => a.id === aptId);
  const occ = liveOcc[aptId] ?? [];
  const free = !!(sel.checkIn && sel.checkOut && rangeFree(occ, sel.checkIn, sel.checkOut));
  const total = apt && sel.nights ? apt.nightlyPrice * sel.nights : 0;
  const deposit = Math.round((total * depositPercent) / 100);
  const ready = !!(aptId && free);
  const pickDates = (s: CalendarSelection) => { setSel(s); if (look.template === "classic" && s.checkOut) setCalendarOpen(false); };

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

  const priceLine = apt ? (
    <div className="flex items-baseline gap-1">
      <span className="font-display text-2xl font-extrabold text-ink">{formatXOF(apt.nightlyPrice)}</span>
      <span className="text-sm text-muted">/ nuit</span>
    </div>
  ) : null;

  const apartmentSelect = apartments.length > 1 && look.template !== "availability" ? (
    <label className="block text-sm font-semibold text-ink">
      Logement
      <select className="input mt-1" value={aptId} onChange={(e) => { setAptId(e.target.value); setSel({ checkIn: null, checkOut: null, nights: 0 }); }}>
        {apartments.map((a) => <option key={a.id} value={a.id}>{a.type} — {formatXOF(a.nightlyPrice)}/nuit</option>)}
      </select>
    </label>
  ) : null;

  // Le calendrier reste monté (sélection conservée) même replié.
  const calendar = (occupied: OccupiedRange[], k: string) => (
    <div className={calendarOpen ? "rounded-xl border border-slate-200 p-3" : "hidden"}>
      <AvailabilityCalendar key={k} occupied={occupied} onChange={pickDates} />
    </div>
  );

  const breakdown = sel.nights > 0 && apt ? (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-slate-700"><span>{formatXOF(apt.nightlyPrice)} × {sel.nights} nuit{sel.nights > 1 ? "s" : ""}</span><span>{formatXOF(total)}</span></div>
      <div className="flex justify-between text-slate-700"><span>Acompte à la confirmation ({depositPercent} %)</span><span>{formatXOF(deposit)}</span></div>
      <div className="flex justify-between text-slate-700"><span>Reste à régler à l’arrivée</span><span>{formatXOF(total - deposit)}</span></div>
      <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-ink"><span>Total</span><span>{formatXOF(total)}</span></div>
    </div>
  ) : null;

  const unavailable = sel.checkIn && sel.checkOut && !free
    ? <p className="text-sm font-medium text-red-700">Ces dates ne sont pas toutes libres pour ce logement. Choisissez-en d’autres.</p>
    : null;

  const persons = (className = "input") => (
    <input name="personsCount" type="number" min={1} defaultValue={1} className={className} aria-label="Voyageurs" />
  );

  const contactFields = (
    <div className="grid gap-3">
      <input ref={contact.name} name="guestName" required placeholder="Votre nom" className="input" aria-label="Votre nom" />
      <input ref={contact.phone} name="guestPhone" required inputMode="tel" placeholder="Téléphone (mobile money)" className="input" aria-label="Téléphone" />
    </div>
  );

  const footer = (
    <>
      {state && !state.ok && state.loginRequired ? <LoginToBook message={state.message} /> : null}
      {state && !state.ok && !state.loginRequired ? <p className="text-sm font-medium text-red-600">{state.message}</p> : null}
      <SubmitBtn disabled={!ready} look={look} />
      {look.note ? <p className="text-center text-xs text-slate-600">{look.note}</p> : null}
    </>
  );

  let content: React.ReactNode;
  if (look.template === "availability") {
    content = (
      <>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="font-display text-lg font-bold text-ink">Disponibilités</p>
            <p className="text-xs text-muted">Acompte de {depositPercent} % à la confirmation</p>
          </div>
          <button type="button" onClick={() => setCalendarOpen((o) => !o)} className="text-sm font-semibold text-brand-800 underline">
            {sel.checkIn ? `${shortDate(sel.checkIn)} → ${shortDate(sel.checkOut) ?? "?"}` : "Choisir les dates"}
          </button>
        </div>
        {calendar(apartments.length === 1 ? occ : [], "all")}
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl ring-1 ring-slate-200">
          {apartments.map((a) => {
            const o = liveOcc[a.id] ?? [];
            const known = !!(sel.checkIn && sel.checkOut);
            const ok = known ? rangeFree(o, sel.checkIn!, sel.checkOut!) : true;
            const chosen = a.id === aptId;
            return (
              <li key={a.id} className={"flex items-center justify-between gap-3 p-3 " + (chosen ? "bg-brand-50" : "bg-white")}>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{a.type}</p>
                  <p className="text-xs text-slate-600">{known ? `${formatXOF(a.nightlyPrice * sel.nights)} pour ${sel.nights} nuit${sel.nights > 1 ? "s" : ""}` : `${formatXOF(a.nightlyPrice)} / nuit`}</p>
                  {known ? <p className={"text-xs font-semibold " + (ok ? "text-emerald-700" : "text-red-700")}>{ok ? "Libre à ces dates" : "Complet à ces dates"}</p> : null}
                </div>
                <button type="button" disabled={!ok} onClick={() => setAptId(a.id)}
                  className={"shrink-0 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-40 " + (chosen ? "bg-brand-800 text-white" : "bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-50")}>
                  {chosen ? "Choisi" : "Choisir"}
                </button>
              </li>
            );
          })}
        </ul>
        {unavailable}
        {breakdown}
        <label className="block text-sm font-semibold text-ink">Voyageurs{persons("input mt-1")}</label>
        {contactFields}
        {footer}
        <ul className="grid gap-1.5 text-xs text-slate-600">
          {["Paiement par Wave, Orange Money, MTN ou Moov", "Acompte conservé par Moboo jusqu’à l’arrivée", "Code d’arrivée envoyé après le paiement"].map((t) => <li key={t}>✓ {t}</li>)}
        </ul>
      </>
    );
  } else if (look.template === "express") {
    content = <Express apt={apt} occ={occ} sel={sel} setSel={setSel} calendar={calendar} calendarOpen={calendarOpen} setCalendarOpen={setCalendarOpen}
      head={<>{priceLine}{apartmentSelect}</>} tail={<>{unavailable}{sel.nights > 0 && apt ? (
        <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex justify-between gap-3"><span>{shortDate(sel.checkIn)} → {shortDate(sel.checkOut)} · {sel.nights} nuit{sel.nights > 1 ? "s" : ""}</span><span className="whitespace-nowrap font-bold">{formatXOF(total)}</span></div>
          <div className="flex justify-between gap-3 text-slate-600"><span>À payer après l’accord de l’hôte</span><span className="whitespace-nowrap font-bold text-ink">{formatXOF(deposit)}</span></div>
          <p className="pt-1 text-xs text-slate-600">Wave · Orange Money · MTN MoMo · Moov Money</p>
        </div>
      ) : null}<label className="block text-sm font-semibold text-ink">Voyageurs{persons("input mt-1")}</label>{contactFields}{footer}</>} />;
  } else {
    content = (
      <>
        {priceLine}
        {apartmentSelect}
        <div className="overflow-hidden rounded-xl border border-slate-400">
          <button type="button" onClick={() => setCalendarOpen((o) => !o)} className="grid w-full grid-cols-2 text-left" aria-expanded={calendarOpen}>
            <span className="border-r border-slate-400 px-3 py-2.5">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-ink">Arrivée</span>
              <span className={"block text-sm " + (sel.checkIn ? "text-ink" : "text-slate-500")}>{shortDate(sel.checkIn) ?? "Ajouter une date"}</span>
            </span>
            <span className="px-3 py-2.5">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-ink">Départ</span>
              <span className={"block text-sm " + (sel.checkOut ? "text-ink" : "text-slate-500")}>{shortDate(sel.checkOut) ?? "Ajouter une date"}</span>
            </span>
          </button>
          <label className="flex items-center justify-between gap-3 border-t border-slate-400 px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink">Voyageurs</span>
            {persons("w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm")}
          </label>
        </div>
        {calendar(occ, aptId)}
        {unavailable}
        {contactFields}
        {footer}
        {breakdown}
      </>
    );
  }

  return (
    <form action={action} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="apartmentId" value={aptId} />
      <input type="hidden" name="checkIn" value={sel.checkIn ?? ""} />
      <input type="hidden" name="checkOut" value={sel.checkOut ?? ""} />
      {content}
    </form>
  );
}

const QUICK_NIGHTS = [1, 2, 3, 7];

/** Modèle C : nombre de nuits en un clic et prochains jours d'arrivée sous les yeux. */
function Express({ apt, occ, sel, setSel, calendar, calendarOpen, setCalendarOpen, head, tail }: {
  apt: BookableApt | undefined; occ: OccupiedRange[]; sel: CalendarSelection; setSel: (s: CalendarSelection) => void;
  calendar: (o: OccupiedRange[], k: string) => React.ReactNode; calendarOpen: boolean; setCalendarOpen: (o: boolean) => void;
  head: React.ReactNode; tail: React.ReactNode;
}) {
  const [nights, setNights] = useState(2);
  const days = useMemo(() => {
    const today = toISO(new Date());
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, []);
  const choose = (arrival: string, n: number) => setSel({ checkIn: arrival, checkOut: addDays(arrival, n), nights: n });
  return (
    <>
      {head}
      <div>
        <p className="mb-2 text-sm font-bold text-ink">1. Combien de nuits ?</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_NIGHTS.map((n) => (
            <button key={n} type="button" onClick={() => { setNights(n); setCalendarOpen(false); if (sel.checkIn) choose(sel.checkIn, n); }}
              className={"h-10 rounded-full px-3.5 text-sm font-semibold " + (!calendarOpen && nights === n ? "bg-accent-50 text-accent-700 ring-2 ring-accent-600" : "bg-white text-ink ring-1 ring-slate-300")}>
              {n === 7 ? "1 semaine" : `${n} nuit${n > 1 ? "s" : ""}`}
            </button>
          ))}
          <button type="button" onClick={() => { setCalendarOpen(true); setSel({ checkIn: null, checkOut: null, nights: 0 }); }}
            className={"h-10 rounded-full px-3.5 text-sm font-semibold " + (calendarOpen ? "bg-accent-50 text-accent-700 ring-2 ring-accent-600" : "bg-white text-ink ring-1 ring-slate-300")}>
            Autres dates
          </button>
        </div>
      </div>
      {calendarOpen ? calendar(occ, `x-${apt?.id}`) : (
        <div className="min-w-0">
          <p className="mb-2 text-sm font-bold text-ink">2. Votre arrivée</p>
          <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {days.map((d) => {
              const ok = rangeFree(occ, d, addDays(d, nights));
              const inStay = sel.checkIn && sel.checkOut && d >= sel.checkIn && d < sel.checkOut;
              const date = new Date(`${d}T00:00:00`);
              return (
                <button key={d} type="button" disabled={!ok} onClick={() => choose(d, nights)}
                  className={"flex w-14 shrink-0 snap-start flex-col items-center rounded-xl py-2 text-xs disabled:bg-slate-100 disabled:text-slate-400 " +
                    (d === sel.checkIn ? "bg-accent-600 text-white" : inStay ? "bg-accent-100 text-accent-700" : "bg-white text-ink ring-1 ring-slate-300")}>
                  <span>{WEEK[date.getDay()]}</span>
                  <span className="text-base font-bold">{date.getDate()}</span>
                  <span className="text-[10px]">{ok ? MONTH[date.getMonth()] : "pris"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {tail}
    </>
  );
}
