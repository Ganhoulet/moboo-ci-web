"use client";

import { useState, useTransition } from "react";
import { COMMUNES } from "@/lib/accounts";
import { uploadImageAction } from "@/app/mon-espace/actions";
import { cancelServiceAdAction, createServiceAdAction, saveProviderAction, setLeadStatusAction } from "@/app/mon-espace/publicite-services/actions";

export type Provider = {
  id: string; slug: string; name: string; category: string; tagline: string | null; description: string | null; logoUrl: string | null; coverUrl: string | null;
  phone: string | null; whatsapp: string | null; email: string | null; website: string | null; zones: string[]; status: string; reviewNote: string | null;
  views: number; calls: number; whatsapps: number; leadsCount: number;
};
export type Ad = {
  id: string; providerId: string; title: string; text: string | null; status: string; pricing: string; unitPrice: number; budget: number; spent: number;
  days: number; endsAt: string | null; impressions: number; clicks: number; leads: number; zones: string[]; audiences: string[]; reviewNote: string | null;
};
export type Lead = { id: string; providerId: string; name: string; phone: string; need: string; commune: string | null; wantedDate: string | null; status: string; createdAt: string };
type Opts = { enabled: boolean; prices: { day: number; click: number; lead: number }; review: boolean; categories: string[] };
type Result = { ok: boolean; error?: string; data?: any };

export const STATUS: Record<string, [string, string]> = {
  pending: ["En attente de validation", "bg-amber-100 text-amber-800"], approved: ["Validée", "bg-emerald-100 text-emerald-800"],
  rejected: ["Refusée", "bg-red-100 text-red-800"], suspended: ["Suspendue", "bg-slate-200 text-slate-700"],
  active: ["En ligne", "bg-emerald-100 text-emerald-800"], paused: ["En pause", "bg-slate-200 text-slate-700"], ended: ["Terminée", "bg-slate-100 text-slate-600"],
};
const AUDIENCES: [string, string][] = [["rent", "À louer"], ["sale", "À vendre"], ["furnished", "Meublés"], ["event", "Espaces"]];
const PRICING: [string, string][] = [["day", "Par jour"], ["click", "Par clic"], ["lead", "Par demande reçue"]];
const LEAD_STATUS: [string, string][] = [["new", "Nouvelle"], ["contacted", "Contactée"], ["done", "Traitée"], ["spam", "Indésirable"]];
const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const n = (v: number) => v.toLocaleString("fr-FR");

/** Compresse une image (1600 px max, JPEG ~75 %) → data URI. */
async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.75);
  } finally { URL.revokeObjectURL(url); }
}

function ImagePick({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="block cursor-pointer text-sm">
      <span className="font-semibold text-ink">{label}</span>
      <span className="mt-1 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="h-14 w-20 rounded-lg object-cover ring-1 ring-slate-200" /> : <span className="grid h-14 w-20 place-items-center rounded-lg bg-slate-100 text-xs text-muted">Aucune</span>}
        <span className="font-semibold text-brand-800">{busy ? "Envoi…" : value ? "Changer" : "Ajouter"}</span>
      </span>
      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        setBusy(true);
        try { const r = await uploadImageAction(await compress(f), "annonce"); if (r.ok && r.url) onChange(r.url); } finally { setBusy(false); }
      }} />
    </label>
  );
}

