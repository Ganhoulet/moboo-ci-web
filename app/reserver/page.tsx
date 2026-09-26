import type { Metadata } from "next";
import Link from "next/link";
import { getEspace, getResidence } from "@/lib/api";
import { BookingForm } from "@/components/booking-form";

export const metadata: Metadata = { title: "Réserver" };

const STEPS = [
  { n: "1", t: "Votre demande", d: "Dates + nom & téléphone. Aucun compte, aucun débit." },
  { n: "2", t: "L'hôte confirme", d: "Vous recevez le lien pour payer l'acompte (30 %)." },
  { n: "3", t: "Code d'arrivée", d: "À présenter sur place. L'adresse exacte suit le paiement." },
];

function StepsPanel() {
  return (
    <div className="space-y-3">
      {STEPS.map((s) => (
        <div key={s.n} className="flex gap-3 rounded-xl bg-white p-4 shadow-card">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-800 text-sm font-bold text-white">
            {s.n}
          </span>
          <div>
            <p className="font-semibold text-ink">{s.t}</p>
            <p className="text-sm text-muted">{s.d}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ReserverPage({
  searchParams,
}: {
  searchParams: { type?: string; id?: string };
}) {
  const { type, id } = searchParams;

  // ── Résidence meublée : tunnel complet ──
  if (type === "residence" && id) {
    const r = await getResidence(id);
    if (r) {
      const apts = (r.apartments ?? []).map((a) => ({
        id: a.id,
        type: a.type,
        nightlyPrice: a.nightlyPrice,
      }));
      const zone = [r.commune, r.city].filter(Boolean).join(", ");
      return (
        <div className="container-page py-10">
          <Link href={`/residence/${id}`} className="text-sm font-semibold text-muted hover:text-ink">
            ← {r.name}
          </Link>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Réserver — {r.name}
          </h1>
          {zone ? <p className="mt-1 text-muted">{zone}</p> : null}

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
            <StepsPanel />
            {apts.length > 0 ? (
              <BookingForm apartments={apts} />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-card">
                Aucun logement disponible pour cette résidence pour le moment.
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // ── Espace événementiel : tunnel dédié à venir ──
  if (type === "espace" && id) {
    const e = await getEspace(id);
    return (
      <div className="container-page py-14">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Réserver — {e?.nom ?? "espace"}
          </h1>
          <p className="mt-2 text-muted">
            La réservation en ligne des espaces événementiels arrive très bientôt.
            En attendant, contactez le propriétaire depuis la fiche.
          </p>
          <Link href={`/espace/${id}`} className="btn-ghost mt-6">
            ← Retour à l'espace
          </Link>
        </div>
      </div>
    );
  }

  // ── Fallback ──
  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-extrabold text-ink">Réserver</h1>
        <p className="mt-2 text-muted">Choisissez d'abord un bien à réserver.</p>
        <Link href="/annonces?reservable=1" className="btn-primary mt-6 bg-accent-600 hover:bg-accent-700">
          Voir les biens réservables
        </Link>
      </div>
    </div>
  );
}
