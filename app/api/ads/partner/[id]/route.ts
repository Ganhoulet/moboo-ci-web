import { NextResponse, type NextRequest } from "next/server";
import { trackAdClick } from "@/lib/ads";

/** Contact d'un agent partenaire de zone : clic compté, puis WhatsApp ou appel. */
export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const digits = (req.nextUrl.searchParams.get("n") || "").replace(/[^0-9]/g, "").slice(0, 15);
  const to = req.nextUrl.searchParams.get("to");
  if (digits.length < 8) return NextResponse.redirect(new URL("/annonces", req.url));
  trackAdClick("partner", params.id);
  const intl = digits.length === 10 ? `225${digits}` : digits;
  // Message pré-rempli (intérêt pour l'annonce, titre, lien), limité et réencodé.
  const text = (req.nextUrl.searchParams.get("t") || "").slice(0, 600);
  return NextResponse.redirect(to === "tel" ? `tel:+${intl}` : `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ""}`, 302);
}
