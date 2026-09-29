"use client";

import { usePathname } from "next/navigation";

/** Pages qui ont déjà leur propre recherche, ou qui n'en ont pas besoin. */
const HIDDEN = [/^\/$/, /^\/annonces/, /^\/admin/, /^\/mon-espace/, /^\/compte/, /^\/inscription/, /^\/publier/, /^\/agent/, /\/imprimer$/];
const DETAILS = [/^\/annonce\//, /^\/residence\//, /^\/espace\//];

/**
 * Barre de recherche sous l'en-tête (back-office → Recherche et résultats) :
 * « simple » = mot-clé + type ; « filters » = + type de bien et budget.
 * Envoie vers /annonces avec les mêmes paramètres que les filtres de la liste.
 */
export function SearchStrip({ variant, pages }: { variant: "simple" | "filters"; pages: "details" | "all" }) {
  const pathname = usePathname();
  if (HIDDEN.some((r) => r.test(pathname))) return null;
  if (pages === "details" && !DETAILS.some((r) => r.test(pathname))) return null;

  const field = "h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none";
  return (
    <div className="border-b border-slate-200 bg-slate-50 print:hidden">
      <form action="/annonces" className="container-page flex gap-2 py-3">
        <input name="q" placeholder="Ville, commune, quartier…" className={`${field} min-w-0 flex-1`} />
        <select name="transaction" defaultValue="rent" className={`${field} hidden w-36 sm:block`} aria-label="Je cherche à">
          <option value="rent">Louer</option>
          <option value="sale">Acheter</option>
          <option value="furnished">Meublé</option>
          <option value="event">Espace</option>
        </select>
        {variant === "filters" ? (
          <>
            <select name="propertyType" defaultValue="" className={`${field} hidden w-40 md:block`} aria-label="Type de bien">
              <option value="">Tous les biens</option>
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="villa">Villa</option>
              <option value="studio">Studio</option>
              <option value="terrain">Terrain</option>
              <option value="bureau">Bureau</option>
              <option value="magasin">Magasin</option>
            </select>
            <input name="priceMax" type="number" inputMode="numeric" min={0} step={5000} placeholder="Budget max (FCFA)" className={`${field} hidden w-44 md:block`} />
          </>
        ) : null}
        <button type="submit" className="h-11 shrink-0 rounded-lg bg-accent-600 px-4 text-sm font-semibold text-white hover:bg-accent-700 sm:px-5">Rechercher</button>
      </form>
    </div>
  );
}
