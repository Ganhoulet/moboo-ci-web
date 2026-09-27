"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/favorites";
import { PropertyCard } from "@/components/property-card";

export default function FavorisPage() {
  const items = useFavorites();

  return (
    <div className="container-page py-8 sm:py-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
          Mes favoris
        </h1>
        <p className="text-sm text-muted">
          {items.length} bien(s) enregistré(s) sur cet appareil
        </p>
      </div>

      {items.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-50 text-accent-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M12 20.5s-7-4.6-9.2-9.1C1.3 8 3 4.5 6.3 4.5c2 0 3.4 1.2 4.2 2.5.8-1.3 2.2-2.5 4.2-2.5 3.3 0 5 3.5 3.5 6.9C19 15.9 12 20.5 12 20.5Z"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-ink">Aucun favori pour l'instant</h3>
          <p className="mt-1 text-sm text-muted">
            Touchez le cœur sur une annonce pour la retrouver ici.
          </p>
          <Link href="/annonces" className="btn-primary mt-5 bg-accent-600 hover:bg-accent-700">
            Parcourir les annonces
          </Link>
        </div>
      )}
    </div>
  );
}
