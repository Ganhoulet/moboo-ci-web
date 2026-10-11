// Adresses d'annonces descriptives : /annonce/villa-4-pieces-a-louer-riviera-cocody-<uuid>.
// L'identifiant reste à la fin (lu par la page) ; le texte devant sert à Google et aux visiteurs.

const UUID = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export interface ListingUrlFields {
  id: string; title?: string | null; transaction?: string | null; listingKind?: string | null;
  quartier?: string | null; commune?: string | null; city?: string | null;
}

/** Partie descriptive : titre + « à louer / à vendre » + quartier + commune, sans mots répétés, 80 caractères max. */
export function listingSlug(l: ListingUrlFields): string {
  const tx = l.listingKind === "furnished" ? "meuble" : l.transaction === "rent" ? "a louer" : l.transaction === "sale" ? "a vendre" : "";
  const words = slugify([l.title, tx, l.quartier, l.commune || l.city].filter(Boolean).join(" ")).split("-").filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    if ([...out, w].join("-").length > 80) break;
    out.push(w);
  }
  return out.join("-");
}

/** Chemin public d'une annonce. */
export function listingPath(l: ListingUrlFields): string {
  const s = listingSlug(l);
  return `/annonce/${s ? `${s}-` : ""}${l.id}`;
}

/** Identifiant d'annonce dans un segment d'adresse (ancien format : identifiant seul). */
export function listingIdFrom(segment: string): string {
  const s = decodeURIComponent(segment || "");
  return s.match(UUID)?.[1] ?? s;
}
