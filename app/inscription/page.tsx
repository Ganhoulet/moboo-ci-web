import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupWizard } from "@/components/signup-wizard";
import type { AccountType } from "@/lib/accounts";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte Moboo.ci : particulier, propriétaire, agent immobilier, agence ou promoteur, hôte de résidences meublées et d'espaces.",
};

export const dynamic = "force-dynamic";

export default function InscriptionPage({ searchParams }: { searchParams: { profil?: string } }) {
  const account = getSession();
  // Compte déjà configuré : l'inscription n'a plus lieu d'être (sauf changement de profil).
  if (account?.onboarded && searchParams.profil !== "modifier") redirect("/compte");

  const mode = account ? "complete" : "signup";
  const initial = account
    ? {
        accountType: (account.onboarded ? account.accountType : undefined) as AccountType | undefined,
        accountSubtype: account.accountSubtype ?? undefined,
        accountRole: account.accountRole ?? undefined,
        companyName: account.companyName ?? "",
        commune: account.commune ?? "",
        firstName: account.firstName ?? "",
        lastName: account.lastName ?? "",
        username: account.username ?? "",
        email: account.email ?? "",
      }
    : undefined;

  return (
    <div className="relative overflow-hidden">
      {/* Fond décoratif */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-100 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-brand-100 blur-3xl" />

      <div className="container-page relative py-10">
        <div className="mx-auto max-w-xl">
          <span className="chip bg-accent-50 text-accent-700">
            {mode === "signup" ? "Inscription gratuite · 1 minute" : "Votre profil Moboo.ci"}
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            {mode === "signup" ? "Créer mon compte" : "Choisir mon profil"}
          </h1>
          <p className="mt-2 text-muted">
            {mode === "signup"
              ? "Particulier, propriétaire, agent, entreprise ou hôte : votre espace s'adapte à vous."
              : "Dites-nous qui vous êtes : votre espace Moboo.ci s'adapte à votre activité."}
          </p>
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-card sm:p-8">
            <SignupWizard mode={mode} initial={initial} />
          </div>
        </div>
      </div>
    </div>
  );
}
