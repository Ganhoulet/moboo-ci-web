"use client";

import { useRef, useState, useTransition } from "react";
import { addDeal, markListing, removeDeal } from "@/app/mon-espace/realisations/actions";
import { uploadImageAction } from "@/app/mon-espace/actions";

interface Deal { id: string; listingId: string | null; transaction: string; title: string; price: number; place: string; closedAt: string; photos: string[] }
interface Listing { id: string; title: string; transaction: string; price: number; status: string; place: string; photo: string | null }
interface Data { deals: Deal[]; listings: Listing[] }

const input = "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink";
const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} FCFA`;
const STATUS: Record<string, string> = { ACTIVE: "En ligne", DISABLED: "Masquée", DELETED: "Retirée du site", SOLD: "Vendu", RENTED: "Loué" };

async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, 1400 / Math.max(im.width, im.height));
    const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.84);
  } finally { URL.revokeObjectURL(url); }
}

/** Réalisations du pro : annonces à marquer vendues / louées + biens conclus hors du site. */
export function DealsManager({ initial }: { initial: Data }) {
  const [d, setD] = useState<Data>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [f, setF] = useState({ title: "", transaction: "sale", price: "", place: "", closedAt: new Date().toISOString().slice(0, 10), photos: [] as string[] });
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  const apply = (r: { ok: boolean; data?: any; error?: string }, text: string) => {
    if (r.ok) setD(r.data);
    setMsg(r.ok ? { ok: true, text } : { ok: false, text: r.error ?? "Erreur" });
  };
  const sold = d.deals.filter((x) => x.transaction === "sale").length;
  const listings = d.listings.filter((l) => !q || l.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[[d.deals.length, "Réalisations"], [sold, "Vendus"], [d.deals.length - sold, "Loués"]].map(([v, l]) => (
          <div key={l as string} className="rounded-2xl bg-white p-4 text-center shadow-card"><p className="font-display text-2xl font-extrabold text-ink">{v}</p><p className="text-xs font-semibold uppercase text-muted">{l}</p></div>
        ))}
      </div>
      {msg ? <p className={"rounded-xl px-4 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}

      <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">Mes réalisations ({d.deals.length})</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.deals.map((x) => (
            <article key={x.id} className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
              <div className="relative aspect-[4/3] bg-slate-100">
                {x.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={x.photos[0]} alt="" className="h-full w-full object-cover" />
                ) : null}
                <span className={"absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white " + (x.transaction === "sale" ? "bg-rose-600" : "bg-violet-600")}>{x.transaction === "sale" ? "Vendu" : "Loué"}</span>
                {x.photos.length > 1 ? <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{x.photos.length} photos</span> : null}
              </div>
              <div className="p-3">
                <p className="line-clamp-1 font-semibold text-ink">{x.title}</p>
                <p className="text-sm text-slate-600">{x.price ? fmt(x.price) : "Prix non affiché"}</p>
                <p className="text-xs text-muted">{x.place}{x.place ? " · " : ""}{new Date(x.closedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
                <button type="button" disabled={pending} onClick={() => { if (confirm("Retirer cette réalisation ?")) start(async () => apply(await removeDeal(x.id), "Réalisation retirée.")); }} className="mt-2 text-xs font-semibold text-red-600 hover:underline">Retirer</button>
              </div>
            </article>
          ))}
        </div>
        {!d.deals.length ? <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-muted">Aucune réalisation pour l’instant.</p> : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="font-display text-lg font-bold text-ink">Marquer une de mes annonces</h2><p className="text-sm text-muted">Annonces en ligne, masquées ou déjà retirées du site.</p></div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="w-48 rounded-full border border-slate-300 px-3 py-1.5 text-sm" />
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {listings.slice(0, 50).map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
              {l.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.photo} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
              ) : <span className="h-14 w-20 shrink-0 rounded-lg bg-slate-100" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{l.title}</p>
                <p className="text-xs text-muted">{fmt(l.price)} · {l.place || "—"} · {STATUS[l.status] ?? l.status}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={pending} onClick={() => start(async () => apply(await markListing(l.id, { transaction: "sale" }), "Marqué vendu."))} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">Vendu</button>
                <button type="button" disabled={pending} onClick={() => start(async () => apply(await markListing(l.id, { transaction: "rent" }), "Marqué loué."))} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">Loué</button>
              </div>
            </li>
          ))}
          {!listings.length ? <li className="py-4 text-center text-sm text-muted">Aucune annonce à marquer.</li> : null}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">Ajouter un bien conclu hors du site</h2>
        <p className="text-sm text-muted">Photos ou affiche du bien (6 maximum).</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2"><span className="font-semibold text-ink">Titre</span><input className={input + " mt-1"} value={f.title} placeholder="Villa 5 pièces avec piscine à Angré" onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          <div className="text-sm"><span className="font-semibold text-ink">Type</span>
            <div className="mt-1 flex gap-2">{[["sale", "Vendu"], ["rent", "Loué"]].map(([k, l]) => <button key={k} type="button" onClick={() => setF({ ...f, transaction: k })} className={"flex-1 rounded-xl px-3 py-2.5 font-semibold ring-1 " + (f.transaction === k ? "bg-ink text-white ring-ink" : "ring-slate-300")}>{l}</button>)}</div>
          </div>
          <label className="text-sm"><span className="font-semibold text-ink">{f.transaction === "sale" ? "Prix de vente (FCFA)" : "Loyer mensuel (FCFA)"}</span><input className={input + " mt-1"} inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/[^0-9]/g, "") })} /></label>
          <label className="text-sm"><span className="font-semibold text-ink">Quartier, commune</span><input className={input + " mt-1"} value={f.place} placeholder="Angré, Cocody" onChange={(e) => setF({ ...f, place: e.target.value })} /></label>
          <label className="text-sm"><span className="font-semibold text-ink">Date</span><input type="date" className={input + " mt-1"} value={f.closedAt} onChange={(e) => setF({ ...f, closedAt: e.target.value })} /></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {f.photos.map((p) => (
            <span key={p} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="h-16 w-20 rounded-lg object-cover" />
              <button type="button" onClick={() => setF({ ...f, photos: f.photos.filter((x) => x !== p) })} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-black text-xs text-white" aria-label="Retirer">×</button>
            </span>
          ))}
          {f.photos.length < 6 ? <button type="button" disabled={uploading} onClick={() => file.current?.click()} className="h-16 w-20 rounded-lg border-2 border-dashed border-slate-300 text-xs font-semibold text-muted hover:border-ink">{uploading ? "…" : "+ Photo"}</button> : null}
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={async (e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 6 - f.photos.length); e.target.value = "";
            setUploading(true);
            for (const x of files) {
              const r = await uploadImageAction(await shrink(x), "annonce");
              if (r.ok && r.url) setF((v) => ({ ...v, photos: [...v.photos, r.url!] })); else setMsg({ ok: false, text: r.error ?? "Envoi impossible." });
            }
            setUploading(false);
          }} />
        </div>
        <button type="button" disabled={pending || uploading || !f.title.trim()} onClick={() => start(async () => {
          const r = await addDeal({ ...f, price: Number(f.price) || 0 });
          apply(r, "Réalisation ajoutée à votre page.");
          if (r.ok) setF({ title: "", transaction: "sale", price: "", place: "", closedAt: new Date().toISOString().slice(0, 10), photos: [] });
        })} className="mt-4 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Ajouter</button>
      </section>
    </div>
  );
}
