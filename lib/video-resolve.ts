import "server-only";

/**
 * Liens vidéo courts (partagés depuis l'application TikTok ou YouTube) → adresse complète,
 * pour que la vidéo se lise dans l'annonce au lieu d'ouvrir TikTok. Un seul saut de
 * redirection, mis en cache une journée ; en cas d'échec, le lien d'origine est gardé.
 */
const SHORT = /^https?:\/\/(?:vm\.tiktok\.com|vt\.tiktok\.com|(?:www\.|m\.)?tiktok\.com\/t)\/[\w-]+/i;

export async function canonicalVideoUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (!SHORT.test(url)) return url;
  try {
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000),
    });
    const loc = res.headers.get("location") || "";
    const id = loc.match(/\/video\/(\d{8,})/)?.[1];
    return id ? `https://www.tiktok.com/@moboo/video/${id}` : url;
  } catch {
    return url;
  }
}
