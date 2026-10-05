import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignEditor } from "@/components/backoffice/campaign-editor";
import { CampaignActions } from "@/components/backoffice/campaign-actions";
import { getCampaign } from "../actions";
import { CHANNEL, STATUS, when } from "../status";

export const dynamic = "force-dynamic";

/** Une campagne : modifiable tant qu'elle n'est pas partie, sinon rapport d'envoi. */
export default async function CampaignPage({ params }: { params: { id: string } }) {
  const c = await getCampaign(params.id);
  if (!c) notFound();
  const [l, cls] = STATUS[c.status] ?? STATUS.draft;
  const editable = c.status === "draft" || c.status === "scheduled";
  const done = c.counts.sent + c.counts.failed;
  const pct = c.total ? Math.round((done / c.total) * 100) : 0;
  return (
    <div className="space-y-4">
      <Link href="/admin/centre-marketing/campagnes" className="text-sm font-semibold text-brand-800 hover:underline">← Campagnes ciblées</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold text-ink">
          {c.name} <span className={"rounded px-2 py-0.5 text-xs font-semibold " + cls}>{l}</span>
        </h1>
        <CampaignActions id={c.id} status={c.status} />
      </div>
      {c.status === "scheduled" ? <p className="rounded-md bg-sky-50 p-3 text-sm text-sky-900 ring-1 ring-sky-200">Envoi programmé le <strong>{when(c.scheduledAt)}</strong>. Toute modification la remet en brouillon.</p> : null}

      {editable ? (
        <CampaignEditor variables={c.variables} initial={{ id: c.id, name: c.name, channel: c.channel, audience: c.audience, subject: c.subject, body: c.body, waTemplate: c.waTemplate, waLanguage: c.waLanguage, waVars: c.waVars, pushApp: c.pushApp, link: c.link }} />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {([["Destinataires", c.total, "text-ink"], ["Envoyés", c.counts.sent, "text-emerald-700"], ["Échecs", c.counts.failed, c.counts.failed ? "text-red-700" : "text-ink"], ["En attente", c.counts.pending, "text-ink"]] as const).map(([k, v, t]) => (
              <div key={k} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"><p className={"font-display text-2xl font-extrabold tabular-nums " + t}>{v.toLocaleString("fr-FR")}</p><p className="text-xs text-muted">{k}</p></div>
            ))}
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-xs text-muted">{CHANNEL[c.channel]} · lancée {when(c.startedAt)}{c.finishedAt ? ` · terminée ${when(c.finishedAt)}` : ""} · {pct} %</p>
          </div>
          <div className="rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Message</p>
            {c.channel === "whatsapp" ? <p className="mt-1">Modèle <code>{c.waTemplate}</code> ({c.waLanguage}) · variables : {c.waVars.join(" · ") || "aucune"}</p> : <><p className="mt-1 font-semibold">{c.subject}</p><p className="mt-1 whitespace-pre-line text-slate-700">{c.body}</p></>}
          </div>
          {c.errors.length ? (
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Échecs (20 premiers)</p>
              <ul className="mt-1 space-y-0.5 text-sm">{c.errors.map((e, i) => <li key={i}><span className="font-mono text-xs">{e.address}</span> — <span className="text-red-700">{e.error}</span></li>)}</ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
