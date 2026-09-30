"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkDecideAction, decideListingAction, handleReportAction } from "@/app/admin/backoffice-actions";
import { formatXOF } from "@/lib/api";
import { Pill, TYPE_LABEL, ago, fmtDate, fmtDateTime } from "./ui";

type Decision = "approve" | "reject" | "changes";
const QUALITY = { good: "bg-emerald-500", ok: "bg-amber-500", bad: "bg-red-500" } as const;

/** File de modération : une carte par annonce, décision en un clic, sélection groupée. */
export function ModerationQueue({ items, reasons, state }: { items: any[]; reasons: string[]; state: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<string[]>([]);
  const [open, setOpen] = useState<{ id: string; decision: Exclude<Decision, "approve"> } | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const decide = (ids: string[], decision: Decision, text?: string) => start(async () => {
    const r = ids.length === 1 ? await decideListingAction(ids[0], decision, text) : await bulkDecideAction(ids, decision, text);
    const n = ids.length === 1 ? 1 : (r.data as any)?.done ?? 0;
    setMsg(r.ok ? { ok: true, text: `${n} annonce(s) : ${decision === "approve" ? "validée(s)" : decision === "reject" ? "refusée(s)" : "corrections demandées"}.` } : { ok: false, text: r.error ?? "Décision impossible." });
    if (r.ok) { setSel([]); setOpen(null); setNote(""); router.refresh(); }
  });

  if (!items.length) return <p className="rounded-lg bg-white p-8 text-center text-sm text-muted ring-1 ring-slate-200">Rien à traiter ici. 🎉</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={sel.length === items.length} onChange={(e) => setSel(e.target.checked ? items.map((i) => i.id) : [])} />
          Tout sélectionner
        </label>
        {sel.length ? (
          <>
            <span className="text-muted">· {sel.length} sélectionnée(s)</span>
            {state !== "approved" ? <button type="button" disabled={pending} onClick={() => decide(sel, "approve")} className="rounded-md bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700">Valider la sélection</button> : null}
          </>
        ) : null}
        {msg ? <span className={"ml-auto font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
      </div>

      {items.map((l) => (
        <article key={l.id} className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 p-4 lg:flex-row">
            <div className="flex shrink-0 gap-3 lg:w-64 lg:flex-col">
              <input type="checkbox" aria-label="Sélectionner" className="self-start" checked={sel.includes(l.id)} onChange={(e) => setSel(e.target.checked ? [...sel, l.id] : sel.filter((x) => x !== l.id))} />
              <div className="grid flex-1 grid-cols-3 gap-1">
                {l.photos.length ? l.photos.slice(0, 6).map((p: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={p + i} href={p} target="_blank" rel="noopener" className={"block overflow-hidden rounded bg-slate-100 " + (i === 0 ? "col-span-3 aspect-[4/3]" : "aspect-square")}><img src={p} alt="" className="h-full w-full object-cover" /></a>
                )) : <span className="col-span-3 grid aspect-[4/3] place-items-center rounded bg-slate-100 text-xs text-muted">Aucune photo</span>}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/admin/immobilier/${l.id}`} className="font-display text-lg font-bold text-ink hover:underline">{l.title}</Link>
                  <p className="text-sm text-muted">
                    <strong className="text-brand-800">{formatXOF(l.price)}</strong>{l.priceUnit === "month" ? " / mois" : ""} · {l.transaction === "rent" ? "Location" : "Vente"} · {l.propertyType} · {[l.quartier, l.commune, l.city].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Pill s={l.moderation} />
                  {l.awaitingPayment ? <Pill s="open" label="Paiement en attente" /> : null}
                  {l.reports ? <Pill s="banned" label={`${l.reports} signalement(s)`} /> : null}
                </div>
              </div>

              {l.description ? <p className="line-clamp-3 text-sm text-slate-600">{l.description}</p> : null}

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2" title={l.quality.tips.join("\n")}>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Qualité</span>
                  <span className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full ${QUALITY[l.quality.level as keyof typeof QUALITY]}`} style={{ width: `${l.quality.score}%` }} /></span>
                  <strong>{l.quality.score}/100</strong>
                </span>
                <span className="text-xs text-muted">{l.photoCount} photo(s) · soumise {ago(l.submittedAt)}</span>
              </div>

              {l.flags.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {l.flags.map((f: string) => <li key={f} className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">⚠ {f}</li>)}
                </ul>
              ) : <p className="text-xs font-medium text-emerald-700">✓ Aucun signal d’alerte</p>}
              {l.quality.tips.length ? <p className="text-xs text-muted">À améliorer : {l.quality.tips.join(" · ")}</p> : null}
              {l.duplicates.length ? (
                <p className="text-xs text-slate-600">Doublons possibles : {l.duplicates.map((d: any, i: number) => (
                  <span key={d.id}>{i ? ", " : ""}<Link href={`/admin/immobilier/${d.id}`} className="text-brand-800 hover:underline">{d.title}</Link>{d.sameOwner ? " (même annonceur)" : ""}</span>
                ))}</p>
              ) : null}
              {l.moderationNote ? <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">Dernière note : {l.moderationNote}{l.moderatedBy ? ` — ${l.moderatedBy}, ${fmtDateTime(l.moderatedAt)}` : ""}</p> : null}
            </div>

            <div className="shrink-0 space-y-3 lg:w-60">
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                {l.owner ? (
                  <>
                    <Link href={`/admin/utilisateurs/${l.owner.id}`} className="font-semibold text-ink hover:underline">{l.owner.name || l.owner.phone}</Link>
                    {l.owner.verified ? <span className="ml-1 text-sky-600" title="Vérifié">✔</span> : null}
                    <p className="text-xs text-muted">{TYPE_LABEL[l.owner.accountType] ?? l.owner.accountType} · inscrit le {fmtDate(l.owner.createdAt)}</p>
                    <p className="text-xs text-muted">{l.owner.approvedListings} annonce(s) déjà validée(s)</p>
                    {l.owner.status !== "active" ? <Pill s={l.owner.status} /> : null}
                  </>
                ) : <p className="text-xs text-muted">{l.contactName || "Annonce sans compte"} · {l.contactPhone || "—"}</p>}
              </div>
              {state !== "approved" ? (
                <div className="grid gap-1.5">
                  <button type="button" disabled={pending} onClick={() => decide([l.id], "approve")} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">✓ Valider et publier</button>
                  <button type="button" disabled={pending} onClick={() => { setOpen({ id: l.id, decision: "changes" }); setNote(""); }} className="rounded-md border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50">✎ Demander des corrections</button>
                  <button type="button" disabled={pending} onClick={() => { setOpen({ id: l.id, decision: "reject" }); setNote(""); }} className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">✕ Refuser</button>
                </div>
              ) : null}
            </div>
          </div>

          {open && open.id === l.id ? (
            <form className={`border-t p-4 ${open.decision === "reject" ? "border-red-100 bg-red-50/50" : "border-sky-100 bg-sky-50/50"}`}
              onSubmit={(e) => { e.preventDefault(); decide([l.id], open.decision, note); }}>
              <p className="text-sm font-semibold text-ink">{open.decision === "reject" ? "Motif du refus" : "Corrections à demander"} <span className="font-normal text-muted">(envoyé à l’annonceur)</span></p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {reasons.map((r) => (
                  <button type="button" key={r} onClick={() => setNote(note ? `${note}\n${r}` : r)} className="rounded-full bg-white px-2.5 py-1 text-xs ring-1 ring-slate-200 hover:ring-brand-400">+ {r}</button>
                ))}
              </div>
              <textarea required rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="input mt-2 text-sm" />
              <div className="mt-2 flex gap-2">
                <button disabled={pending} className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${open.decision === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-sky-700 hover:bg-sky-800"}`}>{open.decision === "reject" ? "Refuser l’annonce" : "Envoyer la demande"}</button>
                <button type="button" onClick={() => setOpen(null)} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-white">Annuler</button>
              </div>
            </form>
          ) : null}
        </article>
      ))}
    </div>
  );
}

/** Signalements : classer, résoudre, retirer l'annonce, suspendre le compte (via la fiche). */
export function ReportsList({ items, status }: { items: any[]; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const act = (id: string, input: Parameters<typeof handleReportAction>[1]) => start(async () => {
    const r = await handleReportAction(id, input);
    setMsg(r.ok ? { ok: true, text: `${(r.data as any)?.count ?? 1} signalement(s) traité(s).` } : { ok: false, text: r.error ?? "Traitement impossible." });
    if (r.ok) router.refresh();
  });
  if (!items.length) return <p className="rounded-lg bg-white p-8 text-center text-sm text-muted ring-1 ring-slate-200">Aucun signalement {status === "open" ? "à traiter" : "ici"}.</p>;
  return (
    <div className="space-y-2">
      {msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      {items.map((r) => (
        <article key={r.id} className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {r.target.photo ? <img src={r.target.photo} alt="" className="h-16 w-24 shrink-0 rounded object-cover" /> : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{r.target.kind === "listing" ? "Annonce" : "Compte"}</span>
              <Link href={r.target.kind === "listing" ? `/admin/immobilier/${r.target.id}` : `/admin/utilisateurs/${r.target.id}`} className="font-semibold text-ink hover:underline">{r.target.title}</Link>
              {r.target.kind === "listing" && r.target.moderation && r.target.moderation !== "approved" ? <> <Pill s={r.target.moderation} /></> : null}
            </p>
            <p className="mt-1 text-sm font-semibold text-red-700">{r.reasonLabel}{r.openOnTarget > 1 ? <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{r.openOnTarget} signalements ouverts</span> : null}</p>
            {r.details ? <p className="mt-1 whitespace-pre-line text-sm text-slate-600">« {r.details} »</p> : null}
            <p className="mt-1 text-xs text-muted">
              Par {r.reporter?.id ? <Link href={`/admin/utilisateurs/${r.reporter.id}`} className="hover:underline">{r.reporter.name}</Link> : r.reporter?.name ?? "un visiteur anonyme"}
              {r.reporterContact ? ` (${r.reporterContact})` : ""} · {fmtDateTime(r.createdAt)}
            </p>
            {r.status !== "open" ? <p className="mt-1 text-xs text-slate-600"><Pill s={r.status} /> {r.resolution ? `— ${r.resolution}` : ""} {r.handledBy ? `(${r.handledBy}, ${fmtDate(r.handledAt)})` : ""}</p> : null}
          </div>
          {r.status === "open" ? (
            <div className="grid shrink-0 gap-1.5 md:w-56">
              {r.target.kind === "listing" ? (
                <button type="button" disabled={pending} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  onClick={() => { const why = window.prompt("Motif (envoyé à l’annonceur si besoin) :", r.reasonLabel); if (why !== null) act(r.id, { status: "resolved", resolution: why, hideListing: true, allOnTarget: true }); }}>
                  Retirer l’annonce
                </button>
              ) : null}
              {r.target.kind === "account" || r.target.ownerId ? (
                <Link href={`/admin/utilisateurs/${r.target.kind === "account" ? r.target.id : r.target.ownerId}`} className="rounded-md border border-amber-300 px-3 py-2 text-center text-sm font-semibold text-amber-800 hover:bg-amber-50">Voir le compte (suspendre…)</Link>
              ) : null}
              <button type="button" disabled={pending} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => { const why = window.prompt("Pourquoi classer sans suite ?", "Vérifié : rien d’anormal"); if (why !== null) act(r.id, { status: "dismissed", resolution: why, allOnTarget: r.openOnTarget > 1 && window.confirm(`Classer aussi les ${r.openOnTarget - 1} autre(s) signalement(s) de cet élément ?`) }); }}>
                Classer sans suite
              </button>
              <button type="button" disabled={pending} className="text-xs font-semibold text-emerald-700 hover:underline"
                onClick={() => act(r.id, { status: "resolved", resolution: "Traité" })}>Marquer comme traité</button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
