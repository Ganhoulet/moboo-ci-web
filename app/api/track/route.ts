import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import "@/lib/client-ip";

/**
 * Clic « Appeler » / « WhatsApp » sur une fiche (envoyé par sendBeacon, même
 * origine) → relayé au moteur pour les statistiques de l'annonceur.
 */
async function relay(path: string, payload: unknown) {
  try {
    await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true) },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch { /* statistique best-effort */ }
}

const ID = /^[\w-]{6,64}$/;

export async function POST(req: NextRequest) {
  let body: { listingId?: string; channel?: string; kind?: string; ids?: unknown; commune?: unknown; username?: unknown } = {};
  try { body = JSON.parse(await req.text()); } catch { /* corps invalide */ }
  // Partage, apparitions dans les résultats, vue de page pro (statistiques enrichies).
  if (body.kind === "share") {
    if (!body.listingId || !ID.test(body.listingId)) return NextResponse.json({ ok: false }, { status: 400 });
    await relay("/site/track/share", { listingId: body.listingId });
    return NextResponse.json({ ok: true });
  }
  if (body.kind === "impressions") {
    const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string" && ID.test(x)).slice(0, 60) : [];
    if (ids.length) await relay("/site/track/impressions", { ids, commune: typeof body.commune === "string" ? body.commune.slice(0, 120) : null });
    return NextResponse.json({ ok: true });
  }
  if (body.kind === "pro-view") {
    if (typeof body.username === "string" && /^[\w.-]{2,60}$/.test(body.username)) await relay("/site/track/pro-view", { username: body.username });
    return NextResponse.json({ ok: true });
  }
  const { listingId, channel } = body;
  if (!listingId || !ID.test(listingId) || (channel !== "call" && channel !== "whatsapp")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await relay(`/marketplace/listings/${encodeURIComponent(listingId)}/contact-click`, { channel });
  return NextResponse.json({ ok: true });
}
