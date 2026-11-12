import type { Metadata } from "next";
import { API_URL, formatXOF } from "@/lib/api";
import { PayButton } from "./pay-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Paiement de votre facture", robots: { index: false, follow: false } };

interface View {
  number: string; label: string; amount: number; status: string; createdAt: string; paidAt: string | null; method: string | null;
  billingName: string | null; issuer: { name: string; address: string; taxId: string; note: string };
}

const date = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—");

/** Lien de paiement d'une facture de service (ménage, conciergerie, état des lieux…), avec ou sans compte. */
export default async function PayPage({ params }: { params: { token: string } }) {
  let v: View | null = null;
  let error = "Ce lien de paiement n’est pas valable. Contactez le service client Moboo.";
  try {
    const res = await fetch(`${API_URL}/site/billing/pay/${encodeURIComponent(params.token)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) v = data as View; else if (res.status !== 404) error = data?.message || "Service indisponible. Réessayez dans un instant.";
  } catch { error = "Service indisponible. Réessayez dans un instant."; }

  return (
    <div className="bg-slate-50">
      <div className="container-page max-w-lg py-10 sm:py-16">
        <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200">
          <div className="bg-ink px-6 py-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-400">Facture Moboo</p>
            <p className="mt-1 font-display text-xl font-extrabold">{v ? v.number : "Paiement"}</p>
          </div>
          <div className="p-6">
            {!v ? <p className="text-base text-slate-700">{error}</p> : (
              <>
                <p className="text-sm text-slate-600">{v.billingName ? `${v.billingName}, voici` : "Voici"} le détail de votre facture.</p>
                <dl className="mt-5 space-y-3 text-[15px]">
                  <div className="flex justify-between gap-4"><dt className="text-slate-600">Prestation</dt><dd className="text-right font-semibold text-ink">{v.label}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-600">Émise le</dt><dd className="font-semibold text-ink">{date(v.createdAt)}</dd></div>
                  <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3"><dt className="font-semibold text-ink">Montant</dt><dd className="font-display text-3xl font-black text-ink">{formatXOF(v.amount)}</dd></div>
                </dl>
                <div className="mt-6">
                  {v.status === "paid" ? (
                    <p className="rounded-2xl bg-emerald-50 p-4 text-center text-base font-semibold text-emerald-800">Facture réglée le {date(v.paidAt)}. Merci pour votre confiance !</p>
                  ) : v.status === "cancelled" ? (
                    <p className="rounded-2xl bg-slate-100 p-4 text-center text-base font-semibold text-slate-700">Cette facture a été annulée.</p>
                  ) : (
                    <>
                      <PayButton token={params.token} label={`Payer ${formatXOF(v.amount)}`} />
                      <p className="mt-3 text-center text-xs text-muted">Wave · Orange Money · MTN MoMo · Moov Money · carte bancaire. Paiement sécurisé par Money Fusion.</p>
                    </>
                  )}
                </div>
                {v.issuer?.name ? <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-muted">{[v.issuer.name, v.issuer.address, v.issuer.taxId].filter(Boolean).join(" · ")}{v.issuer.note ? <><br />{v.issuer.note}</> : null}</p> : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
