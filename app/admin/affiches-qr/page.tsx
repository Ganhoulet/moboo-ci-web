/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { img } from "@/lib/img";
import { qrSvg } from "@/lib/qr-svg";
import { getQrStats, searchQr, type QrListing, type QrRealtor } from "./actions";

export const dynamic = "force-dynamic";

function Thumb({ svg }: { svg: string }) {
  return <div className="h-16 w-16 shrink-0 rounded-md bg-white p-1 ring-1 ring-slate-200 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}

async function RealtorRow({ r }: { r: QrRealtor }) {
  const svg = await qrSvg(r.qrUrl);
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
      {r.photo ? <img src={img(r.photo, 160)} alt="" className="h-12 w-12 rounded-full object-cover" />
        : <span className="grid h-12 w-12 place-items-center rounded-full bg-[#0555CC] font-display text-lg font-black text-white">{r.name.charAt(0).toUpperCase()}</span>}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{r.name}</p>
        <p className="text-xs text-muted">
          <span className={"mr-1 rounded px-1.5 py-0.5 font-semibold " + (r.kind === "agency" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800")}>{r.label}</span>
          {r.phone || "sans téléphone"} · {r.listings} annonce{r.listings > 1 ? "s" : ""} en ligne{r.zone ? ` · ${r.zone}` : ""}
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{r.qrUrl}</p>
      </div>
      <Thumb svg={svg} />
      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-col">
        <Link href={`/admin/affiches-qr/imprimer?r=${encodeURIComponent(r.ref)}&l=`} className="rounded-md bg-[#0555CC] px-3 py-1.5 text-center text-xs font-bold text-white hover:opacity-90">Affiche du profil</Link>
        <Link href={`/admin/affiches-qr/${encodeURIComponent(r.ref)}`} className="rounded-md bg-white px-3 py-1.5 text-center text-xs font-bold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Profil + annonces ({r.listings})</Link>
      </div>
    </li>
  );
}

async function ListingRow({ l }: { l: QrListing }) {
  const svg = await qrSvg(l.qrUrl);
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
      {l.photo ? <img src={img(l.photo, 200)} alt="" className="h-14 w-20 rounded object-cover" /> : <span className="h-14 w-20 rounded bg-slate-100" />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{l.title}</p>
        <p className="text-xs text-muted">{l.price || "Prix non renseigné"}{l.zone ? ` · ${l.zone}` : ""}{l.owner ? ` · ${l.owner}` : ""}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{l.qrUrl}</p>
      </div>
      <Thumb svg={svg} />
      <Link href={`/admin/affiches-qr/imprimer?l=${encodeURIComponent(l.ref)}`} className="rounded-md bg-black px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">Affiche de l’annonce</Link>
    </li>
  );
}

/** Back-office → Marketing → Affiches QR : les QR codes de l'application, à imprimer pour les agents, agences et annonces. */
export default async function QrPosters({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const type = searchParams.type === "realtors" || searchParams.type === "listings" ? searchParams.type : "all";
  const [stats, res] = await Promise.all([getQrStats(), searchQr(q, type)]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Affiches QR</h1>
        <p className="max-w-3xl text-sm text-muted">
          Les QR codes de l’application Moboo.ci, identiques à ceux que les agents impriment eux-mêmes : affiche bleue « Scannez et trouvez mes annonces » pour chaque agent et agence, fiche noir et blanc pour chaque annonce.
          Imprimez-les en <strong>A3, A4 ou A5</strong> et déposez-les dans leurs agences, boutiques et vitrines : le client scanne et tombe sur le profil ou l’annonce.
        </p>
        {stats ? <p className="mt-2 text-sm font-semibold text-ink">{stats.realtors} agents, agences et annonceurs · {stats.listings} annonces en ligne</p> : null}
      </div>

      <form className="flex flex-wrap gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200" action="/admin/affiches-qr">
        <input name="q" defaultValue={q} placeholder="Nom de l’agent ou de l’agence, téléphone, titre d’annonce, numéro…" autoFocus
          className="min-w-[16rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select name="type" defaultValue={type} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
          <option value="all">Tout</option>
          <option value="realtors">Agents et agences</option>
          <option value="listings">Annonces</option>
        </select>
        <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Rechercher</button>
      </form>

      {!res ? <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Recherche indisponible.</p> : (
        <>
          {type !== "listings" ? (
            <section>
              <h2 className="mb-2 font-display text-lg font-bold text-ink">Agents et agences {q ? "" : "— les plus actifs"}</h2>
              {res.realtors.length ? <ul className="space-y-2">{res.realtors.map((r) => <RealtorRow key={r.ref} r={r} />)}</ul>
                : <p className="text-sm text-muted">Aucun agent ni agence pour « {q} ».</p>}
            </section>
          ) : null}
          {type !== "realtors" ? (
            <section>
              <h2 className="mb-2 font-display text-lg font-bold text-ink">Annonces {q ? "" : "— les plus récentes"}</h2>
              {res.listings.length ? <ul className="space-y-2">{res.listings.map((l) => <ListingRow key={l.ref} l={l} />)}</ul>
                : <p className="text-sm text-muted">Aucune annonce pour « {q} ».</p>}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
