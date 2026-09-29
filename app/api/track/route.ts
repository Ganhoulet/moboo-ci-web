import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import "@/lib/client-ip";

/**
 * Clic « Appeler » / « WhatsApp » sur une fiche (envoyé par sendBeacon, même
 * origine) → relayé au moteur pour les statistiques de l'annonceur.
 */
export async function POST(req: NextRequest) {
  let body: { listingId?: string; channel?: string } = {};
  try { body = JSON.parse(await req.text()); } catch { /* corps invalide */ }
  const { listingId, channel } = body;
  if (!listingId || !/^[\w-]{6,64}$/.test(listingId) || (channel !== "call" && channel !== "whatsapp")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    await fetch(`${API_URL}/marketplace/listings/${encodeURIComponent(listingId)}/contact-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true) },
      body: JSON.stringify({ channel }),
      cache: "no-store",
    });
  } catch { /* statistique best-effort */ }
  return NextResponse.json({ ok: true });
}
