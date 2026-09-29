"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Property } from "@/lib/property";
import type { MapSettings } from "@/lib/settings";
import { PropertyCard } from "./property-card";
import { PropertyRow } from "./property-row";
import { SiteMap, type Bbox } from "./site-map";
import { toMarker, type MapMarker } from "@/lib/map-markers";

/**
 * Résultats de recherche : grille ou liste, et, en « demi-carte », la carte des
 * biens à droite (survol d'une annonce = marqueur mis en avant ; déplacer la
 * carte charge les biens de la zone si le réglage est actif).
 */
export function ResultsView({
  items, layout, halfMap, mapSettings, mapItems, autoLoad, query,
}: {
  items: Property[];
  layout: "grid" | "list";
  halfMap: boolean;
  mapSettings: MapSettings;
  mapItems: Property[];
  autoLoad: boolean;
  /** Filtres courants (chargement par zone). */
  query: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const initial = useMemo(() => [...items, ...mapItems].map(toMarker).filter(Boolean) as MapMarker[], [items, mapItems]);
  const [markers, setMarkers] = useState<MapMarker[]>(() => dedupe(initial));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  const onBounds = useCallback((b: Bbox) => {
    if (!autoLoad) return;
    if (first.current) { first.current = false; return; } // cadrage initial
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/map-listings?${query}${query ? "&" : ""}bbox=${[b.south, b.west, b.north, b.east].map((x) => x.toFixed(5)).join(",")}`);
        if (!r.ok) return;
        const more = (await r.json()) as MapMarker[];
        setMarkers((cur) => dedupe([...cur, ...more]).slice(0, 600));
      } catch { /* hors ligne : on garde les marqueurs */ }
    }, 450);
  }, [autoLoad, query]);

  const list = layout === "list" ? (
    <div className="space-y-4">
      {items.map((p) => <div key={p.id} onMouseEnter={() => setActive(p.id)} onMouseLeave={() => setActive(null)}><PropertyRow p={p} /></div>)}
    </div>
  ) : (
    <div className={"grid grid-cols-1 gap-5 sm:grid-cols-2 " + (halfMap ? "xl:grid-cols-2" : "lg:grid-cols-3 xl:grid-cols-4")}>
      {items.map((p) => <div key={p.id} onMouseEnter={() => setActive(p.id)} onMouseLeave={() => setActive(null)}><PropertyCard p={p} /></div>)}
    </div>
  );

  if (!halfMap) return <div className="mt-8">{list}</div>;
  return (
    <div className="mt-6">
      <div className="mb-3 flex justify-end lg:hidden">
        <button type="button" onClick={() => setShowMap((v) => !v)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink">
          {showMap ? "Voir la liste" : `Voir la carte (${markers.length})`}
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)]">
        <div className={showMap ? "hidden lg:block" : ""}>{list}</div>
        <div className={(showMap ? "" : "hidden ") + "lg:block"}>
          <div className="sticky top-20 overflow-hidden rounded-2xl border border-slate-200">
            <SiteMap settings={mapSettings} markers={markers} activeId={active} onBoundsChange={onBounds} className="h-[70vh] w-full lg:h-[calc(100dvh-7rem)]" />
          </div>
          <p className="mt-2 text-xs text-muted">{markers.length} bien(s) sur la carte{autoLoad ? " · déplacez la carte pour charger la zone" : ""}. Seules les annonces localisées apparaissent.</p>
        </div>
      </div>
    </div>
  );
}

function dedupe(ms: MapMarker[]) {
  const seen = new Set<string>();
  return ms.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}
