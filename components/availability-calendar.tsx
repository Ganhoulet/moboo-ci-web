"use client";

import { useMemo, useState } from "react";
import type { OccupiedRange } from "@/lib/api";

const WD = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface CalendarSelection {
  checkIn: string | null;
  checkOut: string | null;
  nights: number;
}

/**
 * Calendrier de disponibilité (façon Airbnb) : sélection d'une plage de dates,
 * dates passées et réservées désactivées. Remonte la sélection via onChange.
 */
export function AvailabilityCalendar({
  occupied,
  onChange,
}: {
  occupied: OccupiedRange[];
  onChange?: (sel: CalendarSelection) => void;
}) {
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);

  const isOccupied = (iso: string) => occupied.some((r) => iso >= r.from && iso < r.to);

  // Une plage est valide si aucune nuit occupée entre in (inclus) et out (exclu).
  const rangeHasOccupied = (a: string, b: string) => {
    const d = new Date(a); const end = new Date(b);
    while (d < end) {
      if (isOccupied(toISO(d))) return true;
      d.setDate(d.getDate() + 1);
    }
    return false;
  };

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0;

  const emit = (ci: string | null, co: string | null) => {
    const n = ci && co ? Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000) : 0;
    onChange?.({ checkIn: ci, checkOut: co, nights: n });
  };

  const pick = (iso: string) => {
    if (!checkIn || checkOut) {
      setCheckIn(iso); setCheckOut(null); emit(iso, null);
    } else if (iso <= checkIn) {
      setCheckIn(iso); emit(iso, null);
    } else if (rangeHasOccupied(checkIn, iso)) {
      // plage traverse une date occupée → on repart de cette date
      setCheckIn(iso); setCheckOut(null); emit(iso, null);
    } else {
      setCheckOut(iso); emit(checkIn, iso);
    }
  };

  // Construit la grille du mois courant
  const y = view.getFullYear(); const m = view.getMonth();
  const first = new Date(y, m, 1);
  const startWd = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));

  const canPrev = view > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setView(new Date(y, m - 1, 1))}
          className="grid h-8 w-8 place-items-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          aria-label="Mois précédent"
        >‹</button>
        <span className="font-display font-bold text-ink">{MONTHS[m]} {y}</span>
        <button
          type="button"
          onClick={() => setView(new Date(y, m + 1, 1))}
          className="grid h-8 w-8 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
          aria-label="Mois suivant"
        >›</button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted">
        {WD.map((w, i) => <div key={i} className="py-1">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const past = d < today;
          const occ = isOccupied(iso);
          const disabled = past || occ;
          const isIn = iso === checkIn;
          const isOut = iso === checkOut;
          const inRange = checkIn && checkOut && iso > checkIn && iso < checkOut;
          const selected = isIn || isOut;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => pick(iso)}
              className={
                "aspect-square rounded-lg text-sm transition " +
                (selected
                  ? "bg-accent-600 font-bold text-white"
                  : inRange
                  ? "bg-accent-100 text-accent-800"
                  : disabled
                  ? "text-slate-300 line-through"
                  : "text-ink hover:bg-slate-100")
              }
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-sm text-muted">
        {checkIn && checkOut
          ? `${nights} nuit(s) sélectionnée(s)`
          : checkIn
          ? "Choisissez la date de départ"
          : "Choisissez la date d'arrivée"}
      </p>
    </div>
  );
}
