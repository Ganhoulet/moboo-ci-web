import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { MobooLogo } from "@/components/logo";
import { TopBar } from "@/components/top-bar";
import { BackToTop, ClientSettings } from "@/components/site-chrome";
import { getSiteSettings } from "@/lib/settings";
import { getSession } from "@/lib/session";
import { LiveNotifications } from "@/components/live-notifications";
import { SearchStrip } from "@/components/search-strip";
import { getTaxonomies } from "@/lib/taxonomies";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

/** Titre, description et favicon réglables dans le back-office (Logos et favicon). */
export async function generateMetadata(): Promise<Metadata> {
  const { branding } = await getSiteSettings();
  return {
    title: { default: branding.seoTitle, template: `%s · ${branding.siteName}` },
    description: branding.seoDescription,
    metadataBase: new URL("https://moboo.ci"),
    openGraph: {
      title: branding.seoTitle,
      description: branding.seoDescription,
      type: "website",
      locale: "fr_CI",
    },
    ...(branding.faviconUrl ? { icons: { icon: branding.faviconUrl, shortcut: branding.faviconUrl } } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const { general, branding, header } = settings;
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen font-sans" style={{ ["--container-max" as string]: `${general.containerWidth}px` }}>
        <ClientSettings favoritesLoginRequired={general.favoritesLoginRequired} loggedIn={!!getSession()} />
        {header.topBarEnabled && (header.topBarText || header.topBarPhone || header.topBarEmail) ? <TopBar h={header} /> : null}
        <SiteHeader settings={settings} />
        {settings.search.headerSearch !== "none" ? <SearchStrip variant={settings.search.headerSearch} pages={settings.search.headerSearchPages} types={(await getTaxonomies()).type} /> : null}
        <main>{children}</main>
        <footer className="mt-20 border-t border-slate-200 bg-white print:hidden">
          <div className="container-page flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <MobooLogo src={branding.logoUrl} height={branding.logoHeight} alt={branding.siteName} />
              <p className="mt-2 text-sm text-muted">{branding.footerTagline}</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <Link href="/annonces?transaction=rent" className="hover:text-ink">Louer</Link>
              <Link href="/annonces?transaction=sale" className="hover:text-ink">Acheter</Link>
              <Link href="/reserver" className="hover:text-ink">Réserver</Link>
              <a href="https://moboo.ci/blog" className="hover:text-ink">Blog</a>
              <Link href="/compte?mode=identifiant" className="font-semibold text-brand-800 hover:text-brand-900">Espace pro</Link>
              <span className="text-slate-400">© {new Date().getFullYear()} Moboo</span>
            </nav>
          </div>
        </footer>
        {general.backToTop ? <BackToTop /> : null}
        {/* Temps réel : une seule connexion par onglet (les cloches lisent son compteur). */}
        {getSession() ? <LiveNotifications /> : null}
      </body>
    </html>
  );
}
