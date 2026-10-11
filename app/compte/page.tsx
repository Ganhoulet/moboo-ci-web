import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginPanel } from "@/components/login-panel";
import { GOOGLE_CLIENT_ID } from "@/lib/google";
import { getSiteSettings } from "@/lib/settings";
import { firebaseConfigFrom } from "@/lib/firebase-phone";
import { safeNext } from "@/lib/two-factor";

export const metadata: Metadata = {
  title: "Se connecter",
  description: "Connectez-vous à Moboo.ci pour retrouver vos favoris, vos annonces, vos réservations et vos alertes.",
};

export const dynamic = "force-dynamic";

/** Connexion. Une fois connecté, tout se passe dans l'espace compte (/mon-espace). */
export default async function ComptePage({ searchParams }: { searchParams: { bienvenue?: string; mode?: string; next?: string; tel?: string; profil?: string } }) {
  const account = getSession();
  // Page à ouvrir après la connexion (ex. publication d'une annonce depuis /publier).
  const next = searchParams.next ? safeNext(searchParams.next) : undefined;
  const suite = next ? `?${new URLSearchParams({ next, ...(searchParams.profil ? { type: searchParams.profil } : {}), ...(searchParams.tel ? { tel: searchParams.tel } : {}) }).toString()}` : "";
  if (account) redirect(account.onboarded ? (next ?? `/mon-espace${searchParams.bienvenue ? "?bienvenue=1" : ""}`) : `/inscription${suite}`);
  const publishing = !!next?.startsWith("/mon-espace/annonces/nouvelle");
  const { auth } = await getSiteSettings(); // méthodes de connexion (back-office)

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{publishing ? "Connectez-vous pour publier" : "Se connecter"}</h1>
        <p className="mt-2 text-muted">{publishing ? "Votre annonce sera rattachée à votre compte : vous la modifierez, suivrez ses vues et recevrez les demandes dans votre espace. Pas encore de compte ? Créez-le en 1 minute ci-dessous." : auth.loginIntro}</p>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
          <LoginPanel
            initialMode={searchParams.mode === "identifiant" ? "identifiant" : "telephone"}
            googleClientId={auth.loginGoogle ? GOOGLE_CLIENT_ID : undefined}
            methods={{ phone: auth.loginPhone, password: auth.loginPassword }}
            firebase={firebaseConfigFrom(auth)}
            next={next}
            phone={searchParams.tel?.replace(/[^\d+ ]/g, "").slice(0, 20)}
          />
        </div>
        {auth.signupEnabled ? <div className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-5 text-center">
          <p className="font-semibold text-ink">Pas encore de compte ?</p>
          <p className="mt-1 text-sm text-slate-600">
            Particulier, propriétaire, agent, agence, promoteur ou hôte : inscription en 1 minute.
          </p>
          <Link href={`/inscription${suite}`} className="btn-primary mt-3 bg-accent-600 hover:bg-accent-700">
            Créer mon compte
          </Link>
        </div> : null}
      </div>
    </div>
  );
}
