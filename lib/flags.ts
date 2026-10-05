// Serveur uniquement. Activation progressive des fonctionnalités : les
// définitions viennent de l'API (cache 30 s, étiquette « site-flags ») et le
// site décide lui-même pour chaque visiteur, sans appel supplémentaire.
// N.B. même calcul que l'API (moboo-resi-api/src/modules/site-flags/flags.util.ts).
import { cache } from "react";
import { headers } from "next/headers";
import { API_URL } from "./api";
import { relayHeaders } from "./relay";
import { getSession } from "./session";

export const FLAGS_TAG = "site-flags";
interface FlagDef { key: string; enabled: boolean; rollout: number; audiences: string[]; include: string[] }
interface FlagCtx { unit?: string | null; accountId?: string | null; phone?: string | null; accountType?: string | null; admin?: boolean }

export function bucket(key: string, unit: string): number {
  let h = 0x811c9dc5;
  const s = `${key}:${unit}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 100;
}

function inAudience(a: string, c: FlagCtx) {
  switch (a) {
    case "connectes": return !!c.accountId;
    case "admins": return !!c.admin;
    case "pros": return !!c.accountId && !!c.accountType && c.accountType !== "particulier";
    case "particuliers": return !!c.accountId && (c.accountType ?? "particulier") === "particulier";
    default: return false;
  }
}

export function evaluate(f: FlagDef, c: FlagCtx): boolean {
  if (!f.enabled) return false;
  const ids = [c.accountId, c.phone].filter(Boolean) as string[];
  if (f.include.some((x) => ids.includes(x))) return true;
  if (f.audiences.length && !f.audiences.some((a) => inAudience(a, c))) return false;
  if (f.rollout >= 100) return true;
  if (f.rollout <= 0) return false;
  const unit = c.accountId || c.unit;
  return unit ? bucket(f.key, unit) < f.rollout : false;
}

async function definitions(): Promise<FlagDef[] | null> {
  try {
    const r = await fetch(`${API_URL}/site/flags/definitions`, { next: { revalidate: 30, tags: [FLAGS_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? ((await r.json()).flags as FlagDef[]) : null;
  } catch {
    return null;
  }
}

/** Fonctionnalités actives pour le visiteur de la requête (une fois par rendu). */
export const getFlags = cache(async (): Promise<Record<string, boolean>> => {
  const defs = await definitions();
  if (!defs) return {};
  let unit: string | null = null;
  try { unit = headers().get("x-moboo-did"); } catch { /* hors requête */ }
  const a = getSession();
  const ctx: FlagCtx = { unit, accountId: a?.id, phone: a?.phone, accountType: a?.accountType, admin: !!a?.isAdmin };
  return Object.fromEntries(defs.map((f) => [f.key, evaluate(f, ctx)]));
});

/**
 * Fonctionnalité active pour ce visiteur ? Interrupteur inconnu ou API
 * injoignable : `fallback` (true pour les fonctionnalités déjà en ligne).
 */
export async function isOn(key: string, fallback = true): Promise<boolean> {
  const flags = await getFlags();
  return key in flags ? flags[key] : fallback;
}
