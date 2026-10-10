// Liens vidéo acceptés sur les pages des pros (miroir de l'API : parseVideoLink).

export type VideoProvider = "youtube" | "tiktok" | "vimeo";
export interface VideoEmbed { provider: VideoProvider; url: string; thumb: string }

export function parseVideoLink(raw: string): VideoEmbed | null {
  let u: URL;
  try { u = new URL(String(raw).trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^(www|m)\./, "");
  let m: RegExpMatchArray | null;
  if (host === "youtu.be" && (m = u.pathname.match(/^\/([\w-]{6,20})/))) return { provider: "youtube", url: `https://www.youtube.com/embed/${m[1]}`, thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` };
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id = u.searchParams.get("v") || u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,20})/)?.[1];
    if (id && /^[\w-]{6,20}$/.test(id)) return { provider: "youtube", url: `https://www.youtube.com/embed/${id}`, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  }
  if ((host === "vimeo.com" || host === "player.vimeo.com") && (m = u.pathname.match(/(\d{5,12})/))) return { provider: "vimeo", url: `https://player.vimeo.com/video/${m[1]}`, thumb: "" };
  if (host === "tiktok.com" && (m = u.pathname.match(/\/video\/(\d{8,25})/))) return { provider: "tiktok", url: `https://www.tiktok.com/embed/v2/${m[1]}`, thumb: "" };
  // Liens courts TikTok (vm.tiktok.com) : reconnus par l'API au moment de l'ajout.
  if (/^(vm|vt)\.tiktok\.com$/.test(u.hostname)) return { provider: "tiktok", url: "", thumb: "" };
  return null;
}

export const PROVIDER_LABEL: Record<VideoProvider, string> = { youtube: "YouTube", tiktok: "TikTok", vimeo: "Vimeo" };

/** Adresse de lecture avec lancement automatique (après un clic de l'utilisateur). */
export function autoplayUrl(provider: string, url: string) {
  if (provider === "youtube") return `${url}?autoplay=1&rel=0&playsinline=1`;
  if (provider === "vimeo") return `${url}?autoplay=1`;
  return url;
}
