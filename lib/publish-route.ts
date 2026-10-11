// Parcours « Publier une annonce » : la page /publier mène au formulaire complet
// de l'espace membre, après connexion ou inscription si besoin.

export const PUBLISH_FORM = "/mon-espace/annonces/nouvelle";

/** Formulaire de l'espace membre, pré-rempli (location / vente, type de bien). */
export function publishFormHref(cat?: string, type?: string) {
  const q = new URLSearchParams();
  if (cat === "rent" || cat === "sale") q.set("cat", cat);
  if (type && /^[a-z0-9-]{2,40}$/.test(type)) q.set("type", type);
  const s = q.toString();
  return s ? `${PUBLISH_FORM}?${s}` : PUBLISH_FORM;
}

/**
 * Où envoyer le visiteur depuis /publier : meublés et espaces → Moboo Resi / Event ;
 * connecté → formulaire ; sinon → connexion (numéro pré-rempli), puis le formulaire.
 */
export function publishStartHref(o: { cat?: string; type?: string; tel?: string; profil?: string; loggedIn: boolean }) {
  if (o.cat === "short") return "/professionnels/residences";
  const form = publishFormHref(o.cat, o.type);
  if (o.loggedIn) return form;
  const q = new URLSearchParams({ next: form });
  if (o.tel) q.set("tel", o.tel.replace(/[^\d+ ]/g, "").slice(0, 20));
  if (o.profil && ["proprietaire", "agent", "agence"].includes(o.profil)) q.set("profil", o.profil);
  return `/compte?${q.toString()}`;
}
