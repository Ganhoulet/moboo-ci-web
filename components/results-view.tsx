"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import type { Property } from "@/lib/property";
import type { MapSettings } from "@/lib/settings";
import type { ResultLayout } from "@/lib/result-layouts";
import { PropertyCard } from "./property-card";
import { PropertyRow } from "./property-row";
import { SiteMap, type Bbox } from "./site-map";
import { toMarker, type MapMarker } from "@/lib/map-markers";

// Classes fixes (Tailwind) : colonnes de la grille selon la place laissée par la carte.
const COLS_FULL: Record<number, string> = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" };
const COLS_SPLIT: Record<number, string> = { 1: "", 2: "sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3" };
const MAP_H = { small: "h-[280px]", medium: "h-[420px]", large: "h-[560px]" };

/**
 * Résultats de recherche selon le modèle d'affichage choisi dans le back-office :
 * sans carte, carte à gauche ou à droite (largeur réglable), carte en haut, ou
 * carte plein écran avec la liste à côté. Survol d'une annonce = repère mis en
 * avant ; déplacer la carte charge les biens de la zone si le modèle le prévoit.
 */
export function ResultsView({
  items, tpl, mapSettings, mapItems, query, mapEnabled = true, head, foot,
}: {
  /** Vue façon Zillow : titre, tri et bandeaux en haut de la colonne des annonces. */
  head?: ReactNode;
  /** Vue façon Zillow : pagination sous les annonces. */
  foot?: ReactNode;
  items: Property[];
  tpl: ResultLayout;
  mapSettings: MapSettings;
  mapItems: Property[];
  /** Filtres courants (chargement par zone). */
  query: string;
  /** Carte possible pour ces résultats (biens localisés). */
  mapEnabled?: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const initial = useMemo(() => [...items, ...mapItems].map(toMarker).filter(Boolean) as MapMarker[], [items, mapItems]);
  const [markers, setMarkers] = useState<MapMarker[]>(() => dedupe(initial));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);
  const view = mapEnabled && initial.length ? tpl.view : "standard";
  const split = view === "map-left" || view === "map-right" || view === "map-full" || view === "zillow";
  const autoLoad = tpl.autoLoad && mapEnabled;

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

  const hover = (id: string) => ({ onMouseEnter: () => setActive(id), onMouseLeave: () => setActive(null) });
  const list = tpl.listStyle === "list" || view === "map-full" ? (
    <div className="space-y-4">
      {items.map((p) => <div key={p.id} {...hover(p.id)}><PropertyRow p={p} /></div>)}
    </div>
  ) : (
    <div className={"grid grid-cols-1 gap-5 " + ((split ? COLS_SPLIT : COLS_FULL)[tpl.columns] ?? COLS_FULL[4])}>
      {items.map((p) => <div key={p.id} className={p.showcase && tpl.columns > 1 ? "sm:col-span-2" : undefined} {...hover(p.id)}><PropertyCard p={p} /></div>)}
    </div>
  );

  // Sans biens localisés, la vue façon Zillow retombe sur la liste (avec son titre et sa pagination).
  if (view === "standard") return head || foot ? <div className="container-page pb-10 pt-5">{head}<div className="mt-6">{list}</div>{foot}</div> : <div className="mt-8">{list}</div>;

  const settings0 = { ...mapSettings, markerType: tpl.marker };

  // Galerie : grandes photos, carte en plein écran à la demande (bouton flottant).
  if (view === "gallery") {
    return (
      <div className="mt-8">
        {list}
        <button type="button" onClick={() => setShowMap(true)}
          className="fixed bottom-24 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-xl md:bottom-8">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" strokeLinejoin="round" /><path d="M9 4v14M15 6v14" /></svg>
          Afficher la carte
        </button>
        {showMap ? (
          <div className="fixed inset-0 z-[80] bg-white" role="dialog" aria-label="Carte des annonces">
            <SiteMap settings={settings0} markers={markers} activeId={active} onBoundsChange={onBounds} className="h-full w-full" />
            <button type="button" onClick={() => setShowMap(false)}
              className="absolute bottom-8 left-1/2 z-[81] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-xl">
              Afficher la liste
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  // Façon Zillow : carte collée à gauche sur toute la hauteur, annonces qui défilent à droite.
  if (view === "zillow") {
    return (
      <div className="lg:grid lg:grid-cols-[var(--map-w)_minmax(0,1fr)]" style={{ ["--map-w" as string]: `${tpl.mapWidth}%` }}>
        <div className={(showMap ? "" : "hidden ") + "lg:block"}>
          <div className="sticky top-16 h-[calc(100dvh-4rem)] border-r border-slate-200">
            <SiteMap settings={settings0} markers={markers} activeId={active} onBoundsChange={onBounds} className="h-full w-full" />
            <span className="pointer-events-none absolute left-3 top-3 z-[5] rounded-full bg-ink/80 px-3 py-1.5 text-xs font-bold text-white">
              {markers.length} bien(s) sur la carte
            </span>
          </div>
        </div>
        <div className={(showMap ? "hidden lg:block " : "") + "min-w-0 px-4 pb-10 pt-5 sm:px-6"}>
          {head}
          <div className="mt-4 flex justify-end lg:hidden">
            <button type="button" onClick={() => setShowMap(true)} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">Carte ({markers.length})</button>
          </div>
          <div className="mt-5">{list}</div>
          {foot}
        </div>
        {showMap ? (
          <button type="button" onClick={() => setShowMap(false)}
            className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-xl lg:hidden">
            Afficher la liste
          </button>
        ) : null}
      </div>
    );
  }

  const settings = { ...mapSettings, markerType: tpl.marker };
  const caption = <p className="mt-2 text-xs text-muted">{markers.length} bien(s) sur la carte{autoLoad ? " · déplacez la carte pour charger la zone" : ""}. Seules les annonces localisées apparaissent.</p>;
  const mobileToggle = (
    <div className="mb-3 flex justify-end lg:hidden">
      <button type="button" onClick={() => setShowMap((v) => !v)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink">
        {showMap ? "Voir la liste" : `Voir la carte (${markers.length})`}
      </button>
    </div>
  );

  if (view === "map-top") {
    return (
      <div className="mt-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <SiteMap settings={settings} markers={markers} activeId={active} onBoundsChange={onBounds} className={`${MAP_H[tpl.mapHeight]} w-full`} />
        </div>
        {caption}
        <div className="mt-6">{list}</div>
      </div>
    );
  }

  const mapLeft = view === "map-left" || view === "map-full";
  const full = view === "map-full";
  const map = (
    <div className={(showMap ? "" : "hidden ") + "lg:block"}>
      <div className="sticky top-20 overflow-hidden rounded-2xl border border-slate-200">
        <SiteMap settings={settings} markers={markers} activeId={active} onBoundsChange={onBounds} className="h-[70vh] w-full lg:h-[calc(100dvh-7rem)]" />
      </div>
      {caption}
    </div>
  );
  const listPane = (
    <div className={(showMap ? "hidden lg:block" : "") + (full ? " lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-2" : "")}>{list}</div>
  );
  return (
    <div className="mt-6">
      {mobileToggle}
      <div
        className={"grid gap-6 " + (mapLeft ? "lg:grid-cols-[var(--map-w)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_var(--map-w)]")}
        style={{ ["--map-w" as string]: `${tpl.mapWidth}%` }}
      >
        {mapLeft ? <>{map}{listPane}</> : <>{listPane}{map}</>}
      </div>
    </div>
  );
}

function dedupe(ms: MapMarker[]) {
  const seen = new Set<string>();
  return ms.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
}
