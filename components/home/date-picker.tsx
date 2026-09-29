"use client";

import { useState } from "react";

// Calendrier « façon Airbnb » : deux mois côte à côte (un seul sur téléphone),
// sélection d'une période (arrivée → départ) ou d'une seule date.

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseDay = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const shortDay = (s: string) => (s ? parseDay(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "");
export const nightsBetween = (a: string, b: string) => (a && b ? Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000) : 0);

function Month({ year, month, from, to, hover, onPick, onHover }: {
  year: number; month: number; from: string; to: string; hover: string;
  onPick: (d: string) => void; onHover: (d: string) => void;
}) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi en premier
  const count = new Date(year, month + 1, 0).getDate();
  const today = isoDay(new Date());
  const end = to || (from && hover > from ? hover : "");
  return (
    <div className="w-full">
      <p className="mb-3 text-center text-sm font-semibold capitalize text-ink">{MONTHS[month]} {year}</p>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
        {DAYS.map((d, i) => <span key={i} className="py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: offset }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: count }, (_, i) => {
          const d = isoDay(new Date(year, month, i + 1));
          const past = d < today;
          const edge = d === from || d === end;
          const inside = from && end && d > from && d < end;
          return (
            <div key={d} className={"py-0.5 " + (inside ? "bg-slate-100 " : "") + (d === from && end ? "rounded-l-full bg-slate-100 " : "") + (d === end && from ? "rounded-r-full bg-slate-100" : "")}>
              <button type="button" disabled={past} onClick={() => onPick(d)} onMouseEnter={() => onHover(d)}
                className={"mx-auto grid h-10 w-10 place-items-center rounded-full text-sm transition " +
                  (past ? "cursor-not-allowed text-slate-300 line-through" : edge ? "bg-ink font-semibold text-white" : "font-medium text-ink hover:ring-1 hover:ring-ink")}>
                {i + 1}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Période (range) ou date unique. */
export function DatePicker({ from, to = "", range = true, onChange }: {
  from: string; to?: string; range?: boolean; onChange: (from: string, to: string) => void;
}) {
  const start = from ? parseDay(from) : new Date();
  const [cursor, setCursor] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const [hover, setHover] = useState("");
  const now = new Date();
  const canPrev = cursor > new Date(now.getFullYear(), now.getMonth(), 1);
  const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);

  const pick = (d: string) => {
    if (!range) return onChange(d, "");
    if (!from || to || d <= from) return onChange(d, "");
    onChange(from, d);
  };
  const shift = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <div className="relative" onMouseLeave={() => setHover("")}>
      <button type="button" aria-label="Mois précédent" disabled={!canPrev} onClick={() => shift(-1)} className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100 disabled:opacity-25">‹</button>
      <button type="button" aria-label="Mois suivant" onClick={() => shift(1)} className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100">›</button>
      <div className="grid gap-8 sm:grid-cols-2">
        <Month year={cursor.getFullYear()} month={cursor.getMonth()} from={from} to={to} hover={hover} onPick={pick} onHover={setHover} />
        <div className="hidden sm:block">
          <Month year={next.getFullYear()} month={next.getMonth()} from={from} to={to} hover={hover} onPick={pick} onHover={setHover} />
        </div>
      </div>
    </div>
  );
}