/** Fiche prestataire (création ou modification). */
export function ProviderForm({ initial, categories, onSave, team = false }: { initial?: Partial<Provider>; categories: string[]; onSave: (v: Record<string, unknown>) => Promise<Result>; team?: boolean }) {
  const [v, setV] = useState({
    name: initial?.name ?? "", category: initial?.category ?? categories[0] ?? "", tagline: initial?.tagline ?? "", description: initial?.description ?? "",
    phone: initial?.phone ?? "", whatsapp: initial?.whatsapp ?? "", email: initial?.email ?? "", website: initial?.website ?? "",
    zones: (initial?.zones ?? []).join(", "), logoUrl: initial?.logoUrl ?? "", coverUrl: initial?.coverUrl ?? "", accountPhone: "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v, x: string) => setV((s) => ({ ...s, [k]: x }));
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const { accountPhone, ...rest } = v;
        const r = await onSave({ ...rest, zones: v.zones.split(",").map((z) => z.trim()).filter(Boolean), ...(team && accountPhone ? { accountPhone } : {}) });
        setMsg(r.ok ? { ok: true, text: "Enregistré." } : { ok: false, text: r.error ?? "Erreur." });
      });
    }}>
      <input required value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Nom de l’entreprise" className={field} />
      <select value={v.category} onChange={(e) => set("category", e.target.value)} className={field} aria-label="Catégorie">
        {[...new Set([...categories, v.category].filter(Boolean))].map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input value={v.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Accroche (ex. Déménagement soigné, devis en 24 h)" className={field + " sm:col-span-2"} />
      <textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Présentation, services, garanties, tarifs indicatifs…" className={field + " sm:col-span-2"} />
      <input value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Téléphone" inputMode="tel" className={field} />
      <input value={v.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="WhatsApp (si différent)" inputMode="tel" className={field} />
      <input value={v.email} onChange={(e) => set("email", e.target.value)} placeholder="E-mail" inputMode="email" className={field} />
      <input value={v.website} onChange={(e) => set("website", e.target.value)} placeholder="Site web (https://…)" className={field} />
      <input value={v.zones} onChange={(e) => set("zones", e.target.value)} list="sa-communes" placeholder="Zones servies : Cocody, Marcory, Yopougon…" className={field + " sm:col-span-2"} />
      <datalist id="sa-communes">{COMMUNES.map((c) => <option key={c} value={c} />)}</datalist>
      <ImagePick label="Logo" value={v.logoUrl} onChange={(u) => set("logoUrl", u)} />
      <ImagePick label="Image de couverture" value={v.coverUrl} onChange={(u) => set("coverUrl", u)} />
      {team ? <input value={v.accountPhone} onChange={(e) => set("accountPhone", e.target.value)} placeholder="Téléphone du compte annonceur (facultatif)" className={field + " sm:col-span-2"} /> : null}
      <div className="flex items-center gap-3 sm:col-span-2">
        <button disabled={pending} className="rounded-lg bg-brand-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer la fiche"}</button>
        {msg ? <span className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-700")}>{msg.text}</span> : null}
      </div>
    </form>
  );
}

/** Nouvelle campagne : texte, ciblage, mode de paiement, durée et budget. */
export function AdForm({ providers, prices, onCreate, team = false }: { providers: Provider[]; prices: Opts["prices"]; onCreate: (v: Record<string, unknown>) => Promise<Result>; team?: boolean }) {
  const ok = providers.filter((p) => team || p.status === "approved");
  const [v, setV] = useState({ providerId: ok[0]?.id ?? "", title: "", text: "", ctaLabel: "Demander un devis", imageUrl: "", zones: "", audiences: [] as string[], pricing: "day", days: 30, budget: 10000 });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const unit = prices[v.pricing as keyof typeof prices] ?? 0;
  const cost = v.pricing === "day" ? unit * v.days : Math.max(unit * 10, v.budget);
  if (!ok.length) return <p className="text-sm text-muted">Votre fiche prestataire doit d’abord être validée par l’équipe Moboo.</p>;
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await onCreate({ ...v, zones: v.zones.split(",").map((z) => z.trim()).filter(Boolean) });
        setMsg(r.ok ? { ok: true, text: team ? "Campagne en ligne." : "Campagne envoyée : elle sera en ligne après validation." } : { ok: false, text: r.error ?? "Erreur." });
      });
    }}>
      <select value={v.providerId} onChange={(e) => setV({ ...v, providerId: e.target.value })} className={field} aria-label="Prestataire">
        {ok.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <input value={v.ctaLabel} onChange={(e) => setV({ ...v, ctaLabel: e.target.value })} maxLength={30} placeholder="Bouton (ex. Demander un devis)" className={field} />
      <input required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} maxLength={60} placeholder="Titre (ex. Déménagez sans stress dès 50 000 F)" className={field + " sm:col-span-2"} />
      <input value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} maxLength={140} placeholder="Texte court (140 caractères)" className={field + " sm:col-span-2"} />
      <ImagePick label="Image de la carte" value={v.imageUrl} onChange={(u) => setV({ ...v, imageUrl: u })} />
      <input value={v.zones} onChange={(e) => setV({ ...v, zones: e.target.value })} list="sa-communes" placeholder="Communes ciblées (vide : partout)" className={field + " self-end"} />
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold text-ink">Afficher dans les recherches (aucune case : toutes)</p>
        <div className="mt-1 flex flex-wrap gap-3 text-sm">
          {AUDIENCES.map(([k, l]) => (
            <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={v.audiences.includes(k)} onChange={(e) => setV({ ...v, audiences: e.target.checked ? [...v.audiences, k] : v.audiences.filter((x) => x !== k) })} /> {l}</label>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold text-ink">Paiement</p>
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {PRICING.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setV({ ...v, pricing: k })}
              className={"rounded-lg p-2 text-left text-sm ring-1 " + (v.pricing === k ? "bg-brand-50 ring-brand-700" : "ring-slate-300")}>
              <span className="block font-bold text-ink">{l}</span>
              <span className="text-xs text-muted">{n(prices[k as keyof typeof prices])} FCFA {k === "day" ? "/ jour" : k === "click" ? "/ clic" : "/ demande"}</span>
            </button>
          ))}
        </div>
      </div>
      <label className="text-sm">Durée (jours)<input type="number" min={1} max={90} value={v.days} onChange={(e) => setV({ ...v, days: Number(e.target.value) || 1 })} className={field + " mt-1"} /></label>
      {v.pricing !== "day" ? (
        <label className="text-sm">Budget maximum (FCFA)<input type="number" min={unit * 10} step={1000} value={v.budget} onChange={(e) => setV({ ...v, budget: Number(e.target.value) || 0 })} className={field + " mt-1"} /></label>
      ) : <span />}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button disabled={pending || !v.title} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {pending ? "Envoi…" : team ? "Mettre en ligne (offert)" : `Payer ${n(cost)} FCFA en crédits`}
        </button>
        {!team && v.pricing !== "day" ? <span className="text-xs text-muted">Le budget non dépensé vous est rendu en crédits à la fin.</span> : null}
        {msg ? <span className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-700")}>{msg.text}</span> : null}
      </div>
    </form>
  );
}

