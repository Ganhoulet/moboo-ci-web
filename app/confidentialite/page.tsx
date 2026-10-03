import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Moboo.ci (site et applications) collecte, utilise et protège vos données personnelles, et comment exercer vos droits.",
  alternates: { canonical: "/confidentialite" },
};
export const revalidate = 300;

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-display text-xl font-bold text-ink">{children}</h2>;
}

/** Politique de confidentialité (exigée par Google Play / l'App Store) — texte modifiable dans le back-office. */
export default async function PrivacyPage() {
  const { legal } = await getSiteSettings();
  const mail = <a href={`mailto:${legal.contactEmail}`} className="font-semibold text-brand-800 hover:underline">{legal.contactEmail}</a>;

  return (
    <div className="bg-white py-10 sm:py-14">
      <article className="mx-auto max-w-3xl px-4 text-[15px] leading-7 text-slate-700 [&_li]:mt-1 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="font-display text-3xl font-extrabold text-ink">Politique de confidentialité</h1>
        <p className="mt-1 text-sm text-muted">Dernière mise à jour : {legal.privacyUpdated}</p>

        {legal.privacyHtml?.trim() ? (
          <div className="prose-moboo mt-6" dangerouslySetInnerHTML={{ __html: legal.privacyHtml }} />
        ) : (
          <>
            <p className="mt-6">
              Cette politique explique quelles données personnelles {legal.companyName} collecte lorsque vous utilisez le site
              <strong> moboo.ci</strong> et les applications <strong>Moboo.ci</strong> et <strong>Moboo Pro</strong>, pourquoi, combien de temps
              nous les gardons et comment exercer vos droits. Elle s’applique conformément à la loi ivoirienne n° 2013-450 du 19 juin 2013
              relative à la protection des données à caractère personnel, sous le contrôle de l’ARTCI.
            </p>

            <H>1. Responsable du traitement</H>
            <p>{legal.companyName}, {legal.companyAddress}. Contact pour vos données personnelles : {mail}{legal.contactPhone ? <>, {legal.contactPhone}</> : null}.</p>

            <H>2. Données que nous collectons</H>
            <ul>
              <li><strong>Compte</strong> : numéro de téléphone (obligatoire), nom, prénom, e-mail, identifiant, mot de passe (stocké chiffré), type de compte (particulier, propriétaire, agent, agence…), ville et commune, photo et informations de profil public si vous en publiez une.</li>
              <li><strong>Connexion Google</strong> (facultative) : identifiant Google, nom, e-mail et photo transmis par Google.</li>
              <li><strong>Annonces</strong> : description du bien, prix, adresse ou position sur la carte, photos et vidéos, coordonnées de contact que vous choisissez d’afficher.</li>
              <li><strong>Échanges</strong> : demandes de contact, de visite ou de réservation, messages entre utilisateurs, avis, signalements.</li>
              <li><strong>Vérification du compte</strong> (professionnels, facultative) : pièce d’identité ou registre du commerce. Ces documents sont stockés dans un espace privé et ne sont jamais publiés.</li>
              <li><strong>Paiements</strong> : forfaits et factures (montant, référence, nom et contact de facturation). Les paiements Wave, Orange Money, MTN, Moov et cartes sont traités par notre prestataire Money Fusion : nous ne recevons jamais vos codes ni vos numéros de carte.</li>
              <li><strong>Utilisation</strong> : favoris, recherches et alertes enregistrées, annonces consultées, clics « Appeler » / « WhatsApp » (statistiques pour les annonceurs).</li>
              <li><strong>Données techniques</strong> : adresse IP, type d’appareil et de navigateur, version de l’application, identifiant d’appareil et jeton de notification (pour vous envoyer des notifications, si vous les acceptez), historique de connexion (sécurité).</li>
              <li><strong>Position</strong> : uniquement si vous l’autorisez dans l’application, pour afficher les biens autour de vous. Vous pouvez retirer cette autorisation à tout moment dans les réglages du téléphone.</li>
              <li><strong>Contacts du téléphone</strong> : uniquement lorsque vous choisissez d’envoyer une annonce à un confrère, l’application ouvre le sélecteur de contacts de votre téléphone. Seul le contact que vous sélectionnez est utilisé pour cet envoi ; votre carnet d’adresses n’est ni copié ni conservé sur nos serveurs.</li>
            </ul>

            <H>3. Pourquoi nous les utilisons</H>
            <ul>
              <li>Créer et sécuriser votre compte (codes de connexion, double authentification, détection des fraudes) — <em>exécution du service</em>.</li>
              <li>Publier vos annonces et mettre en relation annonceurs et personnes intéressées — <em>exécution du service</em>.</li>
              <li>Traiter les paiements et établir les factures — <em>obligation légale et contractuelle</em>.</li>
              <li>Modérer les annonces, traiter les signalements et lutter contre les arnaques — <em>intérêt légitime</em>.</li>
              <li>Vous envoyer des e-mails, messages WhatsApp ou notifications liés à votre compte (codes, demandes reçues, alertes que vous avez créées) — <em>exécution du service</em>.</li>
              <li>Mesurer l’audience et améliorer le site et les applications (statistiques agrégées) — <em>intérêt légitime</em>.</li>
            </ul>
            <p className="mt-2">Nous ne vendons pas vos données personnelles et ne les utilisons pas pour de la publicité ciblée de tiers.</p>

            <H>4. Qui peut les voir</H>
            <ul>
              <li><strong>Les autres utilisateurs</strong> : les informations de vos annonces et de votre profil public, et vos coordonnées lorsque vous contactez un annonceur.</li>
              <li><strong>L’équipe {legal.companyName}</strong>, selon son rôle (support, modération, comptabilité), avec un journal de toutes les actions.</li>
              <li><strong>Nos prestataires techniques</strong>, uniquement pour faire fonctionner le service : hébergement du site et de l’API (Vercel, Render), base de données et stockage des fichiers (Supabase), envoi des e-mails, messages WhatsApp (Meta), connexion Google (Google), paiements (Money Fusion), notifications de l’application (OneSignal), statistiques d’utilisation anonymes et connexion de l’application (Google Firebase).</li>
              <li><strong>Les autorités</strong>, sur demande légale.</li>
            </ul>
            <p className="mt-2">Certains prestataires hébergent des données hors de Côte d’Ivoire (Union européenne, États-Unis). Ces transferts sont encadrés par leurs engagements contractuels de protection des données.</p>

            <H>5. Combien de temps nous les gardons</H>
            <ul>
              <li>Compte et annonces : tant que votre compte est actif. Après une demande de suppression, {legal.deletionGraceDays} jours (délai pour annuler), puis effacement.</li>
              <li>Documents de vérification : effacés à la suppression du compte, ou sur simple demande.</li>
              <li>Factures : 10 ans (obligations comptables OHADA).</li>
              <li>Historique de connexion et traces de sécurité : 12 mois au plus.</li>
              <li>Codes de connexion : quelques minutes (ils expirent et sont stockés chiffrés).</li>
            </ul>

            <H>6. Vos droits</H>
            <p>Vous pouvez à tout moment accéder à vos données, les corriger (depuis « Mon profil »), vous opposer à certains traitements, demander une copie ou leur suppression.</p>
            <ul>
              <li><strong>Supprimer votre compte</strong> : sur la page <Link href="/suppression-compte" className="font-semibold text-brand-800 hover:underline">moboo.ci/suppression-compte</Link>, sans installer l’application.</li>
              <li><strong>Autres demandes</strong> : écrivez à {mail}. Nous répondons sous 30 jours.</li>
              <li>Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l’ARTCI (Autorité de Régulation des Télécommunications/TIC de Côte d’Ivoire).</li>
            </ul>

            <H>7. Sécurité</H>
            <p>Connexions chiffrées (HTTPS), mots de passe et codes stockés chiffrés, double authentification disponible (obligatoire pour l’équipe), accès de l’équipe limité par rôle et journalisé, documents sensibles stockés dans un espace privé.</p>

            <H>8. Cookies et stockage local</H>
            <p>Le site utilise uniquement des cookies nécessaires à son fonctionnement : votre session de connexion et vos préférences (par exemple pour ne pas réafficher une annonce promotionnelle déjà fermée). Aucun cookie publicitaire tiers n’est déposé.</p>

            <H>9. Mineurs</H>
            <p>Les services Moboo.ci sont destinés aux personnes majeures. Nous ne collectons pas sciemment de données concernant des mineurs ; si c’est le cas, contactez-nous pour les faire supprimer.</p>

            <H>10. Modifications</H>
            <p>Nous pouvons mettre à jour cette politique. La date en haut de page indique la dernière version ; en cas de changement important, nous vous prévenons par e-mail ou dans l’application.</p>
          </>
        )}
      </article>
    </div>
  );
}
