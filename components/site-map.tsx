"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { MapSettings } from "@/lib/settings";
import type { MapMarker } from "@/lib/map-markers";
import { img as optimized } from "@/lib/img";

export type { MapMarker };

export type Bbox = { south: number; west: number; north: number; east: number };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function popupHtml(m: MapMarker) {
  const img = m.image ? `<img src="${esc(optimized(m.image, 320))}" loading="lazy" alt="" style="width:100%;height:96px;object-fit:cover;border-radius:6px;margin-bottom:6px">` : "";
  const body = `${img}<strong style="display:block;font-size:13px;line-height:1.3">${esc(m.title ?? "")}</strong>${m.label ? `<span style="color:#1e3a8a;font-weight:700">${esc(m.label)}</span>` : ""}`;
  return m.href ? `<a href="${esc(m.href)}" style="display:block;width:180px;color:inherit;text-decoration:none">${body}</a>` : `<div style="width:180px">${body}</div>`;
}

const PIN_SVG = `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg"><path d="M14 35s11-11.2 11-20.2A11 11 0 0 0 3 14.8C3 23.8 14 35 14 35Z" fill="#ea580c" stroke="#fff" stroke-width="2"/><circle cx="14" cy="14.5" r="4.2" fill="#fff"/></svg>`;

