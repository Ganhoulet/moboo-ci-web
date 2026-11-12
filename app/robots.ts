import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://moboo.ci").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/administration", "/mon-espace", "/compte", "/connexion", "/inscription", "/api/", "/hote/", "/paiement/", "/avis-sejour/", "/kit-google/"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
