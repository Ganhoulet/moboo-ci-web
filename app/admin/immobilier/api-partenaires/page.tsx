import Link from "next/link";
import { ApiPartnerGrant } from "@/components/backoffice/api-partner-grant";
import { getApiPartners, rateAction, toggleAction } from "./actions";

export const dynamic = "force-dynamic";

const when = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

/** Immobilier → API partenaires : agences reliées à Moboo par leur logiciel. */
export default async function ApiPartners() {
  const items = await getApiPartners();
  if (!items) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Liste indisponible.</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">API partenaires</h1>
          <p className="max-w-3xl text-sm text-muted">
            Les agences partenaires relient leur logiciel à Moboo.ci : leurs annonces sont publiées et mises à jour automatiquement (avec leur propre référence),
            et leurs demandes leur arrivent en temps réel. Mêmes règles que sur le site : forfait, vérification, modération.
          </p>
        </div>
        <Link href="/developpeurs" target="_blank" className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Documentation publique ↗</Link>
      </div>
      <ApiPartnerGrant />
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-2">Agence</th><th className="px-3 py-2">Clés</th><th className="px-3 py-2">Annonces synchronisées</th><th className="px-3 py-2">Requêtes (30 j)</th><th className="px-3 py-2">Dernier appel</th><th className="px-3 py-2">Limite / min</th><th className="px-4 py-2">Accès</th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.accountId} className={"border-t border-slate-100 align-top " + (p.enabled ? "" : "bg-slate-50 text-slate-500")}>
                <td className="px-4 py-3">
                  <Link href={`/admin/utilisateurs/${p.accountId}`} className="font-semibold text-ink hover:underline">{p.name}</Link>
                  <p className="text-xs text-muted">{p.phone}{p.webhook ? " · webhook actif" : ""}</p>
                  {p.note ? <p className="text-xs text-muted">{p.note}</p> : null}
                </td>
                <td className="px-3 py-3 tabular-nums">{p.activeKeys}</td>
                <td className="px-3 py-3 tabular-nums">{p.syncedListings}</td>
                <td className="px-3 py-3 tabular-nums">{p.requests30d.toLocaleString("fr-FR")}{p.errors30d ? <span className="ml-1 text-xs text-red-700">({p.errors30d} erreurs)</span> : null}</td>
                <td className="px-3 py-3 text-xs">{when(p.lastUsedAt)}</td>
                <td className="px-3 py-3">
                  <form action={rateAction.bind(null, p.accountId)} className="flex gap-1">
                    <input name="rateLimit" type="number" min={10} max={1200} defaultValue={p.rateLimit} className="w-20 rounded border border-slate-300 px-2 py-1 text-xs" />
                    <button className="rounded px-2 text-xs ring-1 ring-slate-300 hover:bg-slate-50">OK</button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={toggleAction.bind(null, p.accountId, !p.enabled)}>
                    <button className={"rounded-md px-2 py-1 text-xs font-semibold ring-1 " + (p.enabled ? "text-red-700 ring-red-200 hover:bg-red-50" : "text-emerald-700 ring-emerald-200 hover:bg-emerald-50")}>
                      {p.enabled ? "Couper l’accès" : "Rouvrir l’accès"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!items.length ? <tr><td colSpan={7} className="p-6 text-center text-muted">Aucune agence partenaire pour le moment.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
