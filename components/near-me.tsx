"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const RADII = [1, 3, 5, 10, 20];

/**
 * Recherche par rayon : « Autour de moi » (position du téléphone) puis choix du
 * rayon. Les biens sont triés du plus proche au plus loin, avec la distance.
 */
export function NearMe({ active, radius }: { active: boolean; radius: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v === null ? next.delete(k) : next.set(k, v));
    next.delete("page");
    router.push(`${pathname}?${next}`);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) { setError("Localisation indisponible sur cet appareil."); return; }
    setBusy(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setBusy(false); go({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5), radius: String(radius || 3), sort: null }); },
      () => { setBusy(false); setError("Autorisez la localisation pour voir les biens autour de vous."); },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  if (!active) {
    return (
      <div className="flex flex-col items-start gap-1">
        <button type="button" onClick={locate} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-60">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="8" /></svg>
          {busy ? "Localisation…" : "Autour de moi"}
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sm text-sky-900 ring-1 ring-sky-200">
      <span className="font-semibold">Autour de vous :</span>
      {RADII.map((r) => (
        <button key={r} type="button" onClick={() => go({ radius: String(r) })}
          className={"rounded-full px-2.5 py-0.5 text-xs font-bold " + (r === radius ? "bg-sky-700 text-white" : "bg-white text-sky-800 ring-1 ring-sky-200 hover:bg-sky-100")}>
          {r} km
        </button>
      ))}
      <button type="button" onClick={() => go({ lat: null, lng: null, radius: null })} aria-label="Retirer la recherche autour de moi" className="ml-1 text-sky-700 hover:text-sky-900">✕</button>
    </div>
  );
}
