// Missions Moboo : champs propres à chaque service (formulaire de commande) et
// arguments de la page dédiée. Réalisées par un agent dans Moboo Pro.

import type { MissionKey } from "./site-services";

export interface MissionField { key: string; label: string; type?: "text" | "number" | "select" | "textarea" | "url"; options?: string[]; placeholder?: string }

export const MISSION_FIELDS: Record<MissionKey, MissionField[]> = {
  mise_en_location: [
    { key: "loyer", label: "Loyer souhaité (FCFA / mois)", type: "number" },
    { key: "pieces", label: "Nombre de pièces", type: "number" },
    { key: "meuble", label: "Meublé ?", type: "select", options: ["Non", "Oui"] },
    { key: "disponible", label: "Disponible à partir du", placeholder: "Ex. tout de suite, 1er novembre" },
  ],
  gestion_locative: [
    { key: "nb_biens", label: "Nombre de biens à gérer", type: "number" },
    { key: "loyers_total", label: "Total des loyers mensuels (FCFA)", type: "number" },
    { key: "occupe", label: "Biens déjà loués ?", type: "select", options: ["Oui, tous", "En partie", "Non, à louer"] },
    { key: "residence", label: "Vous résidez", type: "select", options: ["En Côte d’Ivoire", "À l’étranger"] },
  ],
  visite: [
    { key: "lien", label: "Lien de l’annonce (si vous l’avez)", type: "url", placeholder: "https://…" },
    { key: "pays", label: "Vous êtes où ?", placeholder: "Ex. France, Abidjan" },
    { key: "attentes", label: "Points à vérifier", type: "textarea", placeholder: "Ex. humidité, eau, accès, voisinage" },
  ],
  bail: [
    { key: "type_bail", label: "Type de bail", type: "select", options: ["Habitation", "Commercial", "Meublé courte durée"] },
    { key: "loyer", label: "Loyer mensuel (FCFA)", type: "number" },
    { key: "avance", label: "Avance + caution (mois)", type: "number" },
    { key: "locataire", label: "Nom du locataire (si connu)" },
  ],
  photos_annonce: [
    { key: "pieces", label: "Nombre de pièces", type: "number" },
    { key: "transaction", label: "Annonce", type: "select", options: ["À louer", "À vendre", "Meublé"] },
  ],
  avis_valeur: [
    { key: "surface_terrain", label: "Surface du terrain (m²)", type: "number" },
    { key: "pieces", label: "Nombre de pièces", type: "number" },
    { key: "titre", label: "Document", type: "select", options: ["ACD / titre foncier", "Lettre d’attribution", "Attestation villageoise", "Je ne sais pas"] },
    { key: "projet", label: "Projet", type: "select", options: ["Vendre", "Connaître la valeur", "Succession / partage"] },
  ],
  devis_travaux: [
    { key: "travaux", label: "Travaux envisagés", type: "textarea", placeholder: "Ex. peinture, plomberie, carrelage" },
    { key: "budget", label: "Budget indicatif (FCFA)", type: "number" },
  ],
  verif_fonciere: [
    { key: "superficie", label: "Superficie (m²)", type: "number" },
    { key: "document", label: "Document présenté par le vendeur", type: "select", options: ["ACD / titre foncier", "Lettre d’attribution", "Attestation villageoise", "Aucun / je ne sais pas"] },
    { key: "vendeur", label: "Nom du vendeur" },
  ],
  panneau_qr: [
    { key: "quantite", label: "Nombre de panneaux", type: "number" },
    { key: "annonce", label: "Lien de l’annonce (facultatif)", type: "url" },
  ],
};

export const MISSION_POINTS: Record<MissionKey, string[]> = {
  mise_en_location: ["Photos, annonce et visites gérées par un agent", "Dossier du locataire vérifié", "Bail préparé et signé"],
  gestion_locative: ["Loyers encaissés et relancés", "Rapport mensuel dans votre espace", "Idéal pour la diaspora"],
  visite: ["Vidéo et photos du bien", "Compte rendu avant de payer quoi que ce soit", "Agent Moboo vérifié"],
  bail: ["Bail clair et complet", "Avance, caution et clauses particulières", "PDF signé remis aux deux parties"],
  photos_annonce: ["Photos soignées de chaque pièce", "Surfaces mesurées sur place", "Annonce publiée sur moboo.ci"],
  avis_valeur: ["Visite du bien par un agent", "Comparaison avec les ventes du quartier", "Avis écrit remis en PDF"],
  devis_travaux: ["Visite et liste des travaux", "Devis détaillé poste par poste", "Artisans proposés si vous le souhaitez"],
  verif_fonciere: ["Contrôle du document foncier", "Vérification du vendeur et des limites", "Partenaires géomètre, notaire, juriste"],
  panneau_qr: ["Panneau posé sur le bien", "QR code relié à votre annonce", "Les demandes vous sont transmises"],
};
