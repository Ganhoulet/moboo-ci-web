"use client";

import { useEffect, useState } from "react";
import { API_URL, type OccupiedRange } from "@/lib/api";

/**
 * Dates prises en direct : réservations faites dans Moboo Resi / Moboo Event,
 * sur le site ou dans l'application, et blocages du propriétaire. Le calendrier
 * se met à jour sans recharger la page (flux SSE de l'API, repli : relecture
 * toutes les 20 s si le flux est coupé).
 */
export function useLiveOccupied(kind: "apt" | "esp", initial: Record<string, OccupiedRange[]>) {
  const [occ, setOcc] = useState(initial);
  const ids = Object.keys(initial).join(",");

  useEffect(() => {
    if (!ids) return;
    let es: EventSource | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let closed = false;
    const url = `${API_URL}/marketplace/live/availability?${kind}=${encodeURIComponent(ids)}`;
    const apply = (raw: string) => {
      try {
        const d = JSON.parse(raw) as { kind: string; id: string; ranges: OccupiedRange[] };
        if (d.kind === kind) setOcc((o) => ({ ...o, [d.id]: d.ranges }));
      } catch { /* message illisible : ignoré */ }
    };
    const poll = async () => {
      for (const id of ids.split(",")) {
        const path = kind === "apt" ? `apartments/${id}/occupied` : `espaces/${id}/occupied`;
        const r = await fetch(`${API_URL}/marketplace/${path}`, { cache: "no-store" }).catch(() => null);
        const d = r?.ok ? await r.json().catch(() => null) : null;
        if (d?.ranges) setOcc((o) => ({ ...o, [id]: d.ranges }));
      }
    };
    try {
      es = new EventSource(url);
      es.addEventListener("occupied", (e) => apply((e as MessageEvent).data));
      es.onerror = () => {
        if (es && es.readyState === EventSource.CLOSED && !timer && !closed) timer = setInterval(poll, 20_000);
      };
    } catch {
      timer = setInterval(poll, 20_000);
    }
    return () => {
      closed = true;
      es?.close();
      if (timer) clearInterval(timer);
    };
  }, [kind, ids]);

  return occ;
}
