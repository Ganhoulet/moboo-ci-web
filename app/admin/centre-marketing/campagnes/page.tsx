import Link from "next/link";
import { listCampaigns } from "./actions";
import { CHANNEL, STATUS, when } from "./status";

export const dynamic = "force-dynamic";

/** Centre marketing → Campagnes ciblées. */
export default async function Campaigns() {
  const d = await listCampaigns();
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Campagnes indisponibles.</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Campagnes ciblées</h1>
          <p className="max-w-3xl text-sm text-muted">E-mails et messages WhatsApp aux comptes du site (par type de compte, ville ou commune, activité, annonces…), notifications push aux hôtes Moboo Resi et Moboo Event. Envoi en arrière-plan, un message par personne, désinscriptions respectées.</p>
        </div>
        <Link href="/admin/centre-marketing/campagnes/nouvelle" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Nouvelle campagne</Link>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-2">Campagne</th><th className="px-3 py-2">Canal</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2 text-right">Envoyés</th><th className="px-3 py-2 text-right">Échecs</th><th className="px-4 py-2">Date</th></tr>
          </thead>
          <tbody>
            {d.items.map((c) => {
              const [l, cls] = STATUS[c.status] ?? STATUS.draft;
              return (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2"><Link href={`/admin/centre-marketing/campagnes/${c.id}`} className="font-semibold text-ink hover:underline">{c.name}</Link></td>
                  <td className="px-3 py-2">{CHANNEL[c.channel]}{c.channel === "push" ? ` · ${c.pushApp === "event" ? "Moboo Event" : "Moboo Resi"}` : ""}</td>
                  <td className="px-3 py-2"><span className={"rounded px-1.5 py-0.5 text-[11px] font-semibold " + cls}>{l}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.status === "draft" ? "—" : `${c.sent} / ${c.total}`}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.failed || "—"}</td>
                  <td className="px-4 py-2 text-xs text-muted">{c.status === "scheduled" ? `prévue ${when(c.scheduledAt)}` : c.finishedAt ? when(c.finishedAt) : when(c.createdAt)}</td>
                </tr>
              );
            })}
            {!d.items.length ? <tr><td colSpan={6} className="p-6 text-center text-muted">Aucune campagne pour le moment.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
