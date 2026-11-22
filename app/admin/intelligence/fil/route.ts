import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/server-api";

export const dynamic = "force-dynamic";

/** Fil en direct du marché, interrogé toutes les 30 s par la page (l'API vérifie le droit « Statistiques »). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = new URLSearchParams();
  for (const k of ["depuis", "commune"]) { const v = u.searchParams.get(k); if (v) q.set(k, v.slice(0, 80)); }
  const { ok, status, data } = await authedFetch(`/site/admin/intelligence/fil?${q}`, { method: "GET", cache: "no-store" });
  return NextResponse.json(ok ? data : { error: "indisponible" }, { status: ok ? 200 : status || 502, headers: { "Cache-Control": "no-store" } });
}
