import Link from "next/link";
import { deleteReference } from "./actions";
import { ReferenceForm } from "./form";
import { Fc, UNITE, type Reference } from "../types";

/** Contenu de la page (séparé pour pouvoir l'afficher avec des données d'essai). */
export function ReferencesView({ items }: { items: Reference[] | null }) {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/intelligence" className="text-sm font-semibold text-brand-800 hover:underline">← Intelligence immobilière</Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Chiffres publiés par d’autres sources</h1>
        <p className="max-w-3xl text-sm text-muted">
          Ajoutez ici les chiffres publiés dans un rapport, un observatoire ou un article (prix moyen, loyer médian, prix au m²…), toujours avec leur source.
          Ils apparaissent dans l’analyse, à côté du prix médian Moboo de la même commune. On ne recopie que des chiffres, jamais les annonces d’un autre site.
        </p>
      </div>
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-bold text-ink">Ajouter un chiffre</h2>
        <ReferenceForm />
      </section>
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 font-bold text-ink">Chiffres enregistrés</h2>
        {items === null ? <p className="text-sm text-red-600">Liste indisponible.</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-1.5">Zone · bien</th><th className="py-1.5 text-right">Valeur</th><th className="py-1.5 pl-6">Source</th><th /></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{[r.quartier, r.commune ?? r.ville ?? "Tout le pays"].filter(Boolean).join(", ")}<span className="block text-[11px] text-muted">{r.typeBien ?? "Tous types"} · {r.transaction === "sale" ? "vente" : "location"} · {UNITE[r.unite]}</span></td>
                  <td className="py-2 text-right tabular-nums"><b>{Fc(r.valeur)}</b>{r.valeurMin && r.valeurMax ? <span className="block text-[11px] text-muted">{Fc(r.valeurMin)} – {Fc(r.valeurMax)}</span> : null}</td>
                  <td className="py-2 pl-6 text-xs">{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-800 hover:underline">{r.source}</a> : r.source}<span className="block text-muted">{r.publieLe ? `publié le ${new Date(r.publieLe).toLocaleDateString("fr-FR")}` : "date non précisée"}{r.note ? ` · ${r.note}` : ""}</span></td>
                  <td className="py-2 text-right"><form action={deleteReference}><input type="hidden" name="id" value={r.id} /><button className="text-xs font-semibold text-red-600 hover:underline">Supprimer</button></form></td>
                </tr>
              ))}
              {!items.length ? <tr><td colSpan={4} className="py-6 text-center text-muted">Aucun chiffre pour le moment.</td></tr> : null}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
