import sharp from "sharp";
import { IMG_WIDTHS, allowedImageHost } from "@/lib/img";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024;
const YEAR = 31_536_000;

/** Repli : la photo d'origine (redirection), sans la garder longtemps en cache. */
const fallback = (src: string) => new Response(null, { status: 302, headers: { Location: src, "Cache-Control": "public, max-age=300" } });

/**
 * GET /img?u=<photo>&w=<largeur> : photo redimensionnée en WebP (qualité 72, métadonnées retirées),
 * mise en cache un an par le navigateur et le CDN. Hôtes et largeurs limités (pas de proxy ouvert).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const src = url.searchParams.get("u") || "";
  const w = Number(url.searchParams.get("w"));
  let source: URL;
  try { source = new URL(src); } catch { return new Response("Adresse invalide", { status: 400 }); }
  if (!/^https?:$/.test(source.protocol) || !allowedImageHost(source.hostname)) return new Response("Hôte non autorisé", { status: 400 });
  if (!(IMG_WIDTHS as readonly number[]).includes(w)) return new Response("Largeur non autorisée", { status: 400 });

  try {
    const res = await fetch(source, { signal: AbortSignal.timeout(10_000), headers: { Accept: "image/*" }, cache: "no-store" });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.startsWith("image/") || Number(res.headers.get("content-length") || 0) > MAX_BYTES) return fallback(src);
    const input = Buffer.from(await res.arrayBuffer());
    if (input.length > MAX_BYTES) return fallback(src);
    const out = await sharp(input, { failOn: "none", limitInputPixels: 60_000_000 })
      .rotate() // orientation EXIF (photos de téléphone)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 72, effort: 4 })
      .toBuffer();
    return new Response(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": `public, max-age=${YEAR}, immutable`,
        "CDN-Cache-Control": `public, max-age=${YEAR}, immutable`,
        "X-Moboo-Image": `${input.length}->${out.length}`,
      },
    });
  } catch {
    return fallback(src);
  }
}
