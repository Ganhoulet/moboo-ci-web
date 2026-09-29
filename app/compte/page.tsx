import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginPanel } from "@/components/login-panel";
import { GOOGLE_CLIENT_ID } from "@/lib/google";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Se connecter",
  description: "Connectez-vous à Moboo.ci pour retrouver vos favoris, vos annonces, vos réservations et vos alertes.",
};

export const dynamic = "force-dynamic";

/** Connexion. Une fois connecté, tout se passe dans l'espace compte (/mon-espace). */
export default async function ComptePage({ searchParams }: { searchParams: { bienvenue?: string; mode?: string } }) {
  const account = getSession();
  if (account) redirect(account.onboarded ? `/mon-espace${searchParams.bienvenue ? "?bienvenue=1" : ""}` : "/inscription");
  const { auth } = await getSiteSettings(); // méthodes de connexion (back-office)

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Se connecter</h1>
        <p className="mt-2 text-muted">{auth.loginIntro}</p>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
          <LoginPanel
            initialMode={searchParams.mode === "identifiant" ? "identifiant" : "telephone"}
            googleClientId={auth.loginGoogle ? GOOGLE_CLIENT_ID : undefined}
            methods={{ phone: auth.loginPhone, password: auth.loginPassword }}
          />
        </div>
        {auth.signupEnabled ? <div className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-5 text-center">
          <p className="font-semibold text-ink">Pas encore de compte ?</p>
          <p className="mt-1 text-sm text-slate-600">
            Particulier, propriétaire, agent, agence, promoteur ou hôte : inscription en 1 minute.
          </p>
          <Link href="/inscription" className="btn-primary mt-3 bg-accent-600 hover:bg-accent-700">
            Créer mon compte
          </Link>
        </div> : null}
      </div>
    </div>
  );
}
