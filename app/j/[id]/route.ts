import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Lien court des WhatsApp et SMS du parcours : le serveur compte le clic puis redirige. */
export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.redirect(new URL("/", req.nextUrl.origin), 302);
  return NextResponse.redirect(`${API_URL}/site/journeys/c/${params.id}`, 302);
}
