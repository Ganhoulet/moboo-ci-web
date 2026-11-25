"use server";

import { authedFetch } from "@/lib/server-api";
import type { SiteAccount } from "@/lib/api";

/** Types d'alerte sonore (un son par type). */
export type SignalType = "reservation" | "urgent" | "support" | "litige" | "moderation" | "rappel";
export type Signals = Partial<Record<SignalType, number>>;

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
async function get(path: string): Promise<any> {
  try {
    const r = await authedFetch(path, { method: "GET" });
    return r.ok ? r.data : null;
  } catch { return null; }
}

/**
 * Compteurs des demandes en attente, selon le rôle (relevés toutes les 30 s par les
 * alertes sonores) : réservations à confirmer, hôtes à appeler en urgence, demandes
 * de support, litiges, annonces à valider, demandes de rappel des professionnels.
 */
export async function getSignals(): Promise<Signals | null> {
  const me = await get("/site/auth/me");
  const p: string[] = (me as SiteAccount | null)?.permissions ?? [];
  if (!(me as SiteAccount | null)?.isAdmin) return null;
  const has = (...k: string[]) => k.some((x) => p.includes(x));
  const [am, amSupport, help, disputes, mod, leads] = await Promise.all([
    has("accounts") ? get("/site/admin/am/badge") : null,
    has("am.support") ? get("/site/admin/am/support?status=ouvert") : null,
    has("services") ? get("/site/admin/services/support?status=ouvert") : null,
    has("disputes") ? get("/site/admin/disputes/counts") : null,
    has("moderation") ? get("/site/admin/moderation/summary") : null,
    has("marketing", "pages") ? get("/site/admin/pro-leads?status=new") : null,
  ]);
  const out: Signals = {};
  if (am) { out.reservation = num(am.pending); out.urgent = num(am.urgent); }
  if (amSupport || help) out.support = num(amSupport?.unread) + num(help?.unread);
  if (disputes) out.litige = num(disputes.open);
  if (mod) out.moderation = num(mod.pending) + num(mod.reports);
  if (leads) out.rappel = num(leads.counts?.new);
  return out;
}
