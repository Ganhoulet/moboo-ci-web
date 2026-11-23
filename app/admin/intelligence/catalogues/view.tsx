import Link from "next/link";
import { deleteCatalogue } from "./actions";
import type { Catalogue } from "../types";
import { ImportForm } from "./import-form";

/** Contenu de la page (séparé pour pouvoir l'afficher avec des données d'essai). */
export function CataloguesView({ items }: { items: Catalogue[] | null }) {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/intelligence" className="text-sm font-semibold text-brand-800 hover:underline">← Intelligence immobilière</Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Catalogues des agences partenaires</h1>
        <p className="max-w-3xl text-sm text-muted">
          Les agences peuvent nous confier toutes leurs annonces, y compris celles qu’elles publient sur d’autres sites (IvoireDomi, CoinAfrique…), pour élargir les statistiques du marché.
          Ces annonces <strong>ne sont jamais publiées</strong> sur Moboo.ci : elles servent seulement aux chiffres (« marché général »). N’importez que des catalogues que l’agence vous a remis elle-même.
        </p>
      </div>
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-bold text-ink">Importer un catalogue Excel</h2>
        <ImportForm />
      </section>
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-1 font-bold text-ink">Catalogues reçus</h2>
        <p className="mb-3 text-xs text-muted">Les agences équipées d’un logiciel peuvent aussi envoyer leur catalogue automatiquement : API partenaires, <code>POST /partner/v1/market/catalog</code> avec une clé ayant le droit <code>market:write</code>.</p>
        {items === null ? <p className="text-sm text-red-600">Liste indisponible.</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-1.5">Source</th><th className="py-1.5 text-right">En ligne</th><th className="py-1.5 text-right">Total</th><th className="py-1.5 pl-6">Aussi sur</th><th className="py-1.5">Mis à jour</th><th /></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.key} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{c.label}<span className="block text-[11px] text-muted">{c.key.startsWith("acc:") ? "API partenaires" : "Import Excel"}</span></td>
                  <td className="py-2 text-right tabular-nums">{c.actives}</td>
                  <td className="py-2 text-right tabular-nums">{c.total}</td>
                  <td className="py-2 pl-6 text-xs">{c.plateformes.join(", ") || "—"}</td>
                  <td className="py-2 text-xs text-muted">{c.maj ? new Date(c.maj).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="py-2 text-right">
                    <form action={deleteCatalogue}><input type="hidden" name="key" value={c.key} /><button className="text-xs font-semibold text-red-600 hover:underline">Retirer des statistiques</button></form>
                  </td>
                </tr>
              ))}
              {!items.length ? <tr><td colSpan={6} className="py-6 text-center text-muted">Aucun catalogue pour le moment.</td></tr> : null}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
