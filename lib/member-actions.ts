// Actions de l'espace membre réglables dans le back-office (Formulaires → Espace membre).
// Même catalogue que l'API (src/modules/site-settings/member-actions.ts), qui refuse
// une action coupée ; ici on masque les boutons marqués data-action="clé".

export interface MemberAction { key: string; label: string; tab: string; hint?: string }

export const MEMBER_ACTIONS: MemberAction[] = [
  { key: "listing.edit", label: "Modifier une annonce", tab: "annonces" },
  { key: "listing.status", label: "Mettre en pause, remettre en ligne, marquer loué / vendu", tab: "annonces" },
  { key: "listing.feature", label: "Sponsoriser (mettre en vedette)", tab: "annonces" },
  { key: "listing.duplicate", label: "Dupliquer une annonce", tab: "annonces" },
  { key: "listing.delete", label: "Supprimer une annonce", tab: "annonces" },
  { key: "inquiry.update", label: "Changer l'étape et les notes d'une demande", tab: "demandes" },
  { key: "inquiry.chat", label: "Répondre à une demande par la messagerie", tab: "demandes" },
  { key: "message.send", label: "Envoyer des messages", tab: "messages", hint: "Site et application" },
  { key: "pro.edit", label: "Modifier sa page pro (présentation, zones, réseaux)", tab: "pagepro" },
  { key: "pro.media", label: "Ajouter ou retirer des photos et vidéos de sa page pro", tab: "pagepro" },
  { key: "pro.leaveAgency", label: "Quitter son agence", tab: "pagepro" },
  { key: "team.manage", label: "Ajouter, modifier, retirer des agents", tab: "equipe", hint: "Site et application" },
  { key: "deals.manage", label: "Déclarer des biens vendus ou loués", tab: "realisations" },
  { key: "reviews.reply", label: "Répondre aux avis clients", tab: "avis" },
  { key: "booking.cancel", label: "Annuler une réservation", tab: "reservations" },
  { key: "dispute.manage", label: "Ouvrir et suivre un litige", tab: "reservations" },
  { key: "alerts.manage", label: "Créer, modifier, supprimer des alertes", tab: "recherches" },
  { key: "package.checkout", label: "Souscrire ou changer de forfait", tab: "forfait" },
  { key: "ads.topup", label: "Recharger ses crédits publicité", tab: "publicite" },
  { key: "ads.boost", label: "Booster une annonce par zone", tab: "publicite" },
  { key: "ads.showcase", label: "Mettre une annonce en vitrine", tab: "publicite" },
  { key: "ads.partner", label: "Devenir partenaire de zone", tab: "publicite" },
  { key: "ads.campaigns", label: "Créer des bannières publicitaires", tab: "publicite" },
  { key: "api.keys", label: "Créer des clés API et webhooks", tab: "api" },
  { key: "profile.edit", label: "Modifier son profil (nom, photo, coordonnées)", tab: "profil" },
  { key: "profile.password", label: "Créer ou changer son mot de passe", tab: "profil" },
  { key: "profile.google", label: "Lier un compte Google", tab: "profil" },
  { key: "verification.submit", label: "Envoyer ses documents de vérification", tab: "verification", hint: "Site et application" },
];
