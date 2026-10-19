import { youtubeId } from "./media";

/**
 * Données structurées schema.org (résultats enrichis Google) : fil d'Ariane,
 * organisation Moboo, vidéo d'une annonce. Les adresses sont absolues, comme
 * le demande Google.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://moboo.ci").replace(/\/+$/, "");
export const absUrl = (href: string) => (/^https?:\/\//i.test(href) ? href : `${SITE_URL}${href.startsWith("/") ? "" : "/"}${href}`);

/** Fil d'Ariane : le dernier élément (la page elle-même) peut ne pas avoir d'adresse. */
export function breadcrumbLd(items: { label: string; href?: string }[]) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, ...(it.href ? { item: absUrl(it.href) } : {}) })),
  };
}

/** Moboo (éditeur du site) : nom, logo, réseaux sociaux. */
export function organizationLd(o: { name: string; logoUrl?: string; sameAs?: string[] }) {
  return {
    "@context": "https://schema.org", "@type": "Organization",
    name: o.name || "Moboo.ci", url: SITE_URL,
    logo: o.logoUrl ? absUrl(o.logoUrl) : undefined,
    sameAs: (o.sameAs ?? []).filter((u) => /^https:\/\//i.test(u)),
    areaServed: { "@type": "Country", name: "Côte d’Ivoire" },
  };
}

/** Vidéo de présentation d'une fiche (YouTube, TikTok, Bunny, fichier). Null si pas de miniature possible. */
export function videoLd(v: { url: string | null | undefined; name: string; description?: string | null; thumbnail?: string | null; uploadDate?: string | null }) {
  if (!v.url || !/^https?:\/\//i.test(v.url)) return null;
  const yt = youtubeId(v.url);
  const thumb = yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : v.thumbnail;
  if (!thumb || !v.uploadDate) return null;
  const file = /\.(mp4|webm|mov)(\?|$)/i.test(v.url);
  return {
    "@context": "https://schema.org", "@type": "VideoObject",
    name: v.name,
    description: (v.description || v.name).replace(/\s+/g, " ").trim().slice(0, 500),
    thumbnailUrl: [absUrl(thumb)],
    uploadDate: v.uploadDate,
    ...(file ? { contentUrl: v.url } : { embedUrl: yt ? `https://www.youtube.com/embed/${yt}` : v.url }),
  };
}

/** Balise <script> JSON-LD (« < » échappé : un texte d'annonce ne peut pas fermer la balise). */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
