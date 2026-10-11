import type { Metadata } from "next";
import { RecoveryForm } from "./recovery-form";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

/** Lien reçu avec un conseiller Moboo : le client choisit lui-même son nouveau mot de passe. */
export default function Recuperation({ searchParams }: { searchParams: { t?: string } }) {
  return (
    <div className="container-page flex justify-center py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card sm:p-8">
        <h1 className="font-display text-2xl font-extrabold text-ink">Choisissez votre nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-muted">Ce lien vous a été envoyé à votre demande, avec votre conseiller Moboo. Personne d’autre que vous ne connaîtra ce mot de passe.</p>
        {searchParams.t ? <RecoveryForm token={searchParams.t} /> : <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">Lien incomplet : ouvrez le lien reçu par message ou par e-mail.</p>}
      </div>
    </div>
  );
}
