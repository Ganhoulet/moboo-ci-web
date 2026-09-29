import type { Metadata } from "next";
import Link from "next/link";
import {
  listListingsPage,
  residencesPage,
  espacesPage,
  type Transaction,
  type Property,
} from "@/lib/property";
import { ResultsView } from "@/components/results-view";
import { SortSelect } from "@/components/sort-select";
import { SORTS } from "@/lib/sorts";
import { FilterBar } from "@/components/filter-bar";
import { Pagination } from "@/components/pagination";
import { SaveSearchButton } from "@/components/save-search-button";
import { getSession } from "@/lib/session";
import { getSiteSettings } from "@/lib/settings";
import { getTaxonomies } from "@/lib/taxonomies";

export const metadata: Metadata = {
  title: "Annonces",
  description: "Tous les biens Moboo.ci : à louer, à vendre, meublés et espaces événementiels.",
};

export const dynamic = "force-dynamic";


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
    page?: string;
    sort?: string;
  };
}) {
  // Back-office → Recherche et résultats : nombre par page, présentation, demi-carte, ordre.
  const settings = await getSiteSettings();
  const cfg = settings.search;
  const PER_PAGE = cfg.perPage;
  const sort = SORTS.some(([k]) => k === searchParams.sort) ? searchParams.sort! : cfg.defaultOrder;
  const reservable = searchParams.reservable === "1";
  const active = (reservable ? "all" : (searchParams.transaction as Transaction | "all")) ?? "all";
  const q = (searchParams.q ?? "").trim();
  const priceMin = Number(searchParams.priceMin) > 0 ? Number(searchParams.priceMin) : undefined;
  const priceMax = Number(searchParams.priceMax) > 0 ? Number(searchParams.priceMax) : undefined;
  const propertyType = (searchParams.propertyType ?? "").trim();
  const page = Math.max(1, Number(searchParams.page) || 1);

  const isReservableTab = active === "furnished" || active === "event";

  let items: Property[] = [];
  let total = 0;

  if (isReservableTab) {
    // Meublés / espaces = l'inventaire réservable publié depuis Moboo Resi /
    // Moboo Event (feuille de route §4 : Moboo.ci n'en est que la vitrine).
    const res = active === "furnished"
      ? await residencesPage({ q, page, perPage: PER_PAGE })
      : await espacesPage({ q, page, perPage: PER_PAGE });
    items = res.items;
    total = res.total;
  } else {
    // Tout / à louer / à vendre → pagination + filtres serveur (des milliers de biens).
    const tx = active === "rent" || active === "sale" ? active : undefined;
    const res = await listListingsPage({ transaction: tx, q, priceMin, priceMax, propertyType, page, perPage: PER_PAGE, sort });
    items = res.items;
    total = res.total;
  }
  // Demi-carte : biens localisés des mêmes filtres (annonces à louer / à vendre).
  const halfMap = cfg.resultsView === "halfmap" && !isReservableTab;
  const tx2 = active === "rent" || active === "sale" ? active : undefined;
  const mapItems = halfMap
    ? (await listListingsPage({ transaction: tx2, q, priceMin, priceMax, propertyType, perPage: cfg.mapInitialCount, sort, map: true, listingKind: "classic" })).items
    : [];
  const query = new URLSearchParams(Object.entries({ transaction: tx2, q: q || undefined, priceMin: priceMin ? String(priceMin) : undefined, priceMax: priceMax ? String(priceMax) : undefined, propertyType: propertyType || undefined, sort })
    .filter(([, v]) => v) as [string, string][]).toString();

  const hasFilters = !!(q || priceMin || priceMax || propertyType || active !== "all");
  const loggedIn = !!getSession();
  const searchCriteria = {
    transaction: active !== "all" ? active : undefined,
    q: q || undefined,
    propertyType: propertyType || undefined,
    priceMin,
    priceMax,
  };
  const rangeFrom = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangeTo = Math.min(rangeFrom - 1 + items.length, total);

  return (
    <div className={(halfMap ? "mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8" : "container-page") + " py-8 sm:py-10"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
          {reservable ? "Biens réservables" : "Annonces"}
        </h1>
        <p className="text-sm text-muted">
          {total.toLocaleString("fr-FR")} bien(s)
          {total > PER_PAGE ? ` · ${rangeFrom}–${rangeTo} affichés` : ""}
          {q ? ` · « ${q} »` : ""}
        </p>
        </div>
        {!isReservableTab ? <SortSelect value={sort} /> : null}
      </div>

      <div className="mt-5">
        <FilterBar
          types={(await getTaxonomies()).type.map((t) => [t.slug, t.label] as [string, string])}
          active={active}
          q={q}
          priceMin={priceMin}
          priceMax={priceMax}
          propertyType={propertyType}
          reservable={reservable}
        />
      </div>

      {hasFilters ? (
        <div className="mt-4">
          <SaveSearchButton params={searchCriteria} loggedIn={loggedIn} />
        </div>
      ) : null}

      {items.length > 0 ? (
        <>
          <ResultsView items={items} layout={cfg.resultsLayout} halfMap={halfMap} mapSettings={settings.maps} mapItems={mapItems} autoLoad={cfg.mapAutoLoad} query={query} />
          <Pagination
            page={page}
            perPage={PER_PAGE}
            total={total}
            params={{
              transaction: active !== "all" ? active : undefined,
              q: q || undefined,
              priceMin: priceMin ? String(priceMin) : undefined,
              priceMax: priceMax ? String(priceMax) : undefined,
              propertyType: propertyType || undefined,
              sort: searchParams.sort || undefined,
            }}
          />
        </>
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
