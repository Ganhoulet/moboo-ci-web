// Titre de la fiche pour Google : type, transaction et lieu, ce que les gens cherchent
// (« terrain à vendre Songon »). Le titre saisi par l'annonceur reste affiché tel quel sur la page.

const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement", maison: "Maison", villa: "Villa", studio: "Studio",
  terrain: "Terrain", bureau: "Bureau", magasin: "Magasin", autre: "Bien",
};
const MAX = 60; // au-delà, Google coupe le titre (« · Moboo.ci » est ajouté par le site)

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Texte saisi entièrement en majuscules : remis en minuscules, première lettre en majuscule. */
const unshout = (s: string) => {
  const t = s.trim().replace(/\s+/g, " ");
  const letters = t.replace(/[^\p{L}]/gu, "");
  if (letters.length < 4 || letters !== letters.toUpperCase()) return t;
  const low = t.toLowerCase();
  return low.charAt(0).toUpperCase() + low.slice(1);
};
const cut = (s: string, n: number) => {
  if (s.length <= n) return s;
  const c = s.slice(0, n);
  return c.slice(0, c.lastIndexOf(" ") > n * 0.6 ? c.lastIndexOf(" ") : n).replace(/[\s,;:.–-]+$/, "");
};

type L = { title: string; propertyType?: string | null; transaction: string; quartier?: string | null; commune?: string | null; city?: string | null };

/** Lieu sans doublon (« Songon, SONGON » → « Songon »). */
export function listingZone(l: L): string {
  const seen = new Set<string>();
  return [l.quartier, l.commune, l.city].map((x) => unshout(String(x ?? ""))).filter((x) => {
    const k = plain(x);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).join(", ");
}

export function listingSeoTitle(l: L): string {
  const title = unshout(l.title);
  const place = unshout(String(l.commune || l.quartier || l.city || ""));
  const hay = plain(title);
  const saysDeal = /\b(louer|location|vendre|vente)\b/.test(hay);
  if (place && hay.includes(plain(place)) && saysDeal) return cut(title, MAX);
  const head = `${TYPE_LABEL[l.propertyType ?? ""] ?? "Bien"} ${l.transaction === "rent" ? "à louer" : "à vendre"}${place ? ` à ${place}` : ""}`;
  return cut(`${head} : ${title}`, MAX);
}
