import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { MobooLogo } from "@/components/logo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Moboo.ci — Louer, acheter & réserver en Côte d'Ivoire",
    template: "%s · Moboo.ci",
  },
  description:
    "L'immobilier en Côte d'Ivoire : biens à louer, à vendre, résidences meublées et espaces événementiels. Réservation en ligne sécurisée quand c'est possible.",
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
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen font-sans">
        <SiteHeader />
        <main>{children}</main>
        <footer className="mt-20 border-t border-slate-200 bg-white">
          <div className="container-page flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <MobooLogo />
              <p className="mt-2 text-sm text-muted">
                Louer, acheter, réserver — l'immobilier en Côte d'Ivoire.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <Link href="/annonces?transaction=rent" className="hover:text-ink">Louer</Link>
              <Link href="/annonces?transaction=sale" className="hover:text-ink">Acheter</Link>
              <Link href="/reserver" className="hover:text-ink">Réserver</Link>
              <a href="https://moboo.ci/blog" className="hover:text-ink">Blog</a>
              <span className="text-slate-400">© {new Date().getFullYear()} Moboo</span>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
