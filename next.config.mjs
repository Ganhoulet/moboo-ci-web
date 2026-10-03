/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le « / » final est retiré par le middleware, en un seul saut avec les redirections
  // des anciennes adresses WordPress (au lieu de 308 puis 301).
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // En-têtes de sécurité (HSTS, anti-clickjacking, nosniff, permissions du navigateur).
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), geolocation=(self)' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      ],
    }];
  },
  // Photos d'annonces envoyées par les server actions de l'espace compte (compressées ~0,5 Mo).
  experimental: { serverActions: { bodySizeLimit: '12mb' } }, // photos (~0,5 Mo) et pièces de vérification (PDF ≤ 5 Mo)
  images: {
    // Autorise les photos servies par le stockage Moboo (à ajuster selon le CDN réel).
    remotePatterns: [
      { protocol: 'https', hostname: '**.moboo.ci' },
      { protocol: 'https', hostname: 'moboo.ci' },
      { protocol: 'https', hostname: '**.onrender.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default nextConfig;
