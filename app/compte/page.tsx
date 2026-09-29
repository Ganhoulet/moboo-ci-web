import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginFlow } from "@/components/login-flow";

export const metadata: Metadata = {
  title: "Se connecter",
  description: "Connectez-vous à Moboo.ci pour retrouver vos favoris, vos annonces, vos réservations et vos alertes.",
};

export const dynamic = "force-dynamic";

/** Connexion. Une fois connecté, tout se passe dans l'espace compte (/mon-espace). */
export default function ComptePage({ searchParams }: { searchParams: { bienvenue?: string } }) {
  const account = getSession();
  if (account) redirect(account.onboarded ? `/mon-espace${searchParams.bienvenue ? "?bienvenue=1" : ""}` : "/inscription");

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-md">
        <span className="chip bg-brand-50 text-brand-800">Connexion sans mot de passe</span>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Se connecter</h1>
        <p className="mt-2 text-muted">
          Un numéro de téléphone suffit. Retrouvez vos favoris, vos annonces, vos réservations
          et recevez des alertes sur les nouveaux biens.
        </p>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
          <LoginFlow />
        </div>
        <div className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-5 text-center">
          <p className="font-semibold text-ink">Pas encore de compte ?</p>
          <p className="mt-1 text-sm text-slate-600">
            Particulier, propriétaire, agent, agence, promoteur ou hôte : inscription en 1 minute.
          </p>
          <Link href="/inscription" className="btn-primary mt-3 bg-accent-600 hover:bg-accent-700">
            Créer mon compte
          </Link>
        </div>
      </div>
    </div>
  );
}
