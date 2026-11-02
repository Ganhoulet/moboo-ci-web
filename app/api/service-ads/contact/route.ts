import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

/** Appel ou WhatsApp depuis la mini-page d'un prestataire : contact compté, puis redirection. */
export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("s") || "").replace(/[^a-z0-9-]/g, "").slice(0, 60);
  const to = req.nextUrl.searchParams.get("to") === "wa" ? "wa" : "tel";
  const digits = (req.nextUrl.searchParams.get("n") || "").replace(/[^0-9]/g, "").slice(0, 15);
  if (!slug || digits.length < 8) return NextResponse.redirect(new URL("/annonces", req.url));
  await fetch(`${API_URL}/site/service-ads/providers/${slug}/contact`, {
    method: "POST", headers: { "Content-Type": "application/json", ...relayHeaders(true) }, body: JSON.stringify({ channel: to === "wa" ? "whatsapp" : "call" }),
  }).catch(() => null);
  const text = (req.nextUrl.searchParams.get("t") || "").slice(0, 400);
  return NextResponse.redirect(to === "wa" ? `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}` : `tel:+${digits}`, 302);
}
