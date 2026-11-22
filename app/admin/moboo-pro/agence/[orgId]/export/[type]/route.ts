import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/server-api";

export const dynamic = "force-dynamic";

/** Téléchargement CSV (Excel) du parc d'une agence : l'API vérifie le droit « Application ». */
export async function GET(_req: Request, { params }: { params: { orgId: string; type: string } }) {
  const { ok, status, data } = await authedFetch(`/site/admin/pro-agences/${encodeURIComponent(params.orgId)}/export/${encodeURIComponent(params.type)}`, { method: "GET" });
  if (!ok || typeof data?.csv !== "string") return new NextResponse("Export impossible.", { status: status === 401 || status === 403 ? status : 400 });
  return new NextResponse(data.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${String(data.filename).replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}
