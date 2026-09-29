"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAdminListingAction } from "@/app/admin/immobilier/actions";

const STATUSES = [
  { value: "ACTIVE", label: "En ligne" }, { value: "DISABLED", label: "Masquée" },
  { value: "SOLD", label: "Vendue" }, { value: "RENTED", label: "Louée" },
];
const day = (d: Date) => d.toISOString().slice(0, 10);

/** Réglages réservés au back-office : statut, vedette, étiquettes, expiration, annonceur. */
export function AdminListingExtras({ id, initial, labels }: {
  id: string;
  initial: { status: string; featured: boolean; labels: string[]; expiresAt: string | null; ownerPhone: string | null; ownerName: string | null };
  labels: { slug: string; label: string; color: string | null }[];
}) {
  const router = useRouter();
  const [v, setV] = useState({ ...initial, expiresAt: initial.expiresAt ? initial.expiresAt.slice(0, 10) : "", ownerPhone: initial.ownerPhone ?? "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (p: Partial<typeof v>) => { setMsg(null); setV((x) => ({ ...x, ...p })); };
  const plus = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); set({ expiresAt: day(d) }); };

  const save = () => start(async () => {
    const r = await saveAdminListingAction(id, {
      status: v.status, featured: v.featured, labels: v.labels,
      expiresAt: v.expiresAt ? new Date(`${v.expiresAt}T23:59:59`).toISOString() : null,
      ownerPhone: v.ownerPhone.trim(),
    });
    setMsg(r.ok ? { ok: true, text: "Réglages de l’annonce enregistrés." } : { ok: false, text: r.error ?? "Enregistrement impossible." });
    if (r.ok) router.refresh();
  });

  const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <h2 className="font-display text-lg font-bold text-ink">Réglages du back-office</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <span className={label}>Statut</span>
          <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-slate-300 text-sm font-semibold">
            {STATUSES.map((s, i) => (
              <button key={s.value} type="button" onClick={() => set({ status: s.value })}
                className={(i ? "border-l border-slate-300 " : "") + "px-3 py-2 " + (v.status === s.value ? "bg-brand-700 text-white" : "bg-white text-ink hover:bg-slate-50")}>{s.label}</button>
            ))}
          </div>
        </div>
        <div>
          <span className={label}>En vedette</span>
          <div className="inline-flex overflow-hidden rounded-md border border-slate-300 text-sm font-semibold">
            <button type="button" onClick={() => set({ featured: true })} className={"px-4 py-2 " + (v.featured ? "bg-amber-500 text-white" : "bg-white")}>★ Oui</button>
            <button type="button" onClick={() => set({ featured: false })} className={"border-l border-slate-300 px-4 py-2 " + (!v.featured ? "bg-slate-600 text-white" : "bg-white")}>Non</button>
          </div>
          <p className="mt-1 text-xs text-muted">Affichée en tête des listes du site, avec un badge.</p>
        </div>
        <div className="md:col-span-2">
          <span className={label}>Étiquettes (5 max)</span>
          <div className="flex flex-wrap gap-2">
            {labels.map((l) => {
              const on = v.labels.includes(l.slug);
              return (
                <button key={l.slug} type="button" onClick={() => set({ labels: on ? v.labels.filter((x) => x !== l.slug) : [...v.labels, l.slug].slice(0, 5) })}
                  className={"rounded-full border px-3 py-1 text-sm font-semibold transition " + (on ? "border-transparent text-white" : "border-slate-300 bg-white text-ink")}
                  style={on ? { background: l.color ?? "#334155" } : undefined}>
                  {on ? "✓ " : ""}{l.label}
                </button>
              );
            })}
            {!labels.length ? <p className="text-sm text-muted">Aucune étiquette : créez-en dans Immobilier → Étiquettes.</p> : null}
          </div>
        </div>
        <div>
          <span className={label}>Expire le</span>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className="input w-44 py-2" value={v.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} />
            {[30, 60, 90].map((n) => <button key={n} type="button" onClick={() => plus(n)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50">+{n} j</button>)}
            <button type="button" onClick={() => set({ expiresAt: "" })} className="text-xs font-semibold text-slate-500 hover:underline">Jamais</button>
          </div>
          <p className="mt-1 text-xs text-muted">Après cette date, l’annonce disparaît du site (elle reste ici).</p>
        </div>
        <div>
          <span className={label}>Annonceur (compte du site)</span>
          <input className="input py-2" type="tel" placeholder="Numéro du compte, ex. 07 07 12 34 56" value={v.ownerPhone} onChange={(e) => set({ ownerPhone: e.target.value })} />
          <p className="mt-1 text-xs text-muted">{initial.ownerName ? `Actuellement : ${initial.ownerName}. ` : "Aucun compte rattaché. "}Le compte retrouve l’annonce, ses statistiques et ses messages. Vide : détacher.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
          {pending ? "Enregistrement…" : "Enregistrer ces réglages"}
        </button>
        {msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </div>
    </section>
  );
}
