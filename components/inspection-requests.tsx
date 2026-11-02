"use client";

import { useState, useTransition } from "react";
import { requestInspectionAction } from "@/app/mon-espace/bien-verifie/actions";

type Row = { id: string; title: string; place: string; photo: string | null; inspectedUntil: string | null; request: { status: string; visitDate: string | null; adminNote: string | null } | null };
type Data = { options: { enabled: boolean; price: number; days: number }; balance: number; listings: Row[] };

const STATUS: Record<string, [string, string]> = {
  pending: ["Demande reçue", "bg-amber-100 text-amber-800"], scheduled: ["Visite planifiée", "bg-sky-100 text-sky-800"],
  done: ["Vérifié", "bg-emerald-100 text-emerald-800"], rejected: ["Non réalisée (remboursée)", "bg-slate-100 text-slate-600"],
};
const n = (v: number) => v.toLocaleString("fr-FR");

/** Liste des biens de l'annonceur avec leur état de vérification ; demande en un clic. */
export function InspectionRequests({ data }: { data: Data }) {
  const [open, setOpen] = useState<string | null>(null);
  const [f, setF] = useState({ visitDate: "", contactPhone: "", note: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (!data.listings.length) return <p className="rounded-2xl bg-white p-6 text-sm text-muted shadow-card">Publiez d’abord une annonce pour la faire vérifier.</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink">Prix : <b>{n(data.options.price)} F</b> par bien · badge valable {data.options.days} jours · solde : <b>{n(data.balance)} F</b></p>
      {msg ? <p className={"rounded-xl p-3 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>{msg.text}</p> : null}
      <ul className="space-y-2">
        {data.listings.map((l) => {
          const valid = l.inspectedUntil && new Date(l.inspectedUntil) > new Date();
          const st = l.request && !(l.request.status === "done" && !valid) ? l.request.status : null;
          return (
            <li key={l.id} className="rounded-2xl bg-white p-3 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.photo ? <img src={l.photo} alt="" className="h-14 w-20 rounded-lg object-cover" /> : <span className="h-14 w-20 rounded-lg bg-slate-100" />}
                <span className="min-w-0 flex-1"><b className="block truncate text-ink">{l.title}</b><span className="text-xs text-muted">{l.place}</span></span>
                {valid ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">✓ Vérifié jusqu’au {new Date(l.inspectedUntil!).toLocaleDateString("fr-FR")}</span>
                  : st && st !== "rejected" ? <span className={"rounded-full px-2.5 py-1 text-xs font-bold " + STATUS[st][1]}>{STATUS[st][0]}{l.request?.visitDate ? ` · ${l.request.visitDate}` : ""}</span>
                  : <button type="button" onClick={() => setOpen(open === l.id ? null : l.id)} className="rounded-xl bg-brand-800 px-3 py-2 text-xs font-bold text-white">Faire vérifier · {n(data.options.price)} F</button>}
              </div>
              {l.request?.status === "rejected" && l.request.adminNote ? <p className="mt-2 text-xs text-muted">Dernière demande : {l.request.adminNote}</p> : null}
              {open === l.id ? (
                <form className="mt-3 grid gap-2 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await requestInspectionAction({ listingId: l.id, ...f }); setMsg(r.ok ? { ok: true, text: "Demande envoyée : l’équipe Moboo vous appelle pour fixer la visite." } : { ok: false, text: r.error! }); if (r.ok) setOpen(null); }); }}>
                  <input type="date" value={f.visitDate} onChange={(e) => setF({ ...f, visitDate: e.target.value })} aria-label="Date souhaitée" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input value={f.contactPhone} onChange={(e) => setF({ ...f, contactPhone: e.target.value })} placeholder="Téléphone sur place (facultatif)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Accès, gardien, horaires…" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <button disabled={pending} className="rounded-lg bg-accent-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50 sm:col-span-3">{pending ? "Envoi…" : `Payer ${n(data.options.price)} F en crédits et demander la visite`}</button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
