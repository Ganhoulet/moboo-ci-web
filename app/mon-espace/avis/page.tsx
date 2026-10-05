import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { canAccess } from "@/lib/accounts";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { Stars } from "@/components/reviews";
import { ReviewReply } from "@/components/pro-reviews/review-reply";
import { CATEGORIES, type Aggregates, type AvisItem } from "@/lib/pro-reviews";

export const metadata: Metadata = { title: "Avis clients", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Mon espace → Avis clients : note, critères, avis reçus (site + application) et réponses. */
export default async function Avis() {
  const account = getSession()!;
  if (!canAccess(account.accountType, "avis")) redirect("/mon-espace");
  const r = await authedFetch("/site/me/reviews/received", { method: "GET" });
  const agg: Aggregates | null = r.ok ? r.data.aggregates : null;
  const items: AvisItem[] = r.ok ? r.data.items : [];
  const unanswered = items.filter((i) => !i.reponse && i.status === "approved").length;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Avis clients"
        sub="Les avis laissés sur le site et dans l’application Moboo.ci. Répondez-y : une réponse courtoise rassure les futurs clients."
        action={account.username ? <Link href={`/pro/${account.username}#avis`} className="btn-ghost text-sm">Voir ma page publique</Link> : null}
      />
      {agg && agg.nb_avis ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Note globale</p>
            <p className="mt-1 font-display text-3xl font-black text-ink">{fmt(agg.note_globale)}</p>
            <Stars value={agg.note_globale} size={14} />
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Avis</p>
            <p className="mt-1 font-display text-3xl font-black text-ink">{agg.nb_avis}</p>
            <p className="text-xs text-muted">{unanswered ? `${unanswered} sans réponse` : "Tous ont une réponse"}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recommandent</p>
            <p className="mt-1 font-display text-3xl font-black text-emerald-700">{agg.pct_recommande ?? "—"}{agg.pct_recommande !== null ? " %" : ""}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Critères</p>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
              {CATEGORIES.map((c) => <li key={c.key} className="flex justify-between"><span>{c.label}</span><strong className="text-ink">{agg.categories[c.key] ? fmt(agg.categories[c.key]!) : "—"}</strong></li>)}
            </ul>
          </div>
        </div>
      ) : null}
      {agg?.badges.length ? (
        <ul className="mb-6 flex flex-wrap gap-2">{agg.badges.map((b) => <li key={b.libelle} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900">{b.icone} {b.libelle}</li>)}</ul>
      ) : null}

      {items.length ? (
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.id} className="rounded-2xl bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-ink">{i.client_nom}</span>
                <Stars value={i.note_globale} size={14} />
                {i.certifie ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">✓ Avis certifié</span> : null}
                {i.status === "pending" ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">En attente de validation</span> : null}
                <span className="text-xs text-muted">{new Date(i.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              {Object.keys(i.categories).length ? (
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  {CATEGORIES.filter((c) => i.categories[c.key]).map((c) => <span key={c.key}>{c.label} <strong className="text-ink">{i.categories[c.key]}/5</strong></span>)}
                  {i.recommande !== null ? <span className="font-semibold">{i.recommande ? "👍 Vous recommande" : "Ne recommande pas"}</span> : null}
                </p>
              ) : null}
              {i.commentaire ? <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{i.commentaire}</p> : null}
              {i.qualites.length ? <p className="mt-2 flex flex-wrap gap-1.5">{i.qualites.map((q) => <span key={q} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">{q}</span>)}</p> : null}
              <ReviewReply id={i.id} initial={i.reponse} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Pas encore d’avis" text="Après un échange via Moboo (demande, visite, message), vos clients peuvent vous noter depuis votre page ou l’application. Pensez à le leur proposer !" />
      )}
    </div>
  );
}
