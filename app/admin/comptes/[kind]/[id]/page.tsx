import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { ActivityForm, AssignControl, ChangeDates, DisputeReply, TaskCheck } from "@/components/backoffice/am-ui";
import { fcfa } from "@/lib/am";
import { RecoList } from "@/components/backoffice/am-reco";
import { AccessPanel } from "@/components/backoffice/am-access";
import { HostActivityPanel } from "@/components/backoffice/am-activity";
import { getAm } from "../../actions";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<string, string> = { call: "📞", whatsapp: "💬", email: "✉️", visit: "🏠", note: "📝", task: "⏰", booking: "🛎️", alert: "🔔", dispute: "⚖️" };
const OUTCOME: Record<string, string> = { joint: "Joint", sans_reponse: "Sans réponse", rappeler: "À rappeler", interesse: "Intéressé", pas_interesse: "Pas intéressé", confirme: "Réservation confirmée", refuse: "Réservation refusée", dates: "Dates changées", alerte: "Alerte", escalade: "Escalade" };
const UPCOMING = ["PENDING", "ACCEPTED", "CONFIRMED", "OPTION", "CONFIRME"];
const STATUS: Record<string, string> = { PENDING: "Demande", ACCEPTED: "Acceptée (paiement attendu)", CONFIRMED: "Confirmée", CHECKED_IN: "En cours", CHECKED_OUT: "Terminée", CANCELLED: "Annulée", NO_SHOW: "Non présenté", OPTION: "Demande", CONFIRME: "Confirmée", ANNULE: "Annulée", TERMINE: "Terminée", ACTIVE: "En ligne", DISABLED: "Masquée", PENDING_REVIEW: "En validation" };
const dt = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** Fiche de suivi d'un compte (account manager). */
export default async function AmAccount({ params, searchParams }: { params: { kind: string; id: string }; searchParams: { assist?: string } }) {
  const [d, managers] = await Promise.all([getAm<any>(`/accounts/${params.kind}/${encodeURIComponent(params.id)}`), getAm<{ id: string; name: string }[]>("/managers")]);
  if (!d) notFound();
  // Litiges de l'hôte (résidences et espaces) : ouverts en détail, pour répondre à sa place.
  const access = d.kind === "site" ? await getAm<any>(`/accounts/site/${encodeURIComponent(d.id)}/access`) : null;
  const reco = await getAm<any>(`/accounts/${d.kind}/${encodeURIComponent(d.id)}/recommendations`);
  const disputes = d.kind === "site" ? null : await getAm<{ items: any[]; awaitingReply: number }>(`/accounts/${d.kind}/${encodeURIComponent(d.id)}/disputes`);
  const openDisputes = await Promise.all((disputes?.items ?? []).filter((x) => x.open).slice(0, 5).map((x) => getAm<any>(`/accounts/${d.kind}/${encodeURIComponent(d.id)}/disputes/${x.id}`)));
  const p = d.profile;
  const wa = String(p.whatsapp ?? "").replace(/\D/g, "");
  const tasks = d.activities.filter((a: any) => a.type === "task");
  const log = d.activities.filter((a: any) => a.type !== "task");
  return (
    <div className="space-y-5">
      <Link href={`/admin/comptes/portefeuille?kind=${d.kind}`} className="text-sm font-semibold text-brand-800 hover:underline">← Portefeuille</Link>
      {searchParams.assist === "fin" ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Accès assisté terminé : le récapitulatif des modifications a été envoyé au client.</p> : null}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-white p-5 ring-1 ring-slate-200">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{p.type}</p>
          <h1 className="font-display text-2xl font-extrabold text-ink">{p.name}</h1>
          <p className="text-sm text-slate-600">{[p.place, p.email].filter(Boolean).join(" · ")}</p>
          <p className="text-xs text-muted">Inscrit le {new Date(p.createdAt).toLocaleDateString("fr-FR")}{p.lastLoginAt ? ` · dernière connexion ${new Date(p.lastLoginAt).toLocaleDateString("fr-FR")}` : ""}{p.verified ? " · ✓ vérifié" : ""}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.phone ? <a href={`tel:${p.phone}`} className="rounded-full bg-brand-800 px-3 py-1.5 text-sm font-bold text-white">📞 {p.phone}</a> : null}
            {wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-3 py-1.5 text-sm font-bold text-white">WhatsApp</a> : null}
            {p.adminHref ? <Link href={p.adminHref} className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-slate-300">Fiche 360° du compte</Link> : null}
            {p.publicHref ? <Link href={p.publicHref} target="_blank" className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-slate-300">Page publique ↗</Link> : null}
            {(p.residences ?? p.espaces ?? []).map((r: any) => <Link key={r.id} href={r.href} target="_blank" className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-slate-300">{r.name} ↗</Link>)}
          </div>
        </div>
        <div className="w-full max-w-xs">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Account manager</p>
          <p className="mb-2 text-sm font-semibold text-ink">{d.manager ? `${d.manager.name} (depuis le ${new Date(d.manager.since).toLocaleDateString("fr-FR")})` : "Aucun"}</p>
          <AssignControl kind={d.kind} id={d.id} current={d.manager?.id ?? null} managers={managers ?? []} canAssign={d.canAssign} meId={getSession()?.id ?? ""} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {d.kpis.map((k: any) => <div key={k.label} className="rounded-lg bg-white p-4 ring-1 ring-slate-200"><p className="text-xs text-muted">{k.label}</p><p className="font-display text-xl font-extrabold text-ink">{k.value}</p></div>)}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {d.activity ? <HostActivityPanel a={d.activity} /> : null}
          {reco ? <RecoList kind={d.kind} id={d.id} data={reco} /> : null}
          <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <h2 className="font-display text-lg font-bold text-ink">{d.kind === "site" ? "Annonces" : "Dernières réservations (apps et Moboo.ci)"}</h2>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {d.recent.map((r: any) => (
                <li key={r.key} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>{r.href ? <Link href={r.href} target="_blank" className="font-semibold hover:underline">{r.title}</Link> : <b>{r.title}</b>} <span className="text-xs text-muted">· {new Date(r.when).toLocaleDateString("fr-FR")}</span>{r.source ? <span className={"ml-1 rounded px-1.5 py-0.5 text-[11px] font-semibold " + (r.source === "Moboo.ci" ? "bg-brand-50 text-brand-800" : "bg-slate-100 text-slate-700")}>{r.source}</span> : null}</span>
                  <span className="text-xs"><span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">{STATUS[r.status] ?? r.status}</span>{r.amount != null ? ` · ${fcfa(r.amount)}` : ""}</span>
                  {d.kind !== "site" && UPCOMING.includes(r.status) && r.end ? <div className="w-full"><ChangeDates bookingKey={r.key} start={r.when} end={r.end} compact /></div> : null}
                </li>
              ))}
              {!d.recent.length ? <li className="py-2 text-muted">Rien pour l’instant.</li> : null}
            </ul>
          </section>
          {disputes ? (
            <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
              <h2 className="font-display text-lg font-bold text-ink">⚖️ Litiges {disputes.awaitingReply ? <span className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{disputes.awaitingReply} réponse(s) attendue(s)</span> : null}</h2>
              <div className="mt-2 space-y-3">
                {openDisputes.filter(Boolean).map((x: any) => (
                  <details key={x.id} className="rounded-lg bg-slate-50 p-3" open={x.replyExpected}>
                    <summary className="cursor-pointer text-sm"><b>{x.number}</b> · {x.title} · <span className={x.overdue ? "font-bold text-red-700" : "text-muted"}>{x.statusLabel}</span>{x.booking ? <span className="text-xs text-muted"> · {x.booking.ref} ({x.booking.start} → {x.booking.end})</span> : null}</summary>
                    <p className="mt-2 text-sm text-slate-700"><b>{x.categoryLabel}</b> — {x.description}{x.amountClaimed ? ` · réclamé : ${fcfa(x.amountClaimed)}` : ""}</p>
                    <ol className="mt-2 space-y-1.5 text-sm">
                      {x.messages.map((m: any) => <li key={m.id}><span className="text-xs text-muted">{m.authorName} · {dt(m.createdAt)}</span><p className="whitespace-pre-line">{m.body}</p></li>)}
                    </ol>
                    <DisputeReply kind={d.kind} id={d.id} disputeId={x.id} />
                  </details>
                ))}
                {(disputes.items ?? []).filter((x: any) => !x.open).slice(0, 5).map((x: any) => <p key={x.id} className="text-sm text-muted">{x.number} · {x.title} · {x.statusLabel}</p>)}
                {!disputes.items?.length ? <p className="text-sm text-muted">Aucun litige.</p> : null}
              </div>
            </section>
          ) : null}
          <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <h2 className="font-display text-lg font-bold text-ink">Historique du suivi</h2>
            <ol className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4 text-sm">
              {log.map((a: any) => (
                <li key={a.id}>
                  <p className="text-xs text-muted">{TYPE_ICON[a.type] ?? "•"} {dt(a.createdAt)} · {a.managerName ?? "Équipe"}{a.outcome ? ` · ${OUTCOME[a.outcome] ?? a.outcome}` : ""}{a.refKey ? ` · ${a.refKey.startsWith("stay") ? "séjour" : a.refKey.startsWith("event") ? "espace" : "litige"}` : ""}</p>
                  <p className="whitespace-pre-line text-ink">{a.body}</p>
                </li>
              ))}
              {!log.length ? <li className="text-muted">Aucun contact enregistré : commencez par un appel de présentation.</li> : null}
            </ol>
          </section>
        </div>
        <aside className="space-y-4">
          {access ? <AccessPanel accountId={d.id} name={p.name} history={access} /> : null}
          <ActivityForm kind={d.kind} id={d.id} />
          <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <h2 className="font-display text-base font-bold text-ink">Tâches</h2>
            <div className="mt-2 space-y-2">
              {tasks.map((t: any) => <TaskCheck key={t.id} id={t.id} done={!!t.doneAt} label={<>{t.body} <span className="text-xs text-muted">· {t.dueAt ? dt(t.dueAt) : "sans date"}</span></>} />)}
              {!tasks.length ? <p className="text-sm text-muted">Aucune tâche.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
