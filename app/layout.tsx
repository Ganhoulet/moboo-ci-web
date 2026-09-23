import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Moboo.ci — Réservez résidences meublées & espaces événementiels",
    template: "%s · Moboo.ci",
  },
  description:
    "Réservez en ligne des résidences meublées et des espaces événementiels en Côte d'Ivoire. Paiement sécurisé, confirmation par l'hôte, code d'arrivée.",
  metadataBase: new URL("https://moboo.ci"),
  openGraph: {
    title: "Moboo.ci — Réservation en ligne",
    description:
      "Résidences meublées & espaces événementiels réservables en Côte d'Ivoire.",
    type: "website",
    locale: "fr_CI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <SiteHeader />
        <main>{children}</main>
        <footer className="mt-20 border-t border-slate-200 bg-white">
          <div className="container-page flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-extrabold text-ink">
                Moboo<span className="text-accent-600">.ci</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                Réservez en toute confiance en Côte d'Ivoire.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <Link href="/marketplace" className="hover:text-ink">Réserver</Link>
              <a href="https://moboo.ci/blog" className="hover:text-ink">Blog</a>
              <span className="text-slate-400">© {new Date().getFullYear()} Moboo</span>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
