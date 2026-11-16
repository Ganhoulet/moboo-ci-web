import Link from "next/link";
import { authedFetch } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type Salle = { id: string; nom: string; commune: string | null; quartier: string | null; visibleSurMoboo: boolean };

/** Salles Moboo Event publiables : l'équipe Moboo peut corriger leurs réglages de prix, options et visites. */
export default async function SallesPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const r = await authedFetch(`/site/admin/event-online/espaces${q ? `?q=${encodeURIComponent(q)}` : ""}`, { method: "GET" });
  const rows = (r.ok ? r.data : []) as Salle[];
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/comptes/evenements" className="text-sm font-semibold text-brand-800 hover:underline">← Événements en cours</Link>
      <h1 className="font-display text-2xl font-extrabold text-ink">Réglages des salles</h1>
      <p className="text-sm text-muted">Suppléments (week-end, haute saison, invités), heures des créneaux, options payantes et horaires de visite. Le propriétaire voit les mêmes réglages dans Moboo Event.</p>
      <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Nom de la salle ou commune" className="input flex-1" /><button className="btn-primary bg-brand-800">Chercher</button></form>
      <ul className="divide-y divide-slate-200 rounded-xl bg-white ring-1 ring-slate-200">
        {rows.map((s) => (
          <li key={s.id}>
            <Link href={`/admin/comptes/evenements/salles/${s.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
              <span><span className="font-semibold text-ink">{s.nom}</span> <span className="text-sm text-muted">{[s.quartier, s.commune].filter(Boolean).join(", ")}</span></span>
              <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (s.visibleSurMoboo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600")}>{s.visibleSurMoboo ? "En ligne" : "Non publiée"}</span>
            </Link>
          </li>
        ))}
        {!rows.length ? <li className="p-4 text-sm text-muted">Aucune salle trouvée.</li> : null}
      </ul>
    </div>
  );
}
