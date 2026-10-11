import Link from "next/link";
import { ScoreRing } from "@/components/backoffice/am-reco";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

const KIND: Record<string, string> = { org: "Résidences", event: "Espaces", site: "Annonceur / membre" };

/** Centre des opportunités : où agir en premier dans le portefeuille. */
export default async function AmOpportunities({ searchParams }: { searchParams: { scope?: string } }) {
  const scope = searchParams.scope === "all" ? "all" : "mine";
  const [d, o] = await Promise.all([getAm<any>(`/opportunities?scope=${scope}`), getAm<any>("/overview")]);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Opportunités indisponibles.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Centre des opportunités</h1>
        <p className="max-w-3xl text-sm text-muted">
          Ce qui freine les réservations et les contacts de vos comptes — photos, prix au-dessus de la zone, carte, description, calendrier, réactivité, visibilité —
          classé par impact. Ouvrez un compte pour envoyer la recommandation prête (WhatsApp, e-mail ou « Infos Moboo ») : quand l’hôte corrige, elle passe en « corrigée ».
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {o?.canSeeAll ? [["mine", "Mon portefeuille"], ["all", "Toute l’équipe"]].map(([k, l]) => <Link key={k} href={`?scope=${k}`} className={"rounded-full px-3 py-1 font-semibold " + (scope === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>) : null}
        <span className="ml-auto rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Envoyées en attente : <b>{d.stats.sent ?? 0}</b> · Corrigées : <b className="text-emerald-700">{d.stats.fixed ?? 0}</b> · Ignorées : <b>{d.stats.dismissed ?? 0}</b></span>
      </div>
      <ul className="space-y-2">
        {d.items.map((a: any) => (
          <li key={`${a.kind}:${a.id}`} className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-3 ring-1 ring-slate-200">
            <ScoreRing score={a.score} />
            <div className="min-w-0 flex-1">
              <Link href={`/admin/comptes/${a.kind}/${a.id}#recommandations`} className="font-semibold text-brand-800 hover:underline">{a.name}</Link>
              <span className="ml-2 text-xs text-muted">{KIND[a.kind]}</span>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {a.top.map((t: any, i: number) => <li key={i} className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (t.impact === "fort" ? "bg-red-50 text-red-700" : t.impact === "moyen" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600")}>{t.title} — {t.item}</li>)}
              </ul>
            </div>
            <div className="text-right text-xs text-muted"><b className="text-base text-red-700">{a.strong}</b> à fort impact<br />{a.total} au total · {a.sent} envoyée(s)</div>
          </li>
        ))}
        {!d.items.length ? <li className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Aucune opportunité : les comptes de votre portefeuille sont au top (ou votre portefeuille est vide).</li> : null}
      </ul>
    </div>
  );
}
