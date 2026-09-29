"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker, isoDay, nightsBetween, parseDay, shortDay } from "./date-picker";

type Mode = "property" | "stay" | "event";
const TABS: Record<string, { label: string; params: Record<string, string>; mode: Mode }> = {
  rent: { label: "Louer", params: { transaction: "rent" }, mode: "property" },
  sale: { label: "Acheter", params: { transaction: "sale" }, mode: "property" },
  furnished: { label: "Meublés", params: { transaction: "furnished" }, mode: "stay" },
  event: { label: "Espaces", params: { transaction: "event" }, mode: "event" },
  land: { label: "Terrains", params: { propertyType: "terrain" }, mode: "property" },
  commercial: { label: "Bureaux & commerces", params: { propertyType: "bureau" }, mode: "property" },
};

const BUDGETS: Record<string, { label: string; values: number[] }> = {
  rent: { label: "Loyer max / mois", values: [50_000, 100_000, 200_000, 350_000, 500_000, 1_000_000] },
  sale: { label: "Prix max", values: [10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000] },
  land: { label: "Prix max", values: [5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000] },
  commercial: { label: "Loyer max / mois", values: [100_000, 250_000, 500_000, 1_000_000, 2_000_000] },
  furnished: { label: "Budget / nuit", values: [15_000, 25_000, 40_000, 60_000, 100_000] },
  event: { label: "Budget / jour", values: [100_000, 250_000, 500_000, 1_000_000, 2_000_000] },
};
const DURATIONS = [[1, "1 jour"], [2, "2 jours"], [3, "3 jours"], [7, "1 semaine"]] as const;
const fcfa = (n: number) => `${n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("fr-FR")} M` : n.toLocaleString("fr-FR")} FCFA`;

type Panel = "where" | "dates" | "guests" | "budget" | "duration" | null;

function Seg({ label, value, placeholder, active, onClick, className = "", onClear }: {
  label: string; value?: string; placeholder: string; active: boolean; onClick: () => void; className?: string; onClear?: () => void;
}) {
  return (
    <div className={"relative flex-1 " + className}>
      <button type="button" onClick={onClick}
        className={"w-full rounded-full px-5 py-2.5 text-left transition " + (active ? "bg-white shadow-lg ring-1 ring-black/5" : "hover:bg-slate-100")}>
        <span className="block text-[11px] font-bold uppercase tracking-wide text-ink">{label}</span>
        <span className={"block truncate text-sm " + (value ? "font-medium text-ink" : "text-slate-400")}>{value || placeholder}</span>
      </button>
      {value && onClear && active ? (
        <button type="button" aria-label="Effacer" onClick={onClear} className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-slate-200 text-xs text-slate-600 hover:bg-slate-300">✕</button>
      ) : null}
    </div>
  );
}

function Stepper({ label, sub, value, min = 0, max = 99, step = 1, onChange }: { label: string; sub?: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div><p className="font-semibold text-ink">{label}</p>{sub ? <p className="text-sm text-muted">{sub}</p> : null}</div>
      <div className="flex items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-lg leading-none text-slate-600 hover:border-ink disabled:opacity-30">−</button>
        <span className="w-8 text-center font-semibold tabular-nums">{value}</span>
        <button type="button" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-lg leading-none text-slate-600 hover:border-ink disabled:opacity-30">+</button>
      </div>
    </div>
  );
}

/**
 * Recherche hybride du bandeau : biens (où / type / budget), meublés (où /
 * arrivée / départ / voyageurs / budget par nuit) et espaces événementiels
 * (où / date / durée / invités / budget par jour) — seuls les biens libres
 * sur les dates choisies sont proposés.
 */
export function HeroSearch({ tabs, placeholder, types, places = [] }: {
  tabs: string[]; placeholder: string; types: { slug: string; label: string }[]; places?: string[];
}) {
  const router = useRouter();
  const list = tabs.filter((t) => TABS[t]);
  const [tab, setTab] = useState(list[0] ?? "rent");
  const [panel, setPanel] = useState<Panel>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [date, setDate] = useState("");
  const [days, setDays] = useState(1);
  const [invites, setInvites] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const mode = TABS[tab]?.mode ?? "property";

  useEffect(() => {
    if (!panel) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setPanel(null); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [panel]);

  const changeTab = (t: string) => { setTab(t); setBudget(0); setPanel(null); };
  const toggle = (p: Panel) => setPanel(panel === p ? null : p);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = new URLSearchParams(TABS[tab]?.params ?? {});
    if (q.trim()) p.set("q", q.trim());
    if (budget) p.set("priceMax", String(budget));
    if (mode === "property" && type && !TABS[tab].params.propertyType) p.set("propertyType", type);
    if (mode === "stay") {
      if (checkIn && checkOut) { p.set("checkIn", checkIn); p.set("checkOut", checkOut); }
      if (adults + children) p.set("guests", String(adults + children));
    }
    if (mode === "event") {
      if (date) { p.set("date", date); p.set("days", String(days)); }
      if (invites) p.set("guests", String(invites));
    }
    router.push(`/annonces?${p}`);
  };

  const nights = nightsBetween(checkIn, checkOut);
  const guestsLabel = adults + children ? `${adults + children} voyageur${adults + children > 1 ? "s" : ""}` : "";
  const suggestions = places.filter((p) => !q || p.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const b = BUDGETS[tab] ?? BUDGETS.rent;

  const whereSeg = (
    <div className="relative flex-[1.4]">
      <label className={"block cursor-text rounded-full px-5 py-2.5 transition " + (panel === "where" ? "bg-white shadow-lg ring-1 ring-black/5" : "hover:bg-slate-100")}>
        <span className="block text-[11px] font-bold uppercase tracking-wide text-ink">Où ?</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setPanel(places.length ? "where" : null)}
          placeholder={mode === "stay" ? "Commune, quartier…" : mode === "event" ? "Commune ou quartier" : placeholder}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400" />
      </label>
    </div>
  );

  return (
    <div ref={box} className="relative mx-auto w-full max-w-5xl [&_.absolute]:text-ink">
      <div className="mb-3 flex justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {list.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => changeTab(t)}
            className={"shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition " + (tab === t ? "bg-white text-ink shadow-md" : "text-white/90 hover:bg-white/15")}>
            {TABS[t].label}
          </button>
        ))}
      </div>

      <form onSubmit={submit}
        className={"flex flex-col gap-1 rounded-3xl p-2 shadow-2xl ring-1 ring-black/5 transition sm:flex-row sm:items-center sm:rounded-full " + (panel ? "bg-slate-100" : "bg-white")}>
        {whereSeg}
        {mode === "property" ? (
          <>
            {!TABS[tab].params.propertyType ? (
              <label className="flex-1 rounded-full px-5 py-2.5 transition hover:bg-slate-100 sm:border-l sm:border-slate-200">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-ink">Type de bien</span>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-transparent text-sm text-ink outline-none">
                  <option value="">Tous les biens</option>
                  {types.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
                </select>
              </label>
            ) : null}
            <Seg label={b.label} value={budget ? fcfa(budget) : ""} placeholder="Sans limite" active={panel === "budget"} onClick={() => toggle("budget")} onClear={() => setBudget(0)} />
          </>
        ) : mode === "stay" ? (
          <>
            <Seg label="Arrivée" value={shortDay(checkIn)} placeholder="Quand ?" active={panel === "dates" && !checkIn} onClick={() => toggle("dates")} />
            <Seg label="Départ" value={checkOut ? `${shortDay(checkOut)} · ${nights} nuit${nights > 1 ? "s" : ""}` : ""} placeholder="Quand ?" active={panel === "dates" && !!checkIn} onClick={() => toggle("dates")}
              onClear={() => { setCheckIn(""); setCheckOut(""); }} />
            <Seg label="Voyageurs" value={guestsLabel} placeholder="Combien ?" active={panel === "guests"} onClick={() => toggle("guests")} onClear={() => { setAdults(0); setChildren(0); }} />
            <Seg label={b.label} value={budget ? fcfa(budget) : ""} placeholder="Tous prix" active={panel === "budget"} onClick={() => toggle("budget")} onClear={() => setBudget(0)} />
          </>
        ) : (
          <>
            <Seg label="Date" value={date ? parseDay(date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : ""} placeholder="Quel jour ?" active={panel === "dates"} onClick={() => toggle("dates")} onClear={() => setDate("")} />
            <Seg label="Durée" value={DURATIONS.find(([n]) => n === days)?.[1] ?? `${days} jours`} placeholder="1 jour" active={panel === "duration"} onClick={() => toggle("duration")} />
            <Seg label="Invités" value={invites ? `${invites} personnes` : ""} placeholder="Combien ?" active={panel === "guests"} onClick={() => toggle("guests")} onClear={() => setInvites(0)} />
            <Seg label={b.label} value={budget ? fcfa(budget) : ""} placeholder="Tous prix" active={panel === "budget"} onClick={() => toggle("budget")} onClear={() => setBudget(0)} />
          </>
        )}
        <button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-accent-600 px-6 py-3.5 font-semibold text-white transition hover:bg-accent-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          <span className="sm:hidden lg:inline">{mode === "property" ? "Rechercher" : "Disponibilités"}</span>
        </button>
      </form>

      {/* Panneaux (sous la barre) */}
      {panel === "where" && suggestions.length ? (
        <div className="absolute left-0 top-full z-30 mt-3 w-full max-w-sm rounded-3xl bg-white p-3 text-left shadow-2xl ring-1 ring-black/5">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold text-muted">Destinations populaires</p>
          {suggestions.map((p) => (
            <button key={p} type="button" onClick={() => { setQ(p); setPanel(mode === "property" ? null : mode === "stay" ? "dates" : "dates"); }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-slate-50">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100">📍</span>
              <span className="text-sm font-medium text-ink">{p}</span>
            </button>
          ))}
        </div>
      ) : null}

      {panel === "dates" ? (
        <div className="absolute left-1/2 top-full z-30 mt-3 w-full max-w-3xl -translate-x-1/2 rounded-3xl bg-white p-6 text-left shadow-2xl ring-1 ring-black/5">
          {mode === "stay" ? (
            <>
              <p className="mb-4 text-center text-sm font-semibold text-ink">
                {checkIn && checkOut ? `${nights} nuit${nights > 1 ? "s" : ""} · du ${shortDay(checkIn)} au ${shortDay(checkOut)}` : checkIn ? "Choisissez la date de départ" : "Choisissez la date d’arrivée"}
              </p>
              <DatePicker from={checkIn} to={checkOut} onChange={(a, z) => { setCheckIn(a); setCheckOut(z); if (a && z) setPanel("guests"); }} />
            </>
          ) : (
            <>
              <p className="mb-4 text-center text-sm font-semibold text-ink">Date de votre événement</p>
              <DatePicker from={date} range={false} onChange={(a) => { setDate(a); setPanel("duration"); }} />
            </>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap gap-2">
              {(mode === "stay"
                ? [["Ce week-end", 0], ["Dans 7 jours", 7], ["Dans 1 mois", 30]] as const
                : [["Samedi prochain", 0], ["Dans 2 semaines", 14], ["Dans 1 mois", 30]] as const).map(([label, off]) => (
                <button key={label} type="button" onClick={() => {
                  const d = new Date();
                  if (off === 0) d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7) - (mode === "stay" ? 1 : 0));
                  else d.setDate(d.getDate() + off);
                  if (mode === "stay") { const e = new Date(d); e.setDate(e.getDate() + 2); setCheckIn(isoDay(d)); setCheckOut(isoDay(e)); }
                  else setDate(isoDay(d));
                }} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink">{label}</button>
              ))}
            </div>
            <button type="button" onClick={() => { setCheckIn(""); setCheckOut(""); setDate(""); }} className="text-sm font-semibold text-ink underline">Effacer les dates</button>
          </div>
        </div>
      ) : null}

      {panel === "guests" ? (
        <div className="absolute right-0 top-full z-30 mt-3 w-full max-w-sm rounded-3xl bg-white p-6 text-left shadow-2xl ring-1 ring-black/5">
          {mode === "stay" ? (
            <div className="divide-y divide-slate-100">
              <Stepper label="Adultes" sub="13 ans et plus" value={adults} onChange={setAdults} max={16} />
              <Stepper label="Enfants" sub="De 2 à 12 ans" value={children} onChange={(v) => { setChildren(v); if (v && !adults) setAdults(1); }} max={10} />
            </div>
          ) : (
            <>
              <Stepper label="Invités" sub="Capacité minimale de l’espace" value={invites} step={10} max={5000} onChange={setInvites} />
              <div className="mt-2 flex flex-wrap gap-2">
                {[50, 100, 200, 300, 500, 1000].map((n) => (
                  <button key={n} type="button" onClick={() => setInvites(n)} className={"rounded-full border px-3 py-1.5 text-xs font-semibold " + (invites === n ? "border-ink bg-ink text-white" : "border-slate-300 hover:border-ink")}>{n}</button>
                ))}
              </div>
            </>
          )}
          <button type="button" onClick={() => setPanel("budget")} className="mt-4 w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-white">Suivant : budget</button>
        </div>
      ) : null}

      {panel === "duration" ? (
        <div className="absolute left-1/2 top-full z-30 mt-3 w-full max-w-md -translate-x-1/2 rounded-3xl bg-white p-6 text-left shadow-2xl ring-1 ring-black/5">
          <p className="mb-3 font-semibold text-ink">Combien de temps ?</p>
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map(([n, label]) => (
              <button key={n} type="button" onClick={() => { setDays(n); setPanel("guests"); }}
                className={"rounded-2xl border px-4 py-3 text-sm font-semibold transition " + (days === n ? "border-ink bg-ink text-white" : "border-slate-200 hover:border-ink")}>{label}</button>
            ))}
          </div>
        </div>
      ) : null}

      {panel === "budget" ? (
        <div className="absolute right-0 top-full z-30 mt-3 w-full max-w-sm rounded-3xl bg-white p-6 text-left shadow-2xl ring-1 ring-black/5">
          <p className="mb-3 font-semibold text-ink">{b.label}</p>
          <div className="grid grid-cols-2 gap-2">
            {[0, ...b.values].map((n) => (
              <button key={n} type="button" onClick={() => { setBudget(n); setPanel(null); }}
                className={"rounded-2xl border px-3 py-2.5 text-sm font-semibold transition " + (budget === n ? "border-ink bg-ink text-white" : "border-slate-200 hover:border-ink")}>
                {n ? `≤ ${fcfa(n)}` : "Sans limite"}
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-muted">Ou un montant précis (FCFA)</span>
            <input type="number" min={0} step={1000} value={budget || ""} onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))} className="input text-sm" />
          </label>
          <button type="button" onClick={() => submit()} className="mt-4 w-full rounded-full bg-accent-600 py-2.5 text-sm font-semibold text-white hover:bg-accent-700">
            {mode === "property" ? "Rechercher" : "Voir les disponibilités"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
