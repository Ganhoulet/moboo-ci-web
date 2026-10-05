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
  // Après la bascule du domaine moboo.ci (WordPress arrêté) :
  // - l'application Moboo.ci (Houzi) appelle toujours moboo.ci/wp-json/… : ces appels
  //   sont transmis à la passerelle Houzi de l'API, même pour les téléphones qui n'ont
  //   pas encore relu leur configuration ;
  // - les anciens liens de photos moboo.ci/wp-content/uploads/… (partagés, indexés)
  //   pointent sur leur copie dans le stockage Moboo (WP_MEDIA_BASE_URL, facultatif).
  async rewrites() {
    const api = (process.env.NEXT_PUBLIC_API_URL || 'https://resi.moboo.ci/api/v1').replace(/\/+$/, '');
    const media = (process.env.WP_MEDIA_BASE_URL || '').replace(/\/+$/, '');
    return {
      beforeFiles: [
        { source: '/wp-json', destination: `${api}/wp-json` },
        { source: '/wp-json/:path*', destination: `${api}/wp-json/:path*` },
        ...(media ? [{ source: '/wp-content/uploads/:path*', destination: `${media}/:path*` }] : []),
      ],
    };
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
