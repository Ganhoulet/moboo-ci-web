"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportLeadAction, unlockLeadAction } from "@/app/mon-espace/bourse/actions";

type Lead = {
  id: string; name: string; purpose: string; propType: string; city: string; commune: string; quartier: string | null; budgetMax: number | null; bedrooms: number | null;
  moveDate: string | null; message: string; urgent: boolean; price: number; left: number; createdAt: string; myZone?: boolean;
};
type Unlocked = Lead & { phone: string; email: string | null; purchaseId: string; paid: number; boughtAt: string; reported: boolean; refunded: boolean; closed: boolean };
type Data = { balance: number; communes: string[]; open: Lead[]; unlocked: Unlocked[] };

const PURPOSE: Record<string, string> = { rent: "Location", buy: "Achat", furnished: "Meublé / séjour" };
const n = (v: number) => v.toLocaleString("fr-FR");
const ago = (d: string) => { const h = Math.round((Date.now() - new Date(d).getTime()) / 3_600_000); return h < 1 ? "à l’instant" : h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`; };

/** Liste des demandes (coordonnées masquées) et contacts débloqués. */
export function LeadMarket({ data, commune, purpose }: { data: Data; commune: string; purpose: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const filter = (k: string, v: string) => { const p = new URLSearchParams({ ...(commune ? { commune } : {}), ...(purpose ? { purpose } : {}), [k]: v }); if (!v) p.delete(k); router.push(`/mon-espace/bourse?${p}`); };
  const unlock = (l: Lead) => {
    if (l.price > data.balance) return setMsg({ ok: false, text: `Solde insuffisant (${n(data.balance)} F) : rechargez vos crédits.` });
    if (!window.confirm(`Débloquer ce contact pour ${n(l.price)} F ?`)) return;
    start(async () => { const r = await unlockLeadAction(l.id); setMsg(r.ok ? { ok: true, text: "Contact débloqué : appelez vite !" } : { ok: false, text: r.error! }); });
  };
  const report = (u: Unlocked) => {
    const reason = window.prompt("Quel est le problème ? (faux numéro, ne répond pas, déjà trouvé…)");
    if (!reason) return;
    start(async () => { const r = await reportLeadAction(u.purchaseId, reason); setMsg(r.ok ? { ok: true, text: r.refunded ? "Signalé et remboursé." : "Signalé : l’équipe Moboo vérifie et vous rembourse si c’est confirmé." } : { ok: false, text: r.error! }); });
  };
  const chip = (on: boolean) => "rounded-full px-3 py-1 text-sm font-semibold " + (on ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-900">Solde : {n(data.balance)} F</span>
        {[["", "Tout"], ["rent", "Location"], ["buy", "Achat"], ["furnished", "Meublé"]].map(([k, l]) => <button key={k} type="button" onClick={() => filter("purpose", k)} className={chip(purpose === k)}>{l}</button>)}
        <select value={commune} onChange={(e) => filter("commune", e.target.value)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm" aria-label="Commune">
          <option value="">Toutes les communes</option>{data.communes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {msg ? <p className={"rounded-xl p-3 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>{msg.text}</p> : null}

      {data.unlocked.length ? (
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="font-bold text-ink">Mes contacts débloqués ({data.unlocked.length})</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {data.unlocked.map((u) => (
              <li key={u.id} className="flex flex-wrap items-start gap-3 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{u.name} · {PURPOSE[u.purpose]} {u.propType} à {u.commune}{u.quartier ? ` (${u.quartier})` : ""}{u.budgetMax ? ` · ≤ ${n(u.budgetMax)} F` : ""}</p>
                  {u.message ? <p className="text-ink">{u.message}</p> : null}
                  <p className="text-xs text-muted">Débloqué {ago(u.boughtAt)} · {n(u.paid)} F{u.closed ? " · le client a fermé sa demande" : ""}{u.refunded ? " · remboursé" : u.reported ? " · signalé, en vérification" : ""}</p>
                </div>
                <a href={`tel:${u.phone}`} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white">📞 {u.phone}</a>
                <a href={`https://wa.me/${u.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${u.name.split(" ")[0]}, j’ai vu votre recherche sur Moboo.ci (${u.propType} à ${u.commune}). J’ai des biens à vous proposer.`)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white">WhatsApp</a>
                {!u.reported ? <button type="button" disabled={pending} onClick={() => report(u)} className="text-xs font-semibold text-red-700">Signaler</button> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-bold text-ink">Demandes disponibles ({data.open.length})</h2>
        {!data.open.length ? <p className="rounded-2xl bg-white p-6 text-sm text-muted shadow-card">Aucune demande pour ces critères pour le moment. Vous êtes prévenu dès qu’une demande arrive dans votre commune.</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.open.map((l) => (
            <article key={l.id} className={"flex flex-col rounded-2xl bg-white p-4 shadow-card ring-1 " + (l.urgent ? "ring-red-200" : "ring-slate-200")}>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase">
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-900">{PURPOSE[l.purpose]}</span>
                {l.urgent ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">Urgent</span> : null}
                {l.myZone ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">Ma zone</span> : null}
                <span className="ml-auto font-semibold normal-case text-muted">{ago(l.createdAt)}</span>
              </div>
              <p className="mt-2 font-display text-lg font-extrabold leading-tight text-ink">{l.propType || "Bien"} à {l.commune}</p>
              <p className="text-sm text-muted">{[l.quartier, l.budgetMax ? `≤ ${n(l.budgetMax)} F` : null, l.bedrooms ? `${l.bedrooms}+ ch.` : null, l.moveDate ? `pour le ${new Date(l.moveDate).toLocaleDateString("fr-FR")}` : null].filter(Boolean).join(" · ")}</p>
              {l.message ? <p className="mt-2 line-clamp-3 text-sm text-ink">« {l.message} »</p> : null}
              <p className="mt-2 text-xs text-muted">{l.name} · ☎ •• •• •• •• ·· · {l.left} place(s) restante(s)</p>
              <button type="button" disabled={pending} onClick={() => unlock(l)} className="mt-auto pt-3">
                <span className="block w-full rounded-xl bg-accent-600 py-2.5 text-sm font-bold text-white hover:bg-accent-700">Débloquer le contact · {n(l.price)} F</span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
