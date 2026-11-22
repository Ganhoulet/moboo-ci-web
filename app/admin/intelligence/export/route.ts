import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/server-api";

export const dynamic = "force-dynamic";

/** Téléchargement CSV (Excel) du tableau par commune, avec les filtres de la page. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const { ok, status, data } = await authedFetch(`/site/admin/intelligence/export?${u.searchParams}`, { method: "GET", cache: "no-store" });
  if (!ok || typeof data?.csv !== "string") return new NextResponse("Export impossible.", { status: status === 401 || status === 403 ? status : 400 });
  return new NextResponse(data.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${String(data.filename).replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}
