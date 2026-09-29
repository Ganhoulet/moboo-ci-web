import Link from "next/link";
import { getReviews } from "@/lib/community";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { getSiteSettings } from "@/lib/settings";
import { ReviewForm } from "./review-form";

/** Étoiles (note sur 5, demi-étoile arrondie à l'entier le plus proche). */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i <= full ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} aria-hidden="true">
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Avis d'une annonce ou d'un pro : moyenne, répartition, liste et formulaire
 * (compte connecté, un avis par cible, modéré selon le réglage du back-office).
 */
export async function ReviewsSection({ type, id, path }: { type: "listing" | "pro"; id: string; path: string }) {
  const settings = await getSiteSettings();
  const cfg = settings.reviews;
  if (!cfg.enabled || (type === "listing" ? !cfg.onListings : !cfg.onPros)) return null;
  const data = await getReviews(type, id);
  if (!data.enabled) return null;
  const account = getSession();
  let mine: { own: boolean; review: { status: string } | null } | null = null;
  if (account) {
    const r = await authedFetch(`/site/me/reviews?type=${type}&id=${encodeURIComponent(id)}`, { method: "GET" });
    if (r.ok) mine = r.data;
  }

  return (
    <section id="avis" className="scroll-mt-24">
      <h2 className="font-display text-xl font-bold text-ink">Avis {data.count ? <span className="text-muted">({data.count})</span> : null}</h2>
      {data.count ? (
        <div className="mt-4 flex flex-wrap items-center gap-6 rounded-2xl bg-slate-50 p-5">
          <div className="text-center">
            <p className="font-display text-4xl font-black text-ink">{data.average.toLocaleString("fr-FR")}</p>
            <Stars value={data.average} />
            <p className="mt-1 text-xs text-muted">{data.count} avis</p>
          </div>
          <div className="min-w-[12rem] flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = data.distribution[n - 1] ?? 0;
              return (
                <div key={n} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-3">{n}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${data.count ? (c / data.count) * 100 : 0}%` }} /></span>
                  <span className="w-6 text-right">{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : <p className="mt-2 text-sm text-muted">Aucun avis pour l’instant.</p>}

      {data.items.length ? (
        <ul className="mt-5 divide-y divide-slate-100">
          {data.items.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{r.authorName.charAt(0).toUpperCase()}</span>
                <span className="font-semibold text-ink">{r.authorName}</span>
                <Stars value={r.rating} size={14} />
                <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
              </div>
              {r.title ? <p className="mt-2 font-semibold text-ink">{r.title}</p> : null}
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.comment}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5">
        {!account ? (
          <p className="text-sm text-slate-600"><Link href={`/compte?next=${encodeURIComponent(path + "#avis")}`} className="font-semibold text-brand-800 hover:underline">Connectez-vous</Link> pour donner votre avis.</p>
        ) : mine?.own ? null : mine?.review ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            {mine.review.status === "pending" ? "Merci ! Votre avis sera publié après validation." : mine.review.status === "rejected" ? "Votre avis n’a pas été retenu." : "Merci pour votre avis !"}
          </p>
        ) : (
          <ReviewForm type={type} id={id} path={path} intro={cfg.intro} moderation={cfg.moderation} />
        )}
      </div>
    </section>
  );
}
