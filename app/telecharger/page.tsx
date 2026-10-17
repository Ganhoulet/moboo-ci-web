import type { Metadata } from "next";
import { ProStoreButtons } from "@/components/pro-invitation/store-buttons";

export const metadata: Metadata = { title: "Télécharger Moboo Pro", description: "L’application de gestion immobilière des agences, agents et propriétaires en Côte d’Ivoire." };

export default function Telecharger() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-card ring-1 ring-slate-200">
        <h1 className="font-display text-2xl font-extrabold text-ink">Moboo Pro</h1>
        <p className="mt-2 text-sm text-muted">Gestion locative, états des lieux, encaissements Mobile Money, équipe d’agence : tout votre métier dans une application.</p>
        <ProStoreButtons />
        <p className="mt-4 text-xs text-muted"><a href="/abonnements-moboo-pro" className="font-semibold text-brand-800 underline">Voir les abonnements</a></p>
      </div>
    </div>
  );
}
