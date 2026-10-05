import Link from "next/link";
import { getFraudOverview, scanPhotosAction, type RiskyAccount } from "./actions";

export const dynamic = "force-dynamic";

const LEVEL: Record<string, [string, string]> = {
  eleve: ["Risque élevé", "bg-red-100 text-red-800"],
  moyen: ["Risque moyen", "bg-amber-100 text-amber-800"],
  faible: ["Faible", "bg-slate-100 text-slate-600"],
};
const STATUS: Record<string, string> = { active: "Actif", suspended: "Suspendu", banned: "Banni", deleted: "Supprimé" };

function Count({ n, label, tone = "text-ink" }: { n: number; label: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className={"font-display text-2xl font-extrabold tabular-nums " + tone}>{n.toLocaleString("fr-FR")}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function AccountRow({ a }: { a: RiskyAccount }) {
  const [label, cls] = LEVEL[a.level] ?? LEVEL.faible;
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-3">
        <Link href={`/admin/utilisateurs/${a.id}`} className="font-semibold text-ink hover:underline">{a.name}</Link>
        <p className="text-xs text-muted">{a.phone} · {a.accountType} · {a.listings} annonce(s){a.verified ? " · vérifié" : ""}</p>
        {a.status !== "active" ? <span className="mt-1 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-white">{STATUS[a.status] ?? a.status}</span> : null}
      </td>
      <td className="px-3 py-3">
        <p className="font-display text-xl font-extrabold tabular-nums">{a.score}</p>
        <span className={"rounded px-1.5 py-0.5 text-[11px] font-semibold " + cls}>{label}</span>
      </td>
      <td className="px-3 py-3">
        <ul className="space-y-0.5 text-xs">
          {a.reasons.map((r, i) => <li key={i}><span className="mr-1 inline-block w-8 text-right font-semibold tabular-nums text-red-700">+{r.points}</span>{r.text}</li>)}
        </ul>
      </td>
      <td className="px-4 py-3 text-xs">
        {a.linked.length ? a.linked.map((l) => (
          <p key={l.id}><Link href={`/admin/utilisateurs/${l.id}`} className="text-brand-700 hover:underline">{l.name}</Link>{l.status && l.status !== "active" ? <span className="ml-1 font-semibold text-red-700">({STATUS[l.status] ?? l.status})</span> : null}</p>
        )) : <span className="text-muted">—</span>}
      </td>
    </tr>
  );
}

/** Modération → Anti-fraude : comptes à risque, comptes liés, photos reprises d'autres annonces. */
export default async function AntiFraud({ searchParams }: { searchParams: { niveau?: string } }) {
  const d = await getFraudOverview();
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Anti-fraude indisponible.</p>;
  const niveau = searchParams.niveau === "eleve" ? "eleve" : "tous";
  const risky = niveau === "eleve" ? d.risky.filter((a) => a.level === "eleve") : d.risky;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Anti-fraude</h1>
          <p className="max-w-3xl text-sm text-muted">
            Score de risque par compte (0 à 100) : photos déjà publiées par un autre annonceur, plusieurs comptes sur un même téléphone ou navigateur,
            même pièce d’identité, prix très en dessous du marché, formules d’arnaque (avance, frais de visite…), rafales d’annonces, signalements.
            Le score aide à prioriser : la décision reste humaine.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <form action={scanPhotosAction}><button className="rounded-md bg-brand-700 px-3 py-2 font-semibold text-white hover:bg-brand-800">Analyser les photos</button></form>
          <Link href="/admin/moderation/reglages" className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Mots suspects</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Count n={d.counts.high} label="Comptes à risque élevé" tone="text-red-700" />
        <Count n={d.counts.medium} label="Comptes à risque moyen" tone="text-amber-700" />
        <Count n={d.counts.reusedPhotos} label="Photos reprises" />
        <Count n={d.counts.photosAnalysed} label="Photos analysées" />
        <Count n={d.counts.photosPending} label="Photos en attente" />
        <Count n={d.counts.devicesSeen} label="Appareils connus" />
      </div>
      {d.counts.photosPending > 0 ? <p className="text-xs text-muted">Les nouvelles photos sont analysées automatiquement par lots toutes les 10 minutes ; « Analyser les photos » en traite 300 tout de suite.</p> : null}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Comptes à surveiller</h2>
          <div className="flex gap-1 text-sm">
            <Link href="/admin/moderation/anti-fraude" className={"rounded-md px-3 py-1.5 font-semibold ring-1 ring-slate-300 " + (niveau === "tous" ? "bg-ink text-white" : "bg-white")}>Tous ({d.risky.length})</Link>
            <Link href="/admin/moderation/anti-fraude?niveau=eleve" className={"rounded-md px-3 py-1.5 font-semibold ring-1 ring-slate-300 " + (niveau === "eleve" ? "bg-ink text-white" : "bg-white")}>Risque élevé ({d.counts.high})</Link>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2">Compte</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">Raisons</th><th className="px-4 py-2">Comptes liés (même appareil)</th></tr>
            </thead>
            <tbody>
              {risky.map((a) => <AccountRow key={a.id} a={a} />)}
              {!risky.length ? <tr><td colSpan={4} className="p-6 text-center text-muted">Aucun compte suspect pour le moment.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-ink">Photos reprises d’une autre annonce</h2>
        <p className="text-xs text-muted">Même photo (ou recadrée, redimensionnée, recompressée) publiée d’abord par un annonceur, puis par un autre. Les visuels partagés par 5 annonceurs ou plus (logos, images génériques) sont ignorés.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {d.reused.map((p, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
              {[
                { tag: "Original", url: p.firstUrl, id: p.firstListingId, title: p.firstTitle, owner: p.firstOwner, cls: "bg-emerald-100 text-emerald-800" },
                { tag: "Reprise", url: p.url, id: p.listingId, title: p.title, owner: p.owner, cls: "bg-red-100 text-red-800" },
              ].map((x) => (
                <div key={x.tag} className="min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.url} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-md bg-slate-100 object-cover" />
                  <span className={"mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold " + x.cls}>{x.tag}</span>
                  <Link href={`/annonce/${x.id}`} target="_blank" className="block truncate text-xs font-semibold text-ink hover:underline">{x.title || "Annonce"}</Link>
                  <p className="truncate text-xs text-muted">{x.owner}</p>
                </div>
              ))}
            </div>
          ))}
          {!d.reused.length ? <p className="rounded-lg bg-white p-6 text-center text-sm text-muted ring-1 ring-slate-200 md:col-span-2">Aucune photo reprise détectée.</p> : null}
        </div>
      </section>
    </div>
  );
}
