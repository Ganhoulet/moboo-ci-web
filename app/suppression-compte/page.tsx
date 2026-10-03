import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { getSession, displayName } from "@/lib/session";
import { DeletionTabs } from "@/components/deletion-flow";

export const metadata: Metadata = {
  title: "Supprimer mon compte",
  description: "Demandez la suppression de votre compte Moboo.ci (site et application) et de vos données personnelles.",
  alternates: { canonical: "/suppression-compte" },
};
export const dynamic = "force-dynamic";

/** Page exigée par Google Play / l'App Store : suppression du compte sans passer par l'application. */
export default async function DeletionPage() {
  const { legal } = await getSiteSettings();
  const session = getSession();
  const days = legal.deletionGraceDays;
  return (
    <div className="bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6 text-slate-700">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Supprimer mon compte</h1>
            <p className="mt-2">{legal.deletionIntro}</p>
          </div>

          <section>
            <h2 className="font-display text-lg font-bold text-ink">Comment ça marche</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
              <li>Connectez-vous, ou indiquez le numéro de téléphone du compte : nous envoyons un code pour vérifier qu’il vous appartient.</li>
              <li>Votre compte est <strong>désactivé immédiatement</strong> : vous êtes déconnecté et vos annonces ne sont plus visibles.</li>
              <li>{days > 0 ? <>Il est <strong>supprimé définitivement au bout de {days} jours</strong>. Pendant ce délai, vous pouvez annuler depuis cette page.</> : <>Il est <strong>supprimé définitivement</strong> aussitôt.</>}</li>
              <li>Depuis l’application Moboo.ci ou Moboo Pro, cette même page est accessible à l’adresse <strong>moboo.ci/suppression-compte</strong>.</li>
            </ol>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <h3 className="font-semibold text-ink">Supprimé</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                <li>Nom, numéro, e-mail, photo, identifiant et mot de passe</li>
                <li>Annonces publiées et leurs coordonnées</li>
                <li>Favoris, recherches et alertes enregistrées</li>
                <li>Documents envoyés pour la vérification du compte</li>
                <li>Historique de connexion et appareils</li>
                <li>Votre nom est remplacé par « Utilisateur supprimé » dans vos messages et avis</li>
              </ul>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <h3 className="font-semibold text-ink">Conservé (obligation légale)</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                <li>Factures et paiements : 10 ans (obligations comptables OHADA)</li>
                <li>Traces techniques de sécurité anonymisées : 12 mois au plus</li>
              </ul>
              <p className="mt-3 text-xs text-muted">Ces données ne sont plus rattachées à un profil et ne sont utilisées pour aucune autre finalité.</p>
            </div>
          </section>

          <p className="text-sm">
            Une question ? Écrivez à <a href={`mailto:${legal.contactEmail}`} className="font-semibold text-brand-800 hover:underline">{legal.contactEmail}</a>
            {legal.contactPhone ? <> ou au {legal.contactPhone}</> : null}. Voir aussi notre <Link href="/confidentialite" className="font-semibold text-brand-800 hover:underline">politique de confidentialité</Link>.
          </p>
        </div>

        <div className="lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
            <DeletionTabs days={days} loggedIn={!!session} name={session ? displayName(session) : ""} />
          </div>
        </div>
      </div>
    </div>
  );
}
