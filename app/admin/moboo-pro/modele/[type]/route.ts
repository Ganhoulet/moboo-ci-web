import { NextResponse } from "next/server";
import { authedFetch } from "@/lib/server-api";

export const dynamic = "force-dynamic";

/** Modèle CSV pour importer des biens ou des locataires. */
export async function GET(_req: Request, { params }: { params: { type: string } }) {
  const { ok, data } = await authedFetch(`/site/admin/pro-agences/modele/${encodeURIComponent(params.type)}`, { method: "GET" });
  if (!ok || typeof data?.csv !== "string") return new NextResponse("Modèle indisponible.", { status: 400 });
  return new NextResponse(data.csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${String(data.filename).replace(/[^\w.-]/g, "_")}"` },
  });
}
