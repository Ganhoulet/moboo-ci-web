"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TRANSACTION_FILTERS, type Transaction } from "@/lib/property";
import { NearMe } from "./near-me";
import { SaveSearchButton } from "./save-search-button";

type Pop = "tx" | "price" | "beds" | "type" | null;

const RENT_PRICES = [50_000, 100_000, 150_000, 200_000, 300_000, 500_000, 1_000_000];
const SALE_PRICES = [5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000];
const BEDS = ["", "1", "2", "3", "4"];
const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("fr-FR")} M` : `${Math.round(n / 1000)} k`);

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/**
 * Barre de recherche de la page des annonces, façon Zillow : lieu, transaction, prix,
 * chambres, type de bien, « Autour de moi » et « Enregistrer la recherche » sur une ligne
 * (back-office → Recherche et résultats → Barre de recherche). Sur téléphone, les pastilles
 * défilent et chaque choix s'ouvre en volet en bas de l'écran.
 */
export function SearchPillsBar({
  types, active, q, priceMin, priceMax, propertyType, bedrooms, reservable, near, loggedIn, showNearMe,
}: {
  types: [string, string][];
  active: Transaction | "all";
  q: string;
  priceMin?: number;
  priceMax?: number;
  propertyType: string;
  bedrooms?: number;
  reservable: boolean;
  near?: { radius: number } | null;
  loggedIn: boolean;
  showNearMe: boolean;
}) {
  const router = useRouter();
  const [pop, setPop] = useState<Pop>(null);
  const [place, setPlace] = useState(q);
  const [min, setMin] = useState(priceMin ? String(priceMin) : "");
  const [max, setMax] = useState(priceMax ? String(priceMax) : "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPop(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setPop(null); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  /** Nouvelle recherche : on garde les autres critères, on revient à la page 1. */
  const go = (patch: Record<string, string | number | undefined | null>) => {
    const cur: Record<string, string | number | undefined | null> = {
      transaction: active !== "all" ? active : undefined, q: place.trim() || undefined, priceMin, priceMax,
      propertyType: propertyType || undefined, bedrooms, reservable: reservable ? "1" : undefined,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...cur, ...patch })) if (v !== undefined && v !== null && v !== "" && v !== 0) p.set(k, String(v));
    setPop(null);
    router.push(`/annonces${p.toString() ? `?${p}` : ""}`);
  };

  const txOptions = TRANSACTION_FILTERS.filter((t) => !reservable || t.key === "furnished" || t.key === "event");
  const txLabel = active === "all" ? "Louer ou acheter" : TRANSACTION_FILTERS.find((t) => t.key === active)?.label ?? "Transaction";
  const rentLike = active === "rent" || active === "furnished" || active === "event";
  const presets = active === "sale" ? SALE_PRICES : RENT_PRICES;
  const priceLabel = priceMin && priceMax ? `${short(priceMin)} – ${short(priceMax)}` : priceMin ? `${short(priceMin)} et +` : priceMax ? `Jusqu’à ${short(priceMax)}` : "Prix";
  const typeLabel = types.find(([v]) => v === propertyType)?.[1] ?? "Type de bien";
  const showBeds = !reservable && active !== "event";

  const pill = (on: boolean, open: boolean) =>
    "inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border-2 px-4 text-sm font-bold transition " +
    (on ? "border-brand-800 bg-brand-50 text-brand-900" : open ? "border-ink bg-white text-ink" : "border-slate-300 bg-white text-ink hover:border-slate-400");
  const panel = "fixed inset-x-0 bottom-0 z-[70] max-h-[75dvh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-full md:mt-2 md:w-80 md:rounded-2xl";
  const option = (on: boolean) => "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold " + (on ? "bg-brand-50 text-brand-900" : "text-ink hover:bg-slate-50");

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {/* Lieu */}
        <form onSubmit={(e) => { e.preventDefault(); go({ q: place.trim() || undefined }); }}
          className="flex h-11 min-w-0 flex-1 items-center rounded-xl border-2 border-slate-300 bg-white pl-4 pr-1 focus-within:border-brand-800 md:max-w-sm">
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Commune, quartier, ville…" aria-label="Lieu"
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-slate-400" />
          {place ? (
            <button type="button" aria-label="Effacer le lieu" onClick={() => { setPlace(""); go({ q: undefined }); }} className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs text-white">✕</button>
          ) : null}
          <button type="submit" aria-label="Rechercher" className="grid h-9 w-9 place-items-center text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          </button>
        </form>

        {/* Pastilles : défilent sur téléphone */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          <div className="relative">
            <button type="button" className={pill(active !== "all", pop === "tx")} aria-expanded={pop === "tx"} onClick={() => setPop(pop === "tx" ? null : "tx")}>{txLabel} <Chevron /></button>
            {pop === "tx" ? (
              <div className={panel} role="dialog" aria-label="Transaction">
                {txOptions.map((t) => (
                  <button key={t.key} type="button" className={option(active === t.key)}
                    onClick={() => go({ transaction: t.key === "all" ? undefined : t.key, ...(t.key === "furnished" || t.key === "event" ? {} : { reservable: undefined }) })}>
                    {t.label}{active === t.key ? <span aria-hidden="true">✓</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button type="button" className={pill(!!(priceMin || priceMax), pop === "price")} aria-expanded={pop === "price"} onClick={() => setPop(pop === "price" ? null : "price")}>{priceLabel} <Chevron /></button>
            {pop === "price" ? (
              <div className={panel} role="dialog" aria-label="Prix">
                <p className="mb-2 text-sm font-bold text-ink">{rentLike ? "Loyer" : active === "sale" ? "Prix de vente" : "Prix"} (FCFA)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Minimum" aria-label="Prix minimum" className="input" />
                  <input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Maximum" aria-label="Prix maximum" className="input" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {presets.map((v) => (
                    <button key={v} type="button" onClick={() => setMax(String(v))}
                      className={"rounded-full px-3 py-1 text-xs font-semibold ring-1 " + (Number(max) === v ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-slate-300 hover:bg-slate-50")}>
                      ≤ {short(v)}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => { setMin(""); setMax(""); go({ priceMin: undefined, priceMax: undefined }); }} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-muted ring-1 ring-slate-300">Effacer</button>
                  <button type="button" onClick={() => go({ priceMin: Number(min) || undefined, priceMax: Number(max) || undefined })} className="flex-1 rounded-xl bg-brand-800 py-2.5 text-sm font-bold text-white">Appliquer</button>
                </div>
              </div>
            ) : null}
          </div>

          {showBeds ? (
            <div className="relative">
              <button type="button" className={pill(!!bedrooms, pop === "beds")} aria-expanded={pop === "beds"} onClick={() => setPop(pop === "beds" ? null : "beds")}>
                {bedrooms ? `${bedrooms}${bedrooms >= 4 ? "+" : ""} chambre${bedrooms > 1 ? "s" : ""}` : "Chambres"} <Chevron />
              </button>
              {pop === "beds" ? (
                <div className={panel} role="dialog" aria-label="Chambres">
                  <p className="mb-2 text-sm font-bold text-ink">Nombre de chambres</p>
                  <div className="grid grid-cols-5 overflow-hidden rounded-xl ring-1 ring-slate-300">
                    {BEDS.map((b) => (
                      <button key={b || "tous"} type="button" onClick={() => go({ bedrooms: b ? Number(b) : undefined })}
                        className={"border-l border-slate-200 py-2.5 text-sm font-bold first:border-l-0 " + (String(bedrooms ?? "") === b ? "bg-brand-800 text-white" : "bg-white text-ink hover:bg-slate-50")}>
                        {b ? `${b}${b === "4" ? "+" : ""}` : "Tous"}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {!reservable ? (
            <div className="relative">
              <button type="button" className={pill(!!propertyType, pop === "type")} aria-expanded={pop === "type"} onClick={() => setPop(pop === "type" ? null : "type")}>{typeLabel} <Chevron /></button>
              {pop === "type" ? (
                <div className={panel} role="dialog" aria-label="Type de bien">
                  <button type="button" className={option(!propertyType)} onClick={() => go({ propertyType: undefined })}>Tous les types{!propertyType ? <span aria-hidden="true">✓</span> : null}</button>
                  {types.map(([v, l]) => (
                    <button key={v} type="button" className={option(propertyType === v)} onClick={() => go({ propertyType: v })}>{l}{propertyType === v ? <span aria-hidden="true">✓</span> : null}</button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {showNearMe && !near ? <div className="flex shrink-0 items-center"><NearMe active={false} radius={3} /></div> : null}

          <div className="md:ml-auto">
            <SaveSearchButton variant="primary" loggedIn={loggedIn}
              params={{ transaction: active !== "all" ? active : undefined, q: q || undefined, propertyType: propertyType || undefined, priceMin, priceMax }} />
          </div>
        </div>
      </div>
      {near ? <NearMe active radius={near.radius} /> : null}
      {pop ? <div className="fixed inset-0 z-[60] bg-black/30 md:hidden" aria-hidden="true" onClick={() => setPop(null)} /> : null}
    </div>
  );
}
