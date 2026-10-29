import Link from "next/link";
import { getGrowth } from "../actions";
import { AssignListing, SendReport } from "@/components/backoffice/growth-listing-tools";

export const dynamic = "force-dynamic";

const date = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** Annonces publiées par l'équipe pour les agents : résultats, attribution, bilan. */
export default async function StudioListings({ searchParams }: { searchParams: { scope?: string; page?: string } }) {
  const scope = searchParams.scope === "all" ? "all" : "mine";
  const [d, agents] = await Promise.all([
    getGrowth<any>(`/listings?${new URLSearchParams({ scope, page: searchParams.page ?? "1" })}`),
    getGrowth<any>("/agents?scope=mine"),
  ]);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Liste indisponible.</p>;
  const eligible = (agents?.items ?? []).filter((a: any) => a.mandate?.canPublish).map((a: any) => ({ id: a.id, name: a.name }));
  const pages = Math.max(1, Math.ceil(d.total / d.perPage));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Annonces publiées par l’équipe</h1>
          <p className="text-sm text-muted">{d.total} annonce(s). Vues, appels et WhatsApp reçus : la valeur apportée à chaque agent.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/comptes/studio" className="rounded-md bg-accent-600 px-3 py-1.5 font-semibold text-white">Publier une annonce</Link>
          <Link href={`?scope=${scope === "all" ? "mine" : "all"}`} className="rounded-md bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300">{scope === "all" ? "Mes annonces" : "Toute l’équipe"}</Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Annonce</th><th className="p-3">Annonceur</th><th className="p-3">Résultats</th><th className="p-3">Publiée</th><th className="p-3">Attribuer à</th></tr>
          </thead>
          <tbody>
            {d.items.map((l: any) => (
              <tr key={l.id} className="border-t border-slate-100 align-top">
                <td className="p-3">
                  <a href={l.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-800 hover:underline">{l.title}</a>
                  <br /><span className="text-xs text-muted">{l.price.toLocaleString("fr-FR")} F{l.commune ? ` · ${l.commune}` : ""} · {l.online ? "en ligne" : l.status.toLowerCase()}</span>
                </td>
                <td className="p-3 text-xs"><Link href={`/admin/comptes/studio?agent=${l.owner.id}`} className="font-semibold text-ink hover:underline">{l.owner.name || "—"}</Link><br /><SendReport accountId={l.owner.id} /></td>
                <td className="p-3 text-xs">{l.views} vues · <b>{l.calls}</b> appels · <b>{l.whatsapp}</b> WhatsApp</td>
                <td className="p-3 text-xs">{date(l.createdAt)}<br /><span className="text-muted">{l.manager}</span></td>
                <td className="p-3"><AssignListing listingId={l.id} currentId={l.owner.id} agents={eligible} /></td>
              </tr>
            ))}
            {!d.items.length ? <tr><td colSpan={5} className="p-6 text-center text-sm text-muted">Aucune annonce publiée par l’équipe pour le moment.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="flex gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => <Link key={p} href={`?scope=${scope}&page=${p}`} className={"rounded px-2 py-1 " + (p === d.page ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{p}</Link>)}
        </div>
      ) : null}
    </div>
  );
}
