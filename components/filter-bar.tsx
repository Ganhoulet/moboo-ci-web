import Link from "next/link";
import { TRANSACTION_FILTERS, type Transaction } from "@/lib/property";

const DEFAULT_TYPES: [string, string][] = [
  ["appartement", "Appartement"], ["maison", "Maison"], ["villa", "Villa"], ["studio", "Studio"],
  ["terrain", "Terrain"], ["bureau", "Bureau"], ["magasin", "Magasin"],
];

export interface FilterState {
  /** Types de bien (back-office → Immobilier → Types de bien). */
  types?: [string, string][];
  active: Transaction | "all";
  q: string;
  priceMin?: number;
  priceMax?: number;
  propertyType: string;
  reservable: boolean;
}

export function FilterBar(f: FilterState) {
  const hrefForTransaction = (key: Transaction | "all") => {
    const p = new URLSearchParams();
    if (key !== "all") p.set("transaction", key);
    if (f.q) p.set("q", f.q);
    if (f.priceMin) p.set("priceMin", String(f.priceMin));
    if (f.priceMax) p.set("priceMax", String(f.priceMax));
    if (f.propertyType) p.set("propertyType", f.propertyType);
    return `/annonces${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-4">
      {!f.reservable && (
        <div className="flex flex-wrap gap-2">
          {TRANSACTION_FILTERS.map((t) => {
            const isActive = f.active === t.key;
            return (
              <Link
                key={t.key}
                href={hrefForTransaction(t.key)}
                className={
                  "rounded-full px-4 py-2 text-sm font-semibold transition " +
                  (isActive
                    ? "bg-brand-800 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      )}

      <form
        method="get"
        action="/annonces"
        className="grid gap-3 rounded-2xl bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
      >
        {!f.reservable && f.active !== "all" ? (
          <input type="hidden" name="transaction" value={f.active} />
        ) : null}
        {f.reservable ? <input type="hidden" name="reservable" value="1" /> : null}

        <input name="q" defaultValue={f.q} placeholder="Ville, quartier…" className="input" aria-label="Lieu" />
        <input
          name="priceMin"
          type="number"
          min={0}
          defaultValue={f.priceMin ?? ""}
          placeholder="Prix min"
          className="input"
          aria-label="Prix minimum"
        />
        <input
          name="priceMax"
          type="number"
          min={0}
          defaultValue={f.priceMax ?? ""}
          placeholder="Prix max"
          className="input"
          aria-label="Prix maximum"
        />
        <select name="propertyType" defaultValue={f.propertyType} className="input" aria-label="Type de bien">
          {[["", "Tous types"] as [string, string], ...(f.types?.length ? f.types : DEFAULT_TYPES)].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary bg-accent-600 hover:bg-accent-700">
          Filtrer
        </button>
      </form>
    </div>
  );
}
