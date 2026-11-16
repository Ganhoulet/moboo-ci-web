"use client";

import { useEffect, useRef, useState } from "react";
import type { MapSettings } from "@/lib/settings";
import { SiteMap, type MapMarker } from "./site-map";

/** Distance à vol d'oiseau (km). */
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Guidage jusqu'au logement (réservation confirmée) : point exact sur la
 * carte, position du client à la demande, distance, puis guidage Google Maps
 * ou Waze depuis sa position — comme une course VTC.
 */
export function ArrivalGuide({
  settings, lat, lng, title, mapsUrl, wazeUrl, share, place = "du logement",
}: {
  settings: MapSettings;
  lat: number;
  lng: number;
  title: string;
  mapsUrl: string | null;
  wazeUrl: string | null;
  /** Envoie la position du voyageur (avec son accord) : l'équipe Moboo voit sa distance au logement. */
  share?: (lat: number, lng: number) => Promise<unknown>;
  /** « du logement » (séjours) ou « de la salle » (espaces). */
  place?: string;
}) {
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "denied">("idle");
  const dest = { lat, lng };
  const markers: MapMarker[] = [{ id: "dest", lat, lng, title }];
  if (me) markers.push({ id: "me", lat: me.lat, lng: me.lng, label: "Vous", title: "Votre position" });

  // Suivi en route : la position est renvoyée au plus toutes les 2 minutes tant que la page est ouverte.
  const watch = useRef<number | null>(null);
  const lastSent = useRef(0);
  useEffect(() => () => { if (watch.current != null) navigator.geolocation?.clearWatch(watch.current); }, []);
  const send = (p: { lat: number; lng: number }) => {
    if (!share || Date.now() - lastSent.current < 120_000) return;
    lastSent.current = Date.now();
    share(p.lat, p.lng).catch(() => undefined);
  };

  const locate = () => {
    if (!navigator.geolocation) return setStatus("denied");
    setStatus("busy");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMe(pos); setStatus("idle"); send(pos);
        if (share && watch.current == null) {
          watch.current = navigator.geolocation.watchPosition(
            (q) => { const next = { lat: q.coords.latitude, lng: q.coords.longitude }; setMe(next); send(next); },
            () => undefined,
            { enableHighAccuracy: true, maximumAge: 60000 },
          );
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };
  const d = me ? km(me, dest) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-green-200 bg-white">
      {/* La carte se recrée quand la position arrive : les deux points restent visibles. */}
      <SiteMap key={me ? "with-me" : "dest"} settings={settings} markers={markers} center={dest}
        zoom={Math.min(settings.maxZoom, Math.max(settings.defaultZoom, 15))} fitMarkers={!!me} className="h-64 w-full" />
      <div className="space-y-3 p-4">
        <p className="text-sm text-ink">
          {d != null
            ? <>Vous êtes à environ <strong>{d < 1 ? `${Math.round(d * 1000)} m` : `${d.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`}</strong> {place} (à vol d’oiseau).</>
            : status === "denied"
              ? "Position indisponible : autorisez la localisation dans votre navigateur, ou lancez directement le guidage."
              : `Le point exact ${place}. Situez-vous pour voir la distance, puis lancez le guidage.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {mapsUrl ? <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary bg-green-700 hover:bg-green-800">Démarrer le guidage (Google Maps)</a> : null}
          {wazeUrl ? <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-4 py-2 text-sm font-semibold text-sky-800 ring-1 ring-sky-300 hover:bg-sky-50">Waze</a> : null}
          {!me ? (
            <button type="button" onClick={locate} disabled={status === "busy"} className="rounded-full px-4 py-2 text-sm font-semibold text-green-800 ring-1 ring-green-300 hover:bg-green-100 disabled:opacity-60">
              {status === "busy" ? "Localisation…" : "Me situer"}
            </button>
          ) : null}
        </div>
        {share ? <p className="text-xs text-muted">En vous situant, vous partagez votre distance au logement avec l’équipe Moboo (jamais votre adresse), jusqu’à votre arrivée, pour qu’elle puisse vous aider si besoin.</p> : null}
      </div>
    </div>
  );
}
