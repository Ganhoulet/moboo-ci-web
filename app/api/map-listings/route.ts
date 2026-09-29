import { NextResponse } from "next/server";
import { listListingsPage } from "@/lib/property";
import { toMarker } from "@/lib/map-markers";

/** Biens d'une zone de carte (demi-carte des résultats), mêmes filtres que la liste. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const g = (k: string) => u.searchParams.get(k) || undefined;
  const tx = g("transaction");
  const res = await listListingsPage({
    transaction: tx === "rent" || tx === "sale" ? tx : undefined,
    q: g("q"), priceMin: Number(g("priceMin")) || undefined, priceMax: Number(g("priceMax")) || undefined,
    propertyType: g("propertyType"), sort: g("sort"), bbox: g("bbox"), perPage: 300, listingKind: "classic", map: true,
  });
  return NextResponse.json(res.items.map(toMarker).filter(Boolean), { headers: { "Cache-Control": "no-store" } });
}
