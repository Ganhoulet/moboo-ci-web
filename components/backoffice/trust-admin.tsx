"use client";

import { useState, useTransition } from "react";
import { diasporaStatusAction, inspectionAction } from "@/app/admin/publicite/confiance/actions";

type Insp = {
  id: string; listingId: string; status: string; price: number; visitDate: string | null; contactPhone: string | null; note: string | null; adminNote: string | null; createdAt: string;
  listing: { title: string; commune: string | null; quartier: string | null; city: string; address: string | null; contactPhone: string | null } | null;
  account: { phone: string; firstName: string | null; lastName: string | null; companyName: string | null } | null;
};
type Dia = { id: string; name: string; phone: string; email: string | null; country: string | null; project: string; pack: string | null; budget: number | null; commune: string | null; wantsVideo: boolean; message: string | null; status: string; createdAt: string };

const ST: Record<string, [string, string]> = { pending: ["À planifier", "bg-amber-100 text-amber-800"], scheduled: ["Planifiée", "bg-sky-100 text-sky-800"], done: ["Vérifié", "bg-emerald-100 text-emerald-800"], rejected: ["Refusée", "bg-slate-100 text-slate-600"] };
const PROJECT: Record<string, string> = { buy: "Achat", build: "Construction", rent: "Location", manage: "Gestion" };
const DST: [string, string][] = [["new", "Nouvelle"], ["contacted", "Contactée"], ["in_progress", "En cours"], ["done", "Conclue"], ["lost", "Perdue"]];

/** Back-office : visites de vérification et demandes diaspora. */
export function TrustAdmin({ data }: { data: { inspections: Insp[]; diaspora: Dia[] } }) {
  const [tab, setTab] = useState<"insp" | "dia">("insp");
  const [pending, start] = useTransition();
  const todo = data.inspections.filter((i) => i.status === "pending" || i.status === "scheduled").length;
  const box = "rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200";
  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        <button type="button" onClick={() => setTab("insp")} className={"rounded-full px-3 py-1 font-semibold " + (tab === "insp" ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Visites de vérification ({todo} à faire)</button>
        <button type="button" onClick={() => setTab("dia")} className={"rounded-full px-3 py-1 font-semibold " + (tab === "dia" ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Diaspora ({data.diaspora.filter((d) => d.status === "new").length} nouvelles)</button>
      </div>
      {tab === "insp" ? (
        <div className={box}>
          <ul className="divide-y divide-slate-100 text-sm">
            {data.inspections.map((i) => (
              <li key={i.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink"><a href={`/annonce/${i.listingId}`} target="_blank" className="hover:underline">{i.listing?.title ?? "Annonce"}</a></p>
                  <p className="text-xs text-muted">{[i.listing?.address, i.listing?.quartier, i.listing?.commune, i.listing?.city].filter(Boolean).join(", ")} · demandé le {new Date(i.createdAt).toLocaleDateString("fr-FR")}{i.visitDate ? ` · souhaité le ${i.visitDate}` : ""} · {i.price.toLocaleString("fr-FR")} F</p>
                  <p className="text-xs text-muted">Annonceur : {i.account?.companyName || [i.account?.firstName, i.account?.lastName].filter(Boolean).join(" ")} · <a href={`tel:${i.contactPhone || i.account?.phone}`} className="text-brand-800">{i.contactPhone || i.account?.phone}</a>{i.note ? ` · « ${i.note} »` : ""}</p>
                  {i.adminNote ? <p className="text-xs text-ink">Note : {i.adminNote}</p> : null}
                </div>
                <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (ST[i.status]?.[1] ?? "")}>{ST[i.status]?.[0] ?? i.status}</span>
                {i.status === "pending" || i.status === "scheduled" ? (
                  <span className="flex flex-wrap gap-1">
                    <button type="button" disabled={pending} onClick={() => { const d = window.prompt("Date de la visite (ex. 2026-11-08 10h)"); if (d) start(async () => { await inspectionAction(i.id, "schedule", { visitDate: d }); }); }} className="rounded bg-white px-2 py-0.5 text-xs font-semibold ring-1 ring-slate-300">Planifier</button>
                    <button type="button" disabled={pending} onClick={() => { if (window.confirm("Le bien existe et correspond à l’annonce ? Le badge sera affiché.")) start(async () => { await inspectionAction(i.id, "done", { note: window.prompt("Note interne (facultatif)") ?? "" }); }); }} className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">Vérifié ✓</button>
                    <button type="button" disabled={pending} onClick={() => { const note = window.prompt("Motif (envoyé à l’annonceur, crédits rendus)"); if (note) start(async () => { await inspectionAction(i.id, "reject", { note }); }); }} className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Refuser</button>
                  </span>
                ) : null}
              </li>
            ))}
            {!data.inspections.length ? <li className="py-3 text-muted">Aucune demande de vérification pour le moment.</li> : null}
          </ul>
        </div>
      ) : (
        <div className={box}>
          <ul className="divide-y divide-slate-100 text-sm">
            {data.diaspora.map((d) => (
              <li key={d.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{d.name} · <a href={`tel:${d.phone}`} className="text-brand-800">{d.phone}</a>{d.email ? ` · ${d.email}` : ""}</p>
                  <p className="text-xs text-muted">{PROJECT[d.project] ?? d.project}{d.pack ? ` · ${d.pack}` : ""}{d.country ? ` · vit en ${d.country}` : ""}{d.commune ? ` · ${d.commune}` : ""}{d.budget ? ` · ${d.budget.toLocaleString("fr-FR")} F` : ""}{d.wantsVideo ? " · visites vidéo" : ""} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                  {d.message ? <p className="text-ink">{d.message}</p> : null}
                </div>
                <a href={`https://wa.me/${d.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="rounded bg-[#25D366] px-2 py-1 text-xs font-semibold text-white">WhatsApp</a>
                <select defaultValue={d.status} disabled={pending} onChange={(e) => { const v = e.target.value; start(async () => { await diasporaStatusAction(d.id, v); }); }} className="rounded border border-slate-300 px-1 py-0.5 text-xs" aria-label="Statut">{DST.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              </li>
            ))}
            {!data.diaspora.length ? <li className="py-3 text-muted">Aucune demande pour le moment. Partagez la page /diaspora (groupes WhatsApp de la diaspora, Facebook, TikTok).</li> : null}
          </ul>
        </div>
      )}
    </div>
  );
}
