import Link from "next/link";
import { Poster, type PaperFormat, type PosterData } from "@/components/backoffice/qr-poster";
import { QrPrintToolbar } from "@/components/backoffice/qr-print-toolbar";
import { qrSvg } from "@/lib/qr-svg";
import { getQrBatch, getQrRealtor, getSeoPoster, placementUrls, searchQr, seoCodeAction, type QrListing, type QrRealtor } from "../actions";

export const dynamic = "force-dynamic";

type SP = { r?: string | string[]; l?: string | string[]; seo?: string | string[]; profil?: string; f?: string; lot?: string; annonces?: string; emplacement?: string };
type Item = ({ type: "realtor" } & QrRealtor) | ({ type: "listing" } & QrListing);

const list = (v?: string | string[]) => (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);

/** Affiches demandées : un agent / une agence (et ses annonces cochées), un lot, ou des annonces seules. */
async function itemsFor(sp: SP): Promise<{ items: Item[]; back: string; truncated?: boolean }> {
  if (sp.lot === "1") {
    const d = await getQrBatch(list(sp.r), list(sp.l), sp.annonces === "1");
    return { items: d?.posters ?? [], back: "/admin/affiches-qr", truncated: d?.truncated };
  }
  const single = list(sp.r)[0];
  const wanted = list(sp.l);
  if (single) {
    const d = await getQrRealtor(single);
    if (!d) return { items: [], back: "/admin/affiches-qr" };
    // Lien « Affiche du profil » (aucune annonce demandée) ou case « profil » cochée.
    const withProfile = sp.profil === "1" || (sp.profil === undefined && wanted.length === 0);
    const ls = wanted.includes("all") ? d.listings : d.listings.filter((l) => wanted.includes(l.ref));
    return { items: [...(withProfile ? [{ type: "realtor" as const, ...d.realtor }] : []), ...ls.map((l) => ({ type: "listing" as const, ...l }))], back: `/admin/affiches-qr/${encodeURIComponent(d.realtor.ref)}` };
  }
  const items: Item[] = [];
  for (const id of wanted.slice(0, 50)) {
    const hit = (await searchQr(id, "listings"))?.listings.find((l) => l.ref === id);
    if (hit) items.push({ type: "listing", ...hit });
  }
  return { items, back: "/admin/affiches-qr" };
}

/** Champ « Emplacement » : recharge la page avec les mêmes affiches et un code par affiche pour compter les scans. */
function PlacementForm({ sp, value, note }: { sp: SP; value: string; note: string }) {
  const hidden: [string, string][] = [];
  for (const [k, v] of Object.entries(sp)) if (k !== "emplacement" && v !== undefined) for (const x of Array.isArray(v) ? v : [v]) hidden.push([k, x]);
  return (
    <form action="/admin/affiches-qr/imprimer" className="qr-toolbar mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
      {hidden.map(([k, v], i) => <input key={i} type="hidden" name={k} value={v} />)}
      <label className="text-sm font-semibold text-ink" htmlFor="emplacement">Emplacement</label>
      <input id="emplacement" name="emplacement" defaultValue={value} maxLength={120} placeholder="Ex. Agence de Cocody, vitrine · Carrefour Siporex"
        className="min-w-[16rem] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
      <button className="rounded-md bg-[#0555CC] px-3 py-1.5 text-sm font-bold text-white hover:opacity-90">Appliquer</button>
      <p className="w-full text-xs text-muted">{note}</p>
    </form>
  );
}

/** Impression des affiches QR : agents, agences, annonces (rendus de l'application) et pages SEO (affiches de rue). */
export default async function PrintQr({ searchParams: sp }: { searchParams: SP }) {
  const f: PaperFormat = sp.f === "A3" || sp.f === "A5" ? sp.f : "A4";
  const placement = String(sp.emplacement ?? "").trim().slice(0, 120);
  const posters: PosterData[] = [];
  let back = "/admin/affiches-qr";
  let truncated = false;

  if (sp.lot === "seo") {
    // Affiches des pages SEO (modèle par défaut), une par page, code par emplacement.
    back = "/admin/affiches-qr/seo";
    for (const id of list(sp.seo).slice(0, 100)) {
      const d = await getSeoPoster(id);
      if (!d) continue;
      const c = await seoCodeAction(id, placement, d.defaults);
      if (c.ok && c.url && c.svg) posters.push({ kind: "seo", t: d.defaults, url: c.url, qrSvg: c.svg });
    }
  } else {
    const r = await itemsFor(sp);
    back = r.back;
    truncated = !!r.truncated;
    // Avec un emplacement : lien de l'application + &s=<code> (scans comptés pour cet endroit).
    const urls = placement
      ? await placementUrls(placement, r.items.map((it) => ({ kind: it.type === "realtor" ? it.kind : "listing", ref: it.ref, appId: it.appId, label: it.type === "realtor" ? it.name : it.title })))
      : {};
    for (const it of r.items) {
      const url = urls[`${it.type === "realtor" ? it.kind : "listing"}:${it.ref}`] ?? it.qrUrl;
      posters.push(it.type === "realtor"
        ? { kind: it.kind, title: it.name, phone: it.phone, url, qrSvg: await qrSvg(url) }
        : { kind: "listing", title: it.title, price: it.price, url, qrSvg: await qrSvg(url) });
    }
  }

  return (
    <div>
      <div className="qr-toolbar mb-3 text-sm">
        <Link href={back} className="font-semibold text-brand-700 hover:underline">← Retour</Link>
        {truncated ? <p className="mt-2 rounded-md bg-amber-50 p-2 text-amber-800 ring-1 ring-amber-200">Plus de 300 affiches : seules les 300 premières sont préparées. Imprimez le reste en un second lot.</p> : null}
      </div>
      <PlacementForm sp={sp} value={placement}
        note={placement
          ? `Ces affiches ont un QR code propre à « ${placement} » : leurs scans sont comptés pour cet emplacement (Marketing terrain → Scans QR).`
          : "Indiquez où les affiches seront posées : chaque emplacement reçoit son propre QR code et ses scans sont comptés à part. Sans emplacement, les scans sont comptés sans lieu."} />
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
