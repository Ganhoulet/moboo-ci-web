import Link from "next/link";
import { notFound } from "next/navigation";
import { listPeople } from "../../actions";

export default async function AdminPeople({ params, searchParams }: { params: { kind: string }; searchParams: { q?: string } }) {
  if (params.kind !== "agences" && params.kind !== "agents") notFound();
  const agencies = params.kind === "agences";
  const items = await listPeople(agencies ? "agencies" : "agents", searchParams.q);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{agencies ? "Agences" : "Agents"}</h1>
        <p className="text-sm text-muted">
          {agencies ? "Comptes « Agence / promoteur » du site" : "Comptes « Agent immobilier » du site"} et fiches reprises de moboo.ci, avec leurs annonces en ligne.
        </p>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={searchParams.q} placeholder="Nom, téléphone, e-mail…" className="input max-w-sm py-2" />
        <button className="rounded-md border border-brand-700 px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Chercher</button>
      </form>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="border-b border-slate-200 text-left">
            <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Zone</th><th className="px-4 py-3">Origine</th><th className="px-4 py-3 text-right">Annonces en ligne</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => (
              <tr key={`${p.source}-${p.id}`}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-800 font-bold text-white">{(p.name || "?").charAt(0).toUpperCase()}</span>}
                    <span>
                      {p.username ? <Link href={`/pro/${p.username}`} target="_blank" className="font-semibold text-brand-800 hover:underline">{p.name}</Link> : <span className="font-semibold text-ink">{p.name}</span>}
                      {!p.active ? <span className="ml-2 rounded bg-red-50 px-1.5 text-xs text-red-700">désactivé</span> : null}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{[p.phone, p.email].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.city || "—"}</td>
                <td className="px-4 py-3"><span className={"rounded px-2 py-0.5 text-xs font-semibold " + (p.source === "site" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>{p.source === "site" ? "Compte du site" : "Reprise moboo.ci"}</span></td>
                <td className="px-4 py-3 text-right font-semibold">{p.listings}</td>
              </tr>
            ))}
            {!items.length ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Aucun résultat.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
