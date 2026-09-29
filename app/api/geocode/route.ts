import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";

type Hit = { label: string; lat: number; lng: number };

/**
 * Recherche d'adresse de l'éditeur d'annonce, avec le système de carte du
 * back-office (Google, Mapbox ou OpenStreetMap) et la limite de pays.
 */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 200);
  if (q.length < 3) return NextResponse.json([]);
  const { maps } = await getSiteSettings();
  const cc = maps.limitCountry ? maps.country : "";
  let hits: Hit[] = [];
  try {
    if (maps.provider === "google" && maps.googleApiKey) {
      const u = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&language=fr&key=${encodeURIComponent(maps.googleApiKey)}${cc ? `&components=country:${cc.toUpperCase()}` : ""}`;
      const d = await (await fetch(u, { cache: "no-store" })).json();
      hits = (d.results ?? []).slice(0, 5).map((r: any) => ({ label: r.formatted_address, lat: r.geometry.location.lat, lng: r.geometry.location.lng }));
    } else if (maps.provider === "mapbox" && maps.mapboxToken) {
      const u = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?language=fr&limit=5&access_token=${encodeURIComponent(maps.mapboxToken)}${cc ? `&country=${cc}` : ""}`;
      const d = await (await fetch(u, { cache: "no-store" })).json();
      hits = (d.features ?? []).map((f: any) => ({ label: f.place_name, lat: f.center[1], lng: f.center[0] }));
    } else {
      const u = `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=fr&q=${encodeURIComponent(q)}${cc ? `&countrycodes=${cc}` : ""}`;
      const d = await (await fetch(u, { cache: "no-store", headers: { "User-Agent": "Moboo.ci (contact@moboo.ci)" } })).json();
      hits = (Array.isArray(d) ? d : []).map((r: any) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
    }
  } catch {
    return NextResponse.json({ error: "Recherche d’adresse indisponible." }, { status: 502 });
  }
  return NextResponse.json(hits.filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng)));
}
