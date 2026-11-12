import type { Metadata } from "next";
import { API_URL, formatXOF } from "@/lib/api";
import { DecisionForm } from "./decision-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Demande de réservation", robots: { index: false, follow: false } };

interface View { place: string; guestName: string; dates: string; nights: number; total: number; deposit: number; state: string }

/** Lien reçu par l'hôte : la demande, puis Accepter ou Refuser (sans ouvrir l'application). */
export default async function HostDecisionPage({ params, searchParams }: { params: { token: string }; searchParams: { choix?: string } }) {
  let v: View | null = null;
  let error = "Ce lien n’est plus valable. Répondez depuis l’application Moboo Resi.";
  try {
    const res = await fetch(`${API_URL}/marketplace/host-decision/${encodeURIComponent(params.token)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) v = data as View; else error = data?.message || error;
  } catch { error = "Service indisponible. Réessayez dans un instant."; }

  return (
    <div className="container-page max-w-lg py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-700">Demande de réservation</p>
        {!v ? <p className="mt-3 text-base text-slate-700">{error}</p> : (
          <>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{v.place}</h1>
            <dl className="mt-4 space-y-2 text-[15px]">
              <div className="flex justify-between gap-3"><dt className="text-slate-600">Voyageur</dt><dd className="font-semibold text-ink">{v.guestName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-600">Dates</dt><dd className="text-right font-semibold text-ink">{v.dates} · {v.nights} nuit{v.nights > 1 ? "s" : ""}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-600">Total du séjour</dt><dd className="font-semibold text-ink">{formatXOF(v.total)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-600">Acompte payé par le voyageur</dt><dd className="font-semibold text-ink">{formatXOF(v.deposit)}</dd></div>
            </dl>
            <p className="mt-4 text-sm text-slate-600">Si vous acceptez, le voyageur reçoit le lien pour payer l’acompte, conservé par Moboo jusqu’à son arrivée. Ses coordonnées vous sont transmises après le paiement.</p>
            <div className="mt-5">
              {v.state === "pending"
                ? <DecisionForm token={params.token} initialChoice={searchParams.choix === "refuser" ? "refuse" : searchParams.choix === "accepter" ? "accept" : null} />
                : <p className="rounded-xl bg-slate-50 p-4 text-base font-semibold text-ink">{v.state === "accepted" ? "Vous avez déjà accepté cette demande." : v.state === "refused" ? "Cette demande est refusée ou annulée." : "Cette demande n’est plus en attente."}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
