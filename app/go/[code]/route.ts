import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

/** Lien court des vidéos (TikTok…) : clic compté par l'API, puis page visée avec UTM. */
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  let target = "/";
  try {
    const r = await fetch(`${API_URL}/site/seo/go/${encodeURIComponent(params.code)}`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(false) } });
    if (r.ok) target = (await r.json()).target || "/";
  } catch { /* API indisponible : accueil */ }
  return NextResponse.redirect(new URL(target.startsWith("/") ? target : "/", req.url), 302);
}
