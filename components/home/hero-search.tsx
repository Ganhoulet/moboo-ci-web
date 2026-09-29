"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TABS: Record<string, { label: string; params: Record<string, string> }> = {
  rent: { label: "Louer", params: { transaction: "rent" } },
  sale: { label: "Acheter", params: { transaction: "sale" } },
  furnished: { label: "Meublés", params: { transaction: "furnished" } },
  event: { label: "Espaces", params: { transaction: "event" } },
  land: { label: "Terrains", params: { propertyType: "terrain" } },
  commercial: { label: "Bureaux & commerces", params: { propertyType: "bureau" } },
};

/** Recherche à onglets du bandeau (style Airbnb : grande barre arrondie). */
export function HeroSearch({ tabs, placeholder, types }: { tabs: string[]; placeholder: string; types: { slug: string; label: string }[] }) {
  const router = useRouter();
  const list = tabs.filter((t) => TABS[t]);
  const [tab, setTab] = useState(list[0] ?? "rent");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const withType = !TABS[tab]?.params.propertyType && tab !== "furnished" && tab !== "event";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams(TABS[tab]?.params ?? {});
    if (q.trim()) p.set("q", q.trim());
    if (withType && type) p.set("propertyType", type);
    if (budget) p.set("priceMax", budget);
    router.push(`/annonces?${p}`);
  };
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-3 flex justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {list.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={"shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition " + (tab === t ? "bg-white text-ink shadow-md" : "text-white/90 hover:bg-white/15")}>
            {TABS[t].label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-1 rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-black/5 sm:flex-row sm:items-center sm:rounded-full">
        <label className="flex-1 rounded-full px-5 py-2.5 transition hover:bg-slate-50">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-ink">Où ?</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400" />
        </label>
        {withType ? (
          <label className="rounded-full px-5 py-2.5 transition hover:bg-slate-50 sm:w-48 sm:border-l sm:border-slate-200">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-ink">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-transparent text-sm text-ink outline-none">
              <option value="">Tous les biens</option>
              {types.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
            </select>
          </label>
        ) : null}
        <label className="rounded-full px-5 py-2.5 transition hover:bg-slate-50 sm:w-44 sm:border-l sm:border-slate-200">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-ink">Budget max</span>
          <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-transparent text-sm text-ink outline-none">
            <option value="">Sans limite</option>
            {(tab === "sale" || tab === "land" ? [10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000] : [50_000, 100_000, 200_000, 350_000, 500_000, 1_000_000])
              .map((n) => <option key={n} value={n}>{n.toLocaleString("fr-FR")} FCFA</option>)}
          </select>
        </label>
        <button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-accent-600 px-6 py-3.5 font-semibold text-white transition hover:bg-accent-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          <span className="sm:hidden lg:inline">Rechercher</span>
        </button>
      </form>
    </div>
  );
}
