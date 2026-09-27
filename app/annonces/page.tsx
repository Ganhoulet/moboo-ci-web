import type { Metadata } from "next";
import Link from "next/link";
import { listProperties, type Transaction } from "@/lib/property";
import { PropertyCard } from "@/components/property-card";
import { FilterBar } from "@/components/filter-bar";

export const metadata: Metadata = {
  title: "Annonces",
  description: "Tous les biens Moboo.ci : à louer, à vendre, meublés et espaces événementiels.",
};

export const revalidate = 60;

export default async function AnnoncesPage({
  searchParams,
}: {
  searchParams: {
    transaction?: string;
    q?: string;
    reservable?: string;
    priceMin?: string;
    priceMax?: string;
    propertyType?: string;
  };
}) {
  const reservable = searchParams.reservable === "1";
  const active = (reservable ? "all" : (searchParams.transaction as Transaction | "all")) ?? "all";
  const q = (searchParams.q ?? "").trim();
  const priceMin = Number(searchParams.priceMin) > 0 ? Number(searchParams.priceMin) : undefined;
  const priceMax = Number(searchParams.priceMax) > 0 ? Number(searchParams.priceMax) : undefined;
  const propertyType = (searchParams.propertyType ?? "").trim();

  const base = await listProperties({ transaction: active, reservable });
  let items = base;
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter((p) => `${p.title} ${p.zone}`.toLowerCase().includes(needle));
  }
  if (priceMin != null) items = items.filter((p) => p.price != null && p.price >= priceMin);
  if (priceMax != null) items = items.filter((p) => p.price != null && p.price <= priceMax);
  if (propertyType) items = items.filter((p) => p.propertyType === propertyType);

  const hasFilters = !!(q || priceMin || priceMax || propertyType || active !== "all");

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {reservable ? "Biens réservables" : "Annonces"}
          </h1>
          <p className="text-sm text-muted">
            {items.length} bien(s){q ? ` · « ${q} »` : ""}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <FilterBar
          active={active}
          q={q}
          priceMin={priceMin}
          priceMax={priceMax}
          propertyType={propertyType}
          reservable={reservable}
        />
      </div>

      {items.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h3 className="font-semibold text-ink">Aucun bien pour ces critères</h3>
          <p className="mt-1 text-sm text-muted">
            {hasFilters
              ? "Élargissez votre recherche ou réinitialisez les filtres."
              : "De nouvelles annonces sont publiées régulièrement — revenez bientôt."}
          </p>
          <Link href="/annonces" className="btn-ghost mt-5">
            Réinitialiser les filtres
          </Link>
        </div>
      )}
    </div>
  );
}
