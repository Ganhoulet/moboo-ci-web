import Link from "next/link";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { getSiteSettings } from "@/lib/settings";
import { CATEGORIES, getProReviews, getQualities, type AvisItem } from "@/lib/pro-reviews";
import { Stars } from "@/components/reviews";
import { ProReviewForm } from "./pro-review-form";

const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const month = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

/**
 * Avis certifiés d'un agent / d'une agence — les mêmes que dans l'application
 * Moboo.ci : note globale, 4 critères, « % recommandent », qualités citées,
 * badges, avis avec la réponse de l'agent, et formulaire réservé aux clients
 * qui l'ont contacté via Moboo.
 */
export async function ProReviewsSection({ refId, path, name }: { refId: string; path: string; name: string }) {
  const settings = await getSiteSettings();
  if (!settings.reviews.enabled || !settings.reviews.onPros) return null;
  const data = await getProReviews(refId);
  if (!data?.enabled) return null;
  const a = data.aggregates;
  const account = getSession();
  type Can = { eligible: boolean; certified: boolean; reason: string | null; mon_avis: AvisItem | null };
  let can: Can | null = null;
  if (account) {
    const r = await authedFetch(`/site/me/pros/${encodeURIComponent(refId)}/can-review`, { method: "GET" });
    if (r.ok) can = r.data as Can;
  }
  const qualities = can?.eligible ? await getQualities() : [];

  return (
    <section id="avis" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Avis clients {a.nb_avis ? <span className="text-muted">({a.nb_avis})</span> : null}</h2>
          <p className="mt-1 text-sm text-muted">Avis certifiés : seuls les clients qui ont contacté {name} via Moboo peuvent le noter. Les mêmes avis sont affichés dans l’application Moboo.ci.</p>
        </div>
        {a.badges.length ? (
          <ul className="flex flex-wrap gap-2">
            {a.badges.map((b) => <li key={b.libelle} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900">{b.icone} {b.libelle}</li>)}
          </ul>
        ) : null}
      </div>

      {a.nb_avis && a.assez_d_avis ? (
        <div className="mt-4 grid gap-5 rounded-2xl bg-slate-50 p-5 md:grid-cols-[180px_1fr_1fr]">
          <div className="text-center md:border-r md:border-slate-200 md:pr-5">
            <p className="font-display text-5xl font-black text-ink">{fmt(a.note_globale)}</p>
            <Stars value={a.note_globale} size={18} />
            <p className="mt-1 text-xs text-muted">{a.nb_avis} avis</p>
            {a.pct_recommande !== null ? <p className="mt-3 rounded-xl bg-emerald-50 px-2 py-1.5 text-sm font-bold text-emerald-800">{a.pct_recommande} % recommandent</p> : null}
          </div>
          <div className="space-y-2.5">
            {CATEGORIES.map((c) => {
              const v = a.categories[c.key];
              return (
                <div key={c.key}>
                  <div className="flex justify-between text-sm"><span className="font-medium text-slate-700">{c.label}</span><span className="font-semibold text-ink">{v ? fmt(v) : "—"}</span></div>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${v ? (v / 5) * 100 : 0}%` }} /></span>
                </div>
              );
            })}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Ce que les clients apprécient</p>
            {a.top_qualites.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {a.top_qualites.map((q) => <li key={q.cle} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">{q.libelle} <span className="text-muted">· {q.nb}</span></li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">Pas encore de qualités citées.</p>}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">{a.nb_avis ? "Nouveau sur Moboo : la note s’affichera avec quelques avis de plus." : "Pas encore d’avis. Vous avez contacté ce professionnel via Moboo ? Soyez le premier à partager votre expérience."}</p>
      )}

      {data.avis.length ? (
        <ul className="mt-5 divide-y divide-slate-100">
          {data.avis.map((r) => (
            <li key={r.id} className="py-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{r.client_nom.charAt(0).toUpperCase()}</span>
                <span className="font-semibold text-ink">{r.client_nom}</span>
                <Stars value={r.note_globale} size={14} />
                {r.certifie ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">✓ Avis certifié</span> : null}
                {r.legacy ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">moboo.ci</span> : null}
                <span className="text-xs text-muted">{month(r.created_at)}</span>
              </div>
              {Object.keys(r.categories).length ? (
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  {CATEGORIES.filter((c) => r.categories[c.key]).map((c) => <span key={c.key}>{c.label} <strong className="text-ink">{r.categories[c.key]}/5</strong></span>)}
                  {r.recommande !== null ? <span className={r.recommande ? "font-semibold text-emerald-700" : "font-semibold text-slate-500"}>{r.recommande ? "👍 Recommande" : "Ne recommande pas"}</span> : null}
                </p>
              ) : null}
              {r.titre ? <p className="mt-2 font-semibold text-ink">{r.titre}</p> : null}
              {r.commentaire ? <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.commentaire}</p> : null}
              {r.qualites.length ? <p className="mt-2 flex flex-wrap gap-1.5">{r.qualites.map((q) => <span key={q} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">{q}</span>)}</p> : null}
              {r.reponse ? (
                <div className="mt-3 rounded-xl border-l-4 border-brand-700 bg-brand-50/60 px-4 py-3 text-sm">
                  <p className="font-semibold text-brand-900">Réponse de {name}</p>
                  <p className="mt-1 whitespace-pre-line text-slate-700">{r.reponse}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5">
        {!account ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><Link href={`/compte?next=${encodeURIComponent(path + "#avis")}`} className="font-semibold text-brand-800 hover:underline">Connectez-vous</Link> pour noter ce professionnel (réservé aux clients qui l’ont contacté via Moboo).</p>
        ) : can?.eligible ? (
          <ProReviewForm refId={refId} path={path} qualities={qualities} initial={can.mon_avis} certified={can.certified} />
        ) : can?.mon_avis ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Merci, votre avis est enregistré.</p>
        ) : can?.reason ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{can.reason}</p>
        ) : null}
      </div>
    </section>
  );
}
