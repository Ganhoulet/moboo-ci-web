/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { img } from "@/lib/img";
import { getQrRealtor } from "../actions";

export const dynamic = "force-dynamic";

/** Un agent / une agence : affiche du profil + une affiche par annonce en ligne, à cocher puis imprimer. */
export default async function QrRealtorPage({ params }: { params: { ref: string } }) {
  const d = await getQrRealtor(decodeURIComponent(params.ref));
  if (!d) notFound();
  const { realtor: r, listings } = d;
  return (
    <div className="space-y-5">
      <Link href="/admin/affiches-qr" className="text-sm font-semibold text-brand-700 hover:underline">← Affiches QR</Link>
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-[#0555CC] p-5 text-white">
        {r.photo ? <img src={img(r.photo, 200)} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-white/20" />
          : <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 font-display text-2xl font-black">{r.name.charAt(0).toUpperCase()}</span>}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{r.label}</p>
          <h1 className="font-display text-2xl font-extrabold">{r.name}</h1>
          <p className="text-sm text-white/80">{r.phone || "sans téléphone"} · {listings.length} annonce{listings.length > 1 ? "s" : ""} en ligne · <span className="font-mono">{r.qrUrl}</span></p>
        </div>
        <a href={r.landing} target="_blank" rel="noopener noreferrer" className="rounded-md bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25">Voir la page ↗</a>
      </div>

      <form action="/admin/affiches-qr/imprimer" className="space-y-3">
        <input type="hidden" name="r" value={r.ref} />
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" name="profil" value="1" defaultChecked className="h-4 w-4" /> Affiche du profil (« Scannez et trouvez {r.kind === "agency" ? "nos" : "mes"} annonces »)
          </label>
          <select name="f" defaultValue="A4" className="ml-auto rounded-md border border-slate-300 px-2 py-2 text-sm" aria-label="Format">
            <option value="A3">A3</option><option value="A4">A4</option><option value="A5">A5</option>
          </select>
          <button className="rounded-md bg-[#FE6600] px-4 py-2 text-sm font-bold text-white hover:opacity-90">Préparer l’impression</button>
        </div>
        {listings.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {listings.map((l) => (
              <li key={l.ref}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 has-[:checked]:ring-2 has-[:checked]:ring-brand-600">
                  <input type="checkbox" name="l" value={l.ref} defaultChecked className="h-4 w-4" />
                  {l.photo ? <img src={img(l.photo, 160)} alt="" className="h-12 w-16 rounded object-cover" /> : <span className="h-12 w-16 rounded bg-slate-100" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{l.title}</span>
                    <span className="block text-xs text-muted">{l.price || "—"}{l.zone ? ` · ${l.zone}` : ""}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">Aucune annonce en ligne : seule l’affiche du profil est disponible.</p>}
        <input type="hidden" name="l" value="" />
      </form>
    </div>
  );
}
