"use client";

import { useState, useTransition } from "react";
import { COMMUNES } from "@/lib/accounts";
import { uploadImageAction } from "@/app/mon-espace/actions";
import { programLeadStatusAction, saveProgramAction } from "@/app/admin/publicite/programmes/actions";
import { KIND_LABEL } from "@/lib/programs";

type Unit = { label: string; rooms: number | null; surface: number | null; price: number | null; available: boolean };
type Program = {
  id: string; slug: string; name: string; developer: string; developerLogo: string | null; kind: string; city: string; commune: string; address: string | null;
  priceFrom: number | null; priceTo: number | null; units: Unit[]; delivery: string | null; progress: string | null; legalStatus: string | null; verified: boolean;
  paymentPlan: string | null; description: string | null; highlights: string[]; coverUrl: string | null; photos: string[]; videoUrl: string | null; brochureUrl: string | null;
  phone: string | null; whatsapp: string | null; featured: boolean; sponsorUntil: string | null; status: string; views: number; leadsCount: number; accountPhone: string | null;
};
type Lead = { id: string; programId: string; name: string; phone: string; email: string | null; residence: string; country: string | null; budget: number | null; unit: string | null; visit: boolean; message: string | null; status: string; createdAt: string };

const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const STATUS: Record<string, string> = { draft: "Brouillon", published: "En ligne", archived: "Archivé" };
export const LEAD_STATUS: [string, string][] = [["new", "Nouveau"], ["contacted", "Contacté"], ["visit", "Visite"], ["sold", "Vendu"], ["lost", "Perdu"]];

async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.78);
  } finally { URL.revokeObjectURL(url); }
}
const upload = async (f: File) => { const r = await uploadImageAction(await compress(f), "annonce"); return r.ok ? r.url! : null; };

