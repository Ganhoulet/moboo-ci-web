import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";

export const dynamic = "force-dynamic";

/**
 * Temps réel (cloche de l'en-tête). Route dédiée plutôt que des actions
 * serveur : celles-ci passent en file les unes derrière les autres.
 * GET /api/live → { unread } ; GET /api/live?ticket=1 → + ticket du flux SSE.
 */
export async function GET(req: NextRequest) {
  if (!getSession()) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const wantTicket = req.nextUrl.searchParams.get("ticket") === "1";
  const [unread, ticket] = await Promise.all([
    authedFetch("/site/me/conversations/unread", { method: "GET" }),
    wantTicket ? authedFetch("/site/live/ticket", { method: "POST" }) : null,
  ]);
  if (unread.status === 401) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  return NextResponse.json(
    {
      unread: Number(unread.data?.count) || 0,
      ...(ticket?.ok && ticket.data?.ticket ? { ticket: ticket.data.ticket, url: `${API_URL}/site/live/stream` } : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
