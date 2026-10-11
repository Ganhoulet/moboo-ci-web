import Link from "next/link";
import { getServices } from "../actions";
import { MissionActions } from "@/components/backoffice/mission-actions";
import { fcfa } from "@/lib/moboo-services";

export const dynamic = "force-dynamic";

const STATUS: [string, string][] = [["", "Toutes"], ["new", "À attribuer"], ["assigned", "Attribuées"], ["in_progress", "En cours"], ["done", "Réalisées"], ["cancelled", "Annulées"]];
const TONE: Record<string, string> = { new: "bg-amber-100 text-amber-900", assigned: "bg-blue-100 text-blue-900", in_progress: "bg-indigo-100 text-indigo-900", done: "bg-emerald-100 text-emerald-900", cancelled: "bg-slate-100 text-slate-600" };

/** Services Moboo → Missions : commandes du site réalisées par les agents dans Moboo Pro. */
export default async function MissionsAdmin({ searchParams }: { searchParams: { statut?: string; page?: string } }) {
  const st = searchParams.statut ?? "";
  const page = Number(searchParams.page) || 1;
  const d = await getServices<any>(`/missions?status=${st}&page=${page}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Missions indisponibles.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Missions Moboo</h1>
        <p className="max-w-3xl text-sm text-muted">
          Services commandés sur le site (mise en location, gestion, visite, bail…). Chaque mission arrive ici et par e-mail. Attribuez-la à un agent : il la reçoit dans
          Moboo Pro › Missions Moboo et la réalise avec ses outils (mandats, contrats, baux…), puis envoie son compte rendu. Pour qu’un service soit pris directement par les agents de la zone,
          passez-le en « Agents de la zone » dans <Link href="/admin/services/reglages?tab=site" className="font-semibold underline">Réglages › Services du site</Link>.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {STATUS.map(([k, l]) => <Link key={k} href={k ? `?statut=${k}` : "?"} className={"rounded-full px-3 py-1 font-semibold " + (st === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}{k && d.counts?.[k] ? ` (${d.counts[k]})` : ""}</Link>)}
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[1050px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">N°</th><th className="p-3">Service</th><th className="p-3">Client</th><th className="p-3">Bien / lieu</th><th className="p-3">Détails</th><th className="p-3">Statut / agent</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {d.items.map((m: any) => (
              <tr key={m.uuid} className="border-t border-slate-100 align-top">
                <td className="p-3 text-xs text-muted">#{m.id}<br />{m.created_at}<br /><span className="rounded bg-slate-100 px-1.5 font-semibold">{m.source === "site" ? "Site" : "Appli"}</span></td>
                <td className="p-3"><span className="text-lg">{m.icon}</span> <b>{m.title}</b><br /><span className="text-xs text-muted">{m.price_label}</span><br /><span className="text-[11px] text-slate-500">Moboo Pro : {m.pro_modules}</span>{m.dispatch === "agents" ? <><br /><span className="text-[11px] font-semibold text-emerald-700">Diffusée aux agents de la zone</span></> : null}</td>
                <td className="p-3"><strong>{m.full_name}</strong><br /><a href={`tel:${m.phone}`} className="text-xs text-brand-700">{m.phone}</a> · <a href={`https://wa.me/${String(m.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-700">WhatsApp</a>{m.email ? <><br /><span className="text-xs text-muted">{m.email}</span></> : null}</td>
                <td className="p-3">{m.prop_type || "—"}<br /><span className="text-xs">{m.where}</span>{m.preferred_date ? <><br /><span className="text-xs">📅 {m.preferred_date}</span></> : null}</td>
                <td className="p-3 text-xs text-slate-700">
                  {Object.entries(m.details ?? {}).map(([k, v]) => <span key={k} className="mr-2 inline-block">{k} : <b>{String(v)}</b></span>)}
                  {m.message ? <p className="mt-1">« {m.message} »</p> : null}
                </td>
                <td className="p-3 text-xs">
                  <span className={"rounded-full px-2 py-0.5 font-semibold " + (TONE[m.status] ?? "")}>{m.status_label}</span>
                  {m.agent ? <p className="mt-1">{m.agent}</p> : null}
                  {m.price ? <p className="text-muted">Agent : {fcfa(m.price)}</p> : null}
                  {m.moboo_note ? <p className="mt-1 text-muted">Note : {m.moboo_note}</p> : null}
                  {m.agent_note ? <p className="mt-1 text-indigo-800">Agent : {m.agent_note}</p> : null}
                  {m.report ? <details className="mt-1"><summary className="cursor-pointer font-semibold text-emerald-800">Compte rendu</summary><p className="mt-1 whitespace-pre-line">{m.report}</p></details> : null}
                </td>
                <td className="p-3"><MissionActions m={m} /></td>
              </tr>
            ))}
            {!d.items.length ? <tr><td colSpan={7} className="p-6 text-center text-muted">Aucune mission.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {d.pages > 1 ? <div className="flex gap-2 text-sm">{page > 1 ? <Link href={`?statut=${st}&page=${page - 1}`} className="rounded px-3 py-1 ring-1 ring-slate-300">← Précédent</Link> : null}{page < d.pages ? <Link href={`?statut=${st}&page=${page + 1}`} className="rounded px-3 py-1 ring-1 ring-slate-300">Suivant →</Link> : null}</div> : null}
    </div>
  );
}