function ProgramForm({ p, onDone }: { p?: Program; onDone: () => void }) {
  const [v, setV] = useState({
    name: p?.name ?? "", developer: p?.developer ?? "", developerLogo: p?.developerLogo ?? "", kind: p?.kind ?? "appartements", city: p?.city ?? "Abidjan", commune: p?.commune ?? "", address: p?.address ?? "",
    priceFrom: p?.priceFrom ? String(p.priceFrom) : "", priceTo: p?.priceTo ? String(p.priceTo) : "", delivery: p?.delivery ?? "", progress: p?.progress ?? "", legalStatus: p?.legalStatus ?? "",
    verified: p?.verified ?? false, paymentPlan: p?.paymentPlan ?? "", description: p?.description ?? "", highlights: (p?.highlights ?? []).join("\n"), coverUrl: p?.coverUrl ?? "",
    photos: p?.photos ?? [], videoUrl: p?.videoUrl ?? "", brochureUrl: p?.brochureUrl ?? "", phone: p?.phone ?? "", whatsapp: p?.whatsapp ?? "", featured: p?.featured ?? false,
    sponsorUntil: p?.sponsorUntil ? p.sponsorUntil.slice(0, 10) : "", status: p?.status ?? "draft", accountPhone: p?.accountPhone ?? "",
  });
  const [units, setUnits] = useState<Unit[]>(p?.units?.length ? p.units : [{ label: "", rooms: null, surface: null, price: null, available: true }]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, x: unknown) => setV((s) => ({ ...s, [k]: x }));
  const num = (s: string) => Number(s.replace(/\D/g, "")) || null;
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await saveProgramAction({ ...v, priceFrom: num(v.priceFrom), priceTo: num(v.priceTo), highlights: v.highlights, units: units.filter((u) => u.label.trim()) }, p?.id);
        setMsg(r.ok ? { ok: true, text: `Enregistré${v.status === "published" ? ` : /programmes-neufs/${r.slug}` : " (brouillon)"}.` } : { ok: false, text: r.error ?? "Erreur." });
        if (r.ok && !p) onDone();
      });
    }}>
      <input required value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Nom du programme (ex. Résidence Les Palmiers)" className={field} />
      <input required value={v.developer} onChange={(e) => set("developer", e.target.value)} placeholder="Promoteur" className={field} />
      <select value={v.kind} onChange={(e) => set("kind", e.target.value)} className={field} aria-label="Type">{Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <input value={v.commune} onChange={(e) => set("commune", e.target.value)} list="pg-communes" placeholder="Commune" className={field} />
      <input value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="Ville" className={field} />
      <input value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="Adresse / repère" className={field} />
      <datalist id="pg-communes">{COMMUNES.map((c) => <option key={c} value={c} />)}</datalist>
      <input value={v.priceFrom} onChange={(e) => set("priceFrom", e.target.value)} inputMode="numeric" placeholder="Prix à partir de (FCFA)" className={field} />
      <input value={v.priceTo} onChange={(e) => set("priceTo", e.target.value)} inputMode="numeric" placeholder="Prix jusqu’à (FCFA)" className={field} />
      <input value={v.delivery} onChange={(e) => set("delivery", e.target.value)} placeholder="Livraison (ex. T4 2027)" className={field} />
      <input value={v.progress} onChange={(e) => set("progress", e.target.value)} placeholder="Avancement (ex. Gros œuvre terminé)" className={field} />
      <input value={v.legalStatus} onChange={(e) => set("legalStatus", e.target.value)} placeholder="Statut foncier (ex. Titre foncier, ACD)" className={field} />
      <label className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><input type="checkbox" checked={v.verified} onChange={(e) => set("verified", e.target.checked)} /> Documents vérifiés par Moboo</label>
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold text-ink">Lots</p>
        {units.map((u, i) => (
          <div key={i} className="mt-1 grid grid-cols-[2fr_1fr_1fr_1.4fr_auto_auto] items-center gap-1">
            <input value={u.label} onChange={(e) => setUnits(units.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Ex. 3 pièces" className={field} />
            <input value={u.rooms ?? ""} onChange={(e) => setUnits(units.map((x, j) => j === i ? { ...x, rooms: num(e.target.value) } : x))} placeholder="Pièces" className={field} />
            <input value={u.surface ?? ""} onChange={(e) => setUnits(units.map((x, j) => j === i ? { ...x, surface: num(e.target.value) } : x))} placeholder="m²" className={field} />
            <input value={u.price ?? ""} onChange={(e) => setUnits(units.map((x, j) => j === i ? { ...x, price: num(e.target.value) } : x))} placeholder="Prix" className={field} />
            <label className="text-xs"><input type="checkbox" checked={u.available} onChange={(e) => setUnits(units.map((x, j) => j === i ? { ...x, available: e.target.checked } : x))} /> dispo</label>
            <button type="button" onClick={() => setUnits(units.filter((_, j) => j !== i))} className="px-1 text-red-700" aria-label="Retirer">×</button>
          </div>
        ))}
        <button type="button" onClick={() => setUnits([...units, { label: "", rooms: null, surface: null, price: null, available: true }])} className="mt-1 text-sm font-semibold text-brand-800">+ Ajouter un lot</button>
      </div>
      <textarea value={v.paymentPlan} onChange={(e) => set("paymentPlan", e.target.value)} rows={2} placeholder="Plan de paiement (ex. 30 % à la réservation, solde sur 24 mois)" className={field + " sm:col-span-2"} />
      <textarea value={v.highlights} onChange={(e) => set("highlights", e.target.value)} rows={3} placeholder={"Points forts, un par ligne (piscine, gardiennage 24 h/24, 10 min de l’aéroport…)"} className={field + " sm:col-span-2"} />
      <textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="Description du programme" className={field + " sm:col-span-2"} />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 text-sm">
        <label className="cursor-pointer font-semibold text-brand-800">{v.coverUrl ? "Changer la photo principale" : "+ Photo principale"}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); const u = await upload(f); setBusy(false); if (u) set("coverUrl", u); }} /></label>
        <label className="cursor-pointer font-semibold text-brand-800">+ Photos ({v.photos.length})<input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { const fs = Array.from(e.target.files ?? []); setBusy(true); const out: string[] = []; for (const f of fs) { const u = await upload(f); if (u) out.push(u); } setBusy(false); set("photos", [...v.photos, ...out].slice(0, 30)); }} /></label>
        <label className="cursor-pointer font-semibold text-brand-800">{v.developerLogo ? "Changer le logo" : "+ Logo du promoteur"}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); const u = await upload(f); setBusy(false); if (u) set("developerLogo", u); }} /></label>
        {busy ? <span className="text-muted">Envoi…</span> : null}
        {v.photos.length ? <button type="button" onClick={() => set("photos", [])} className="text-red-700">Retirer les photos</button> : null}
      </div>
      <input value={v.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="Lien vidéo (YouTube, TikTok…)" className={field} />
      <input value={v.brochureUrl} onChange={(e) => set("brochureUrl", e.target.value)} placeholder="Lien de la brochure (https://…)" className={field} />
      <input value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Téléphone du promoteur" inputMode="tel" className={field} />
      <input value={v.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="WhatsApp du promoteur" inputMode="tel" className={field} />
      <input value={v.accountPhone} onChange={(e) => set("accountPhone", e.target.value)} placeholder="Téléphone du compte du promoteur (voit ses contacts)" className={field} />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1.5 font-semibold"><input type="checkbox" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} /> Mis en avant</label>
        {v.featured ? <label className="flex items-center gap-1">jusqu’au <input type="date" value={v.sponsorUntil} onChange={(e) => set("sponsorUntil", e.target.value)} className="rounded border border-slate-300 px-1 py-0.5" /></label> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <select value={v.status} onChange={(e) => set("status", e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" aria-label="État">{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <button disabled={pending || busy} className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer le programme"}</button>
        {msg ? <span className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-700")}>{msg.text}</span> : null}
      </div>
    </form>
  );
}

export function LeadsTable({ leads, programs, onStatus }: { leads: Lead[]; programs: { id: string; name: string }[]; onStatus: (id: string, s: string) => Promise<{ ok: boolean }> }) {
  const [, start] = useTransition();
  if (!leads.length) return <p className="text-sm text-muted">Aucun contact pour le moment.</p>;
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {leads.map((l) => (
        <li key={l.id} className="flex flex-wrap items-start gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{l.name} · <a href={`tel:${l.phone}`} className="text-brand-800">{l.phone}</a>{l.email ? ` · ${l.email}` : ""}</p>
            <p className="text-xs text-muted">{programs.find((p) => p.id === l.programId)?.name} · {new Date(l.createdAt).toLocaleString("fr-FR")}{l.residence === "diaspora" ? ` · Diaspora${l.country ? ` (${l.country})` : ""}` : ""}{l.unit ? ` · ${l.unit}` : ""}{l.budget ? ` · budget ${l.budget.toLocaleString("fr-FR")} F` : ""}{l.visit ? " · souhaite visiter" : ""}</p>
            {l.message ? <p className="text-ink">{l.message}</p> : null}
          </div>
          <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="rounded bg-[#25D366] px-2 py-1 text-xs font-semibold text-white">WhatsApp</a>
          <select defaultValue={l.status} onChange={(e) => start(async () => { await onStatus(l.id, e.target.value); })} className="rounded border border-slate-300 px-1 py-0.5 text-xs" aria-label="Statut">
            {LEAD_STATUS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </li>
      ))}
    </ul>
  );
}

/** Back-office : fiches programmes et contacts reçus. */
export function ProgramsAdmin({ data }: { data: { programs: Program[]; leads: Lead[] } }) {
  const [tab, setTab] = useState<"programs" | "leads">("programs");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const box = "rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200";
  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        <button type="button" onClick={() => setTab("programs")} className={"rounded-full px-3 py-1 font-semibold " + (tab === "programs" ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Programmes ({data.programs.length})</button>
        <button type="button" onClick={() => setTab("leads")} className={"rounded-full px-3 py-1 font-semibold " + (tab === "leads" ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Contacts ({data.leads.length})</button>
      </div>
      {tab === "programs" ? (
        <div className={box}>
          <div className="mb-3 flex justify-between"><h2 className="font-bold text-ink">Programmes</h2><button type="button" onClick={() => setEditing(editing === "new" ? null : "new")} className="text-sm font-semibold text-brand-800">+ Nouveau programme</button></div>
          {editing === "new" ? <div className="mb-4 rounded-lg bg-slate-50 p-3"><ProgramForm onDone={() => setEditing(null)} /></div> : null}
          <ul className="space-y-2">
            {data.programs.map((p) => (
              <li key={p.id} className="rounded-lg ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <span className="font-semibold text-ink">{p.name}</span><span className="text-muted">{p.developer} · {p.commune}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{STATUS[p.status] ?? p.status}</span>
                  {p.featured ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Mis en avant{p.sponsorUntil ? ` → ${new Date(p.sponsorUntil).toLocaleDateString("fr-FR")}` : ""}</span> : null}
                  {p.verified ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Vérifié</span> : null}
                  <span className="text-xs text-muted">{p.views} vues · {p.leadsCount} contacts</span>
                  {p.status === "published" ? <a href={`/programmes-neufs/${p.slug}`} target="_blank" className="text-xs font-semibold text-brand-800 underline">Voir</a> : null}
                  <button type="button" onClick={() => setEditing(editing === p.id ? null : p.id)} className="ml-auto text-xs font-semibold text-brand-800">{editing === p.id ? "Fermer" : "Modifier"}</button>
                </div>
                {editing === p.id ? <div className="border-t border-slate-100 p-3"><ProgramForm p={p} onDone={() => setEditing(null)} /></div> : null}
              </li>
            ))}
            {!data.programs.length ? <li className="text-sm text-muted">Aucun programme. Créez le premier pour un promoteur.</li> : null}
          </ul>
        </div>
      ) : (
        <div className={box}><LeadsTable leads={data.leads} programs={data.programs} onStatus={programLeadStatusAction} /></div>
      )}
    </div>
  );
}
