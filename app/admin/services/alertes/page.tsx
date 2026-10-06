import Link from "next/link";
import { getServices } from "../actions";
import { DeleteAlerteButton } from "@/components/backoffice/services-admin-widgets";
import { fcfa } from "@/lib/moboo-services";

export const dynamic = "force-dynamic";

/** Services Moboo → Alertes envoyées par les locataires / acheteurs. */
export default async function AlertesAdmin({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const q = searchParams.q ?? "";
  const page = Number(searchParams.page) || 1;
  const d = await getServices<any>(`/alertes?q=${encodeURIComponent(q)}&page=${page}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Alertes indisponibles.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Alertes</h1>
        <p className="text-sm text-muted">{d.total} alerte(s). Chaque alerte est envoyée aux agents de la commune (sinon de la ville, sinon aux agents vérifiés).</p>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Nom, téléphone, commune…" className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
        <button className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white">Rechercher</button>
      </form>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Date</th><th className="p-3">Demandeur</th><th className="p-3">Recherche</th><th className="p-3">Zone</th><th className="p-3">Budget</th><th className="p-3">Agents</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {d.items.map((a: any) => (
              <tr key={a.uuid} className="border-t border-slate-100 align-top">
                <td className="p-3 text-xs text-muted">{a.created_at}<br />{a.app === "moboo_pro" ? "Moboo Pro" : "Moboo.ci"}</td>
                <td className="p-3"><strong>{a.full_name}</strong><br /><span className="text-xs">{a.phone}</span><br /><span className="text-xs text-muted">{a.email}</span></td>
                <td className="p-3">{a.purpose === "buy" ? "Achat" : "Location"}{a.prop_type ? ` · ${a.prop_type}` : ""}{a.message ? <p className="mt-1 max-w-xs text-xs text-muted">{a.message}</p> : null}</td>
                <td className="p-3">{[a.commune, a.city].filter(Boolean).join(", ")}</td>
                <td className="p-3 text-xs">{a.budget_min ? `${fcfa(a.budget_min)} – ` : ""}{a.budget_max ? fcfa(a.budget_max) : "—"}</td>
                <td className="p-3 text-xs"><strong>{a.agents_notified}</strong> prévenu(s)<br />{a.read} lu(e)s · {a.responded} réponse(s)</td>
                <td className="p-3 text-right"><DeleteAlerteButton id={a.uuid} /></td>
              </tr>
            ))}
            {!d.items.length ? <tr><td colSpan={7} className="p-6 text-center text-muted">Aucune alerte.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {d.pages > 1 ? (
        <div className="flex gap-2 text-sm">
          {page > 1 ? <Link className="rounded bg-white px-3 py-1 ring-1 ring-slate-300" href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}>← Précédent</Link> : null}
          <span className="px-2 py-1 text-muted">Page {page} / {d.pages}</span>
          {page < d.pages ? <Link className="rounded bg-white px-3 py-1 ring-1 ring-slate-300" href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}>Suivant →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
