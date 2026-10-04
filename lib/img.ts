/**
 * Photos optimisées : les photos des annonces (moboo.ci/wp-content, stockage Supabase…)
 * passent par /img, qui les redimensionne à la largeur affichée, les convertit en WebP
 * et les fait garder en cache par le CDN (Vercel). Une photo de 2–4 Mo devient ~60–150 Ko.
 * Les autres adresses (data:, Unsplash…) sont laissées telles quelles.
 * Désactivable avec NEXT_PUBLIC_IMAGE_OPTIMIZER=off.
 */
export const IMG_WIDTHS = [320, 480, 640, 960, 1280, 1600] as const;

const ENABLED = process.env.NEXT_PUBLIC_IMAGE_OPTIMIZER !== "off";
const EXTRA = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);

/** Hôtes dont les photos peuvent être optimisées (évite que /img serve de proxy ouvert). */
export function allowedImageHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "moboo.ci" || h.endsWith(".moboo.ci")) return true;
  if (h.endsWith(".supabase.co") || h === "res.cloudinary.com" || h.endsWith(".onrender.com")) return true;
  if (EXTRA.includes(h)) return true;
  return process.env.NODE_ENV !== "production" && (h === "localhost" || h === "127.0.0.1");
}

function optimizable(src: string | null | undefined): src is string {
  if (!ENABLED || !src || !/^https?:\/\//i.test(src)) return false;
  try {
    const u = new URL(src);
    return allowedImageHost(u.hostname) && !/\.svg(\?|$)/i.test(u.pathname) && !/\.gif(\?|$)/i.test(u.pathname);
  } catch { return false; }
}

const snap = (w: number) => IMG_WIDTHS.find((x) => x >= w) ?? IMG_WIDTHS[IMG_WIDTHS.length - 1];

/** Adresse de la photo à la largeur demandée (arrondie au palier supérieur). */
export function img(src: string | null | undefined, width: number): string {
  if (!optimizable(src)) return src ?? "";
  return `/img?u=${encodeURIComponent(src)}&w=${snap(width)}`;
}

/** Attributs src / srcSet / sizes pour une balise <img> (le navigateur choisit la taille utile). */
export function imgProps(src: string | null | undefined, opts: { width: number; sizes: string }) {
  if (!optimizable(src)) return { src: src ?? "" };
  const top = snap(opts.width * 2);
  const widths = IMG_WIDTHS.filter((w) => w <= top);
  return {
    src: img(src, opts.width),
    srcSet: widths.map((w) => `${img(src, w)} ${w}w`).join(", "),
    sizes: opts.sizes,
  };
}
