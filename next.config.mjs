/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Photos d'annonces envoyées par les server actions de l'espace compte (compressées ~0,5 Mo).
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
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
