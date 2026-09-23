import type { Metadata } from "next";
import Link from "next/link";
import { listProperties, TRANSACTION_FILTERS, type Transaction } from "@/lib/property";
import { PropertyCard } from "@/components/property-card";

export const metadata: Metadata = {
  title: "Annonces",
  description: "Tous les biens Moboo.ci : à louer, à vendre, meublés et espaces événementiels.",
};

export const revalidate = 60;

export default async function AnnoncesPage({
  searchParams,
}: {
  searchParams: { transaction?: string; q?: string; reservable?: string };
}) {
  const reservable = searchParams.reservable === "1";
  const active = (reservable ? "all" : (searchParams.transaction as Transaction | "all")) ?? "all";
  const q = (searchParams.q ?? "").trim();

  const all = await listProperties({ transaction: active, reservable });
  const items = q
    ? all.filter((p) => (`${p.title} ${p.zone}`).toLowerCase().includes(q.toLowerCase()))
    : all;

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {reservable ? "Biens réservables" : "Annonces"}
          </h1>
          <p className="text-sm text-muted">
            {items.length} bien(s){q ? ` · « ${q} »` : ""}
          </p>
        </div>
      </div>

      {/* Filtres par transaction */}
      {!reservable && (
        <div className="mt-5 flex flex-wrap gap-2">
          {TRANSACTION_FILTERS.map((f) => {
            const isActive = active === f.key;
            const params = new URLSearchParams();
            if (f.key !== "all") params.set("transaction", f.key);
            if (q) params.set("q", q);
            const href = `/annonces${params.toString() ? `?${params}` : ""}`;
            return (
              <Link
                key={f.key}
                href={href}
                className={
                  "rounded-full px-4 py-2 text-sm font-semibold transition " +
                  (isActive
                    ? "bg-brand-800 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300")
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Grille */}
      {items.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h3 className="font-semibold text-ink">Aucun bien pour ce filtre</h3>
          <p className="mt-1 text-sm text-muted">
            Les annonces classiques (à louer / à vendre) arrivent avec la migration
            du catalogue. Les biens réservables (meublés & espaces) sont publiés
            depuis Moboo Resi & Event.
          </p>
          <Link href="/annonces" className="btn-ghost mt-5">
            Voir tout
          </Link>
        </div>
      )}
    </div>
  );
}
