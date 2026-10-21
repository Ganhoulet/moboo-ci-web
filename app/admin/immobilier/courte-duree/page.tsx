import { ShortStayReview } from "@/components/backoffice/short-stay-review";
import { listShortStaySuspects } from "../actions";

export const dynamic = "force-dynamic";

/** Immobilier → Courte durée à classer : meublés / espaces publiés par erreur en « À louer ». */
export default async function ShortStayPage() {
  const data = await listShortStaySuspects();
  if (!data) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Liste indisponible.</p>;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Courte durée à classer</h1>
        <p className="max-w-3xl text-sm text-muted">
          Sur Moboo.ci, « À louer » = location longue durée. Les résidences meublées se publient dans Moboo Resi et les espaces événementiels dans Moboo Event.
          Voici les annonces « À louer » qui parlent de meublé, de nuitée ou de prix au jour : choisissez pour chacune. Rien ne bouge sans votre décision.
        </p>
      </div>
      <ShortStayReview initial={data.items} likely={data.likely} />
    </div>
  );
}
