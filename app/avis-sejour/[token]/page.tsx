import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StayReviewForm } from "@/components/stays/review-form";
import { getReviewForm } from "@/lib/stays";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Votre avis sur votre séjour", robots: { index: false, follow: false } };

const day = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });

/** Avis d'un séjour réellement effectué (lien reçu le lendemain du départ). */
export default async function StayReviewPage({ params }: { params: { token: string } }) {
  const f = await getReviewForm(params.token);
  if (!f) notFound();
  return (
    <div className="container-page max-w-2xl py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Séjour vérifié</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">{f.firstName ? `${f.firstName}, comment` : "Comment"} s’est passé votre séjour ?</h1>
      <p className="mt-2 text-muted">{f.residence.name}{f.residence.place ? ` · ${f.residence.place}` : ""} · du {day(f.stay.from)} au {day(f.stay.to)}</p>
      <div className="mt-6">
        {f.alreadyReviewed ? (
          <p className="rounded-2xl bg-white p-6 text-ink ring-1 ring-slate-200">Vous avez déjà donné votre avis sur ce séjour. Merci !</p>
        ) : !f.allowed ? (
          <p className="rounded-2xl bg-white p-6 text-ink ring-1 ring-slate-200">Vous pourrez donner votre avis après votre séjour.</p>
        ) : (
          <StayReviewForm token={params.token} qualities={f.qualities} place={f.residence.name} />
        )}
      </div>
      {f.residence.href ? <p className="mt-6 text-sm"><Link href={f.residence.href} className="font-semibold text-ink underline">Voir la page de la résidence</Link></p> : null}
      <p className="mt-6 text-xs text-muted">Seuls les voyageurs qui ont réellement séjourné (arrivée enregistrée) peuvent laisser un avis. Votre prénom et l’initiale de votre nom apparaissent avec l’avis.</p>
    </div>
  );
}
