import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

export const dynamic = "force-dynamic";

/** Lien des relances (e-mail, WhatsApp, Mon espace) : clic compté, puis page prévue. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let target = "/mon-espace";
  if (/^[0-9a-f-]{36}$/i.test(params.id)) {
    try {
      const r = await fetch(`${API_URL}/site/nudges/${params.id}/click`, { method: "POST", headers: { Accept: "application/json", ...relayHeaders(true) }, cache: "no-store" });
      const t = r.ok ? String((await r.json()).target ?? "") : "";
      if (/^\/[\w\-/]*$/.test(t)) target = t;
    } catch { /* lien quand même utile */ }
  }
  return NextResponse.redirect(new URL(target, req.nextUrl.origin), 302);
}
