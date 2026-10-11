import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

/** moboo.ci/v/12 : « Vidéo n°12 » annoncée dans une vidéo TikTok → page de la vidéo (visite comptée). */
export async function GET(req: NextRequest, { params }: { params: { n: string } }) {
  let target = "/tiktok";
  if (/^\d{1,7}$/.test(params.n)) {
    try {
      const r = await fetch(`${API_URL}/site/seo/videos/number/${params.n}`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(false) } });
      if (r.ok) target = (await r.json()).target || target;
    } catch { /* API indisponible : page des vidéos */ }
  }
  return NextResponse.redirect(new URL(target.startsWith("/") ? target : "/tiktok", req.url), 302);
}