export function AdsTable({ ads, providers, actions }: { ads: Ad[]; providers: Provider[]; actions: (a: Ad) => React.ReactNode }) {
  if (!ads.length) return <p className="text-sm text-muted">Aucune campagne.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2">Campagne</th><th>État</th><th>Résultats</th><th>Budget</th><th /></tr></thead>
        <tbody>
          {ads.map((a) => (
            <tr key={a.id} className="border-t border-slate-100 align-top">
              <td className="py-2"><span className="font-semibold text-ink">{a.title}</span><br /><span className="text-xs text-muted">{providers.find((p) => p.id === a.providerId)?.name} · {PRICING.find(([k]) => k === a.pricing)?.[1]} · {a.days} j{a.endsAt ? ` · jusqu’au ${new Date(a.endsAt).toLocaleDateString("fr-FR")}` : ""}</span></td>
              <td><span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (STATUS[a.status]?.[1] ?? "")}>{STATUS[a.status]?.[0] ?? a.status}</span>{a.reviewNote ? <p className="mt-1 text-xs text-muted">{a.reviewNote}</p> : null}</td>
              <td className="text-xs">{n(a.impressions)} affichages · <b>{n(a.clicks)}</b> clics · <b>{n(a.leads)}</b> demandes</td>
              <td className="text-xs">{a.pricing === "day" ? `${n(a.budget)} F` : `${n(a.spent)} / ${n(a.budget)} F`}</td>
              <td className="text-right">{actions(a)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadsList({ leads, providers, onStatus }: { leads: Lead[]; providers: Provider[]; onStatus: (id: string, s: string) => Promise<Result> }) {
  const [, start] = useTransition();
  if (!leads.length) return <p className="text-sm text-muted">Aucune demande pour le moment.</p>;
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {leads.map((l) => (
        <li key={l.id} className="flex flex-wrap items-start gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{l.name} · <a href={`tel:${l.phone}`} className="text-brand-800">{l.phone}</a></p>
            <p className="text-ink">{l.need}</p>
            <p className="text-xs text-muted">{providers.find((p) => p.id === l.providerId)?.name} · {new Date(l.createdAt).toLocaleString("fr-FR")}{l.commune ? ` · ${l.commune}` : ""}{l.wantedDate ? ` · pour le ${new Date(l.wantedDate).toLocaleDateString("fr-FR")}` : ""}</p>
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

/** Espace annonceur : fiches, campagnes, demandes. */
export function ServiceAdsManager({ data }: { data: { options: Opts; balance: number; providers: Provider[]; ads: Ad[]; leads: Lead[] } }) {
  const [editing, setEditing] = useState<string | "new" | null>(data.providers.length ? null : "new");
  const [, start] = useTransition();
  const box = "rounded-2xl bg-white p-5 shadow-card";
  return (
    <div className="space-y-5">
      <section className={box}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-ink">Mes fiches prestataire</h2>
          {editing !== "new" ? <button type="button" onClick={() => setEditing("new")} className="text-sm font-semibold text-brand-800">+ Nouvelle fiche</button> : null}
        </div>
        <ul className="mt-3 space-y-2">
          {data.providers.map((p) => (
            <li key={p.id} className="rounded-xl ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="font-semibold text-ink">{p.name}</span><span className="text-muted">{p.category}</span>
                <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (STATUS[p.status]?.[1] ?? "")}>{STATUS[p.status]?.[0] ?? p.status}</span>
                <span className="text-xs text-muted">{n(p.views)} visites · {n(p.calls)} appels · {n(p.whatsapps)} WhatsApp · {n(p.leadsCount)} demandes</span>
                {p.status === "approved" ? <a href={`/prestataires/${p.slug}`} target="_blank" className="text-xs font-semibold text-brand-800 underline">Voir ma page</a> : null}
                <button type="button" onClick={() => setEditing(editing === p.id ? null : p.id)} className="ml-auto text-xs font-semibold text-brand-800">{editing === p.id ? "Fermer" : "Modifier"}</button>
              </div>
              {p.reviewNote && p.status === "rejected" ? <p className="px-3 pb-2 text-xs text-red-700">{p.reviewNote}</p> : null}
              {editing === p.id ? <div className="border-t border-slate-100 p-3"><ProviderForm initial={p} categories={data.options.categories} onSave={(v) => saveProviderAction(v, p.id)} /></div> : null}
            </li>
          ))}
        </ul>
        {editing === "new" ? <div className="mt-3 rounded-xl bg-slate-50 p-3"><ProviderForm categories={data.options.categories} onSave={(v) => saveProviderAction(v)} /></div> : null}
        {data.options.review ? <p className="mt-2 text-xs text-muted">Chaque fiche est vérifiée par l’équipe Moboo avant d’être publiée.</p> : null}
      </section>

      <section className={box}>
        <h2 className="mb-3 font-bold text-ink">Nouvelle campagne</h2>
        <AdForm providers={data.providers} prices={data.options.prices} onCreate={createServiceAdAction} />
      </section>

      <section className={box}>
        <h2 className="mb-3 font-bold text-ink">Mes campagnes</h2>
        <AdsTable ads={data.ads} providers={data.providers} actions={(a) => ["pending", "active", "paused"].includes(a.status) ? (
          <button type="button" className="text-xs font-semibold text-red-700" onClick={() => { if (window.confirm(a.status === "pending" ? "Annuler ? Les crédits vous sont rendus." : "Arrêter la campagne ? Le budget non dépensé vous est rendu.")) start(async () => { await cancelServiceAdAction(a.id); }); }}>
            {a.status === "pending" ? "Annuler" : "Arrêter"}
          </button>
        ) : null} />
      </section>

      <section className={box}>
        <h2 className="mb-3 font-bold text-ink">Demandes reçues ({data.leads.length})</h2>
        <LeadsList leads={data.leads} providers={data.providers} onStatus={setLeadStatusAction} />
      </section>
    </div>
  );
}
