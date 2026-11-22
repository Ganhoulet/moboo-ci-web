"use server";

import { authedFetch } from "@/lib/server-api";
import type { Intelligence } from "./types";
import { qs, type Filtre } from "./qs";


/** Back-office → Intelligence immobilière : tout le marché Moboo.ci, filtré par zone et type. */
export async function getIntelligence(f: Filtre): Promise<{ ok: true; data: Intelligence } | { ok: false; error: string }> {
  const r = await authedFetch(`/site/admin/intelligence?${qs(f)}`, { method: "GET", cache: "no-store" });
  return r.ok ? { ok: true, data: r.data } : { ok: false, error: r.status === 403 ? "Accès refusé (droit « Statistiques »)." : "Analyse indisponible pour le moment." };
}