/* ─── Google Maps (chargé une seule fois) ─────────────────────────────────── */
let googleLoading: Promise<any> | null = null;
function loadGoogle(key: string): Promise<any> {
  const w = window as any;
  if (w.google?.maps) return Promise.resolve(w.google);
  if (!googleLoading) {
    googleLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=fr&region=CI`;
      s.async = true;
      s.onload = () => resolve(w.google);
      s.onerror = () => { googleLoading = null; reject(new Error("Google Maps indisponible")); };
      document.head.appendChild(s);
    });
  }
  return googleLoading;
}

/**
 * Carte du site (fiches, demi-carte des résultats) selon le réglage
 * « Cartes » : OpenStreetMap / Mapbox (Leaflet) ou Google Maps.
 */
export function SiteMap({
  settings, markers, center, zoom, className = "h-64 w-full", circle = false, fitMarkers = true, onBoundsChange, activeId,
}: {
  settings: MapSettings;
  markers: MapMarker[];
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  className?: string;
  /** Zone approximative (cercle) au lieu d'un marqueur précis. */
  circle?: boolean;
  fitMarkers?: boolean;
  onBoundsChange?: (b: Bbox) => void;
  /** Marqueur mis en avant (survol d'une carte de la liste). */
  activeId?: string | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const api = useRef<{ setMarkers: (m: MapMarker[]) => void; highlight: (id: string | null) => void; destroy: () => void } | null>(null);
  const boundsCb = useRef(onBoundsChange);
  boundsCb.current = onBoundsChange;
  const fallback = { lat: Number(settings.fallbackLat) || 5.36, lng: Number(settings.fallbackLng) || -4.0083 };
  const start = center ?? (markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : fallback);
  const z = zoom ?? settings.defaultZoom ?? 12;
  const useGoogle = settings.provider === "google" && !!settings.googleApiKey;

  useEffect(() => {
    let cancelled = false;
    const node = el.current;
    if (!node) return;

    if (useGoogle) {
      loadGoogle(settings.googleApiKey).then((g) => {
        if (cancelled || !node) return;
        const map = new g.maps.Map(node, {
          center: start, zoom: z, maxZoom: settings.maxZoom, mapTypeId: settings.mapType,
          streetViewControl: false, fullscreenControl: true, mapTypeControl: false, gestureHandling: "cooperative",
        });
        let objs: any[] = [];
        const info = new g.maps.InfoWindow();
        const byId = new Map<string, any>();
        const setMarkers = (ms: MapMarker[]) => {
          objs.forEach((o) => o.setMap(null));
          objs = []; byId.clear();
          if (circle && ms[0]) {
            objs.push(new g.maps.Circle({ map, center: { lat: ms[0].lat, lng: ms[0].lng }, radius: 450, fillColor: "#ea580c", fillOpacity: 0.18, strokeColor: "#ea580c", strokeWeight: 2 }));
            return;
          }
          for (const m of ms) {
            const price = settings.markerType === "price" && m.label;
            const mk = new g.maps.Marker({
              map, position: { lat: m.lat, lng: m.lng }, title: m.title,
              ...(price ? { label: { text: m.label, color: "#fff", fontSize: "11px", fontWeight: "700" }, icon: { path: "M -30,-12 H 30 V 12 H -30 Z", fillColor: "#1e3a8a", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2, scale: 1, labelOrigin: new g.maps.Point(0, 0) } } : {}),
            });
            mk.addListener("click", () => { info.setContent(popupHtml(m)); info.open({ map, anchor: mk }); });
            objs.push(mk); byId.set(m.id, mk);
          }
          if (fitMarkers && ms.length > 1) {
            const b = new g.maps.LatLngBounds();
            ms.forEach((m) => b.extend({ lat: m.lat, lng: m.lng }));
            map.fitBounds(b, 40);
          }
        };
        setMarkers(markers);
        map.addListener("idle", () => {
          const b = map.getBounds();
          if (b && boundsCb.current) boundsCb.current({ south: b.getSouthWest().lat(), west: b.getSouthWest().lng(), north: b.getNorthEast().lat(), east: b.getNorthEast().lng() });
        });
        api.current = {
          setMarkers: (ms) => { fitMarkers = false; setMarkers(ms); },
          highlight: (id) => byId.forEach((mk, k) => mk.setZIndex(k === id ? 999 : 1)),
          destroy: () => objs.forEach((o) => o.setMap(null)),
        };
      }).catch(() => { if (node) node.innerHTML = '<p style="padding:16px;font-size:13px;color:#64748b">Carte indisponible.</p>'; });
      return () => { cancelled = true; api.current?.destroy(); api.current = null; };
    }

    // OpenStreetMap / Mapbox via Leaflet (chargé à la demande).
    let map: any = null;
    import("leaflet").then((mod) => {
      const L: any = (mod as any).default ?? mod;
      if (cancelled || !node) return;
      map = L.map(node, { center: [start.lat, start.lng], zoom: z, maxZoom: settings.maxZoom, scrollWheelZoom: false });
      const mb = (style: string) => L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(settings.mapboxToken)}`,
        { attribution: "© Mapbox © OpenStreetMap", maxZoom: settings.maxZoom, tileSize: 256 });
      let layer: any;
      if (settings.provider === "mapbox" && settings.mapboxToken) {
        layer = mb({ roadmap: "streets-v12", satellite: "satellite-v9", hybrid: "satellite-streets-v12", terrain: "outdoors-v12" }[settings.mapType] ?? "streets-v12");
      } else if (settings.mapType === "satellite" || settings.mapType === "hybrid") {
        layer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Imagerie © Esri", maxZoom: Math.min(19, settings.maxZoom) });
      } else if (settings.mapType === "terrain") {
        layer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { attribution: "© OpenTopoMap © OpenStreetMap", maxZoom: Math.min(17, settings.maxZoom) });
      } else {
        layer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: Math.min(19, settings.maxZoom) });
      }
      layer.addTo(map);
      const group = L.layerGroup().addTo(map);
      const byId = new Map<string, any>();
      const icon = (m: MapMarker, active = false) => settings.markerType === "price" && m.label
        ? L.divIcon({ className: "", html: `<span class="moboo-price-pin${active ? " is-active" : ""}">${esc(m.label)}</span>`, iconSize: null as any, iconAnchor: [30, 14] })
        : L.divIcon({ className: "", html: PIN_SVG, iconSize: [28, 36], iconAnchor: [14, 35], popupAnchor: [0, -30] });
      let fit = fitMarkers;
      const setMarkers = (ms: MapMarker[]) => {
        group.clearLayers(); byId.clear();
        if (circle && ms[0]) {
          L.circle([ms[0].lat, ms[0].lng], { radius: 450, color: "#ea580c", fillColor: "#ea580c", fillOpacity: 0.18, weight: 2 }).addTo(group);
          return;
        }
        for (const m of ms) {
          const mk = L.marker([m.lat, m.lng], { icon: icon(m), title: m.title, riseOnHover: true }).bindPopup(popupHtml(m), { closeButton: true, maxWidth: 200 });
          mk.addTo(group); byId.set(m.id, { mk, m });
        }
        if (fit && ms.length > 1) map.fitBounds(L.latLngBounds(ms.map((m) => [m.lat, m.lng])), { padding: [30, 30], maxZoom: 15 });
      };
      setMarkers(markers);
      const emit = () => {
        const b = map.getBounds();
        boundsCb.current?.({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
      };
      map.on("moveend", emit);
      map.on("focus", () => map.scrollWheelZoom.enable());
      api.current = {
        setMarkers: (ms) => { fit = false; setMarkers(ms); },
        highlight: (id) => byId.forEach(({ mk, m }, k) => { mk.setIcon(icon(m, k === id)); mk.setZIndexOffset(k === id ? 1000 : 0); }),
        destroy: () => map?.remove(),
      };
    });
    return () => { cancelled = true; api.current?.destroy(); api.current = null; };
    // La carte est créée une fois ; les marqueurs suivent via setMarkers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useGoogle, settings.provider, settings.mapType, settings.markerType]);

  useEffect(() => { api.current?.setMarkers(markers); }, [markers]);
  useEffect(() => { api.current?.highlight(activeId ?? null); }, [activeId]);

  return <div ref={el} className={"relative z-0 overflow-hidden bg-slate-100 " + className} role="region" aria-label="Carte" />;
}
