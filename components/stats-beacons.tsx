"use client";

import { useEffect } from "react";
import { beacon, listingUuid } from "@/lib/beacon";

/** Annonces affichées dans une page de résultats (statistiques « apparitions » des annonceurs). */
export function ImpressionsBeacon({ ids, commune }: { ids: string[]; commune?: string | null }) {
  const key = ids.join(",");
  useEffect(() => {
    const list = ids.map(listingUuid).filter(Boolean) as string[];
    if (list.length) beacon({ kind: "impressions", ids: list.slice(0, 60), commune: commune ?? null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une fois par liste affichée
  }, [key, commune]);
  return null;
}

/** Vue de la page pro (statistiques du compte). */
export function ProViewBeacon({ username }: { username: string }) {
  useEffect(() => { beacon({ kind: "pro-view", username }); }, [username]);
  return null;
}
