import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

/** Clic sur une carte sponsorisée (envoyé en arrière-plan) : compté une fois par visiteur et par jour. */
export async function POST(req: NextRequest) {
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  await fetch(`${API_URL}/site/service-ads/click/${id}`, { method: "POST", headers: { ...relayHeaders(true) } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
