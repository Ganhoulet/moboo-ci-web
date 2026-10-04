import Link from "next/link";
import { Poster, type PaperFormat, type PosterData } from "@/components/backoffice/qr-poster";
import { QrPrintToolbar } from "@/components/backoffice/qr-print-toolbar";
import { qrSvg } from "@/lib/qr-svg";
import { getQrRealtor, searchQr, type QrListing, type QrRealtor } from "../actions";

export const dynamic = "force-dynamic";

const list = (v?: string | string[]) => (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);

/** Impression des affiches QR (mêmes rendus que les PDF de l'application). r = agent / agence, l = annonces, profil = affiche du profil. */
export default async function PrintQr({ searchParams }: { searchParams: { r?: string; l?: string | string[]; profil?: string; f?: string } }) {
  const f: PaperFormat = searchParams.f === "A3" || searchParams.f === "A5" ? searchParams.f : "A4";
  const wanted = list(searchParams.l);
  let realtor: QrRealtor | null = null;
  let listings: QrListing[] = [];
  if (searchParams.r) {
    const d = await getQrRealtor(searchParams.r);
    if (d) {
      realtor = d.realtor;
      listings = wanted.includes("all") ? d.listings : d.listings.filter((l) => wanted.includes(l.ref));
    }
  } else {
    for (const id of wanted.slice(0, 50)) {
      const d = await searchQr(id, "listings");
      const hit = d?.listings.find((l) => l.ref === id);
      if (hit) listings.push(hit);
    }
  }
  // Lien « Affiche du profil » (aucune annonce demandée) ou case « profil » cochée.
  const withProfile = !!realtor && (searchParams.profil === "1" || (searchParams.profil === undefined && wanted.length === 0));
  const posters: PosterData[] = [];
  if (realtor && withProfile) posters.push({ kind: realtor.kind, title: realtor.name, phone: realtor.phone, url: realtor.qrUrl, qrSvg: await qrSvg(realtor.qrUrl) });
  for (const l of listings) posters.push({ kind: "listing", title: l.title, price: l.price, url: l.qrUrl, qrSvg: await qrSvg(l.qrUrl) });

  return (
    <div>
      <div className="qr-toolbar mb-3 text-sm">
        <Link href={realtor ? `/admin/affiches-qr/${encodeURIComponent(realtor.ref)}` : "/admin/affiches-qr"} className="font-semibold text-brand-700 hover:underline">← Affiches QR</Link>
      </div>
      {posters.length ? (
        <QrPrintToolbar count={posters.length} initial={f}>
          {posters.map((p, i) => <Poster key={i} d={p} />)}
        </QrPrintToolbar>
      ) : (
        <p className="rounded-lg bg-white p-6 text-sm text-muted ring-1 ring-slate-200">Aucune affiche sélectionnée.</p>
      )}
    </div>
  );
}
