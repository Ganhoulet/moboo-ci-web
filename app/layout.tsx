import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { TopBar } from "@/components/top-bar";
import { BackToTop, ClientSettings } from "@/components/site-chrome";
import { getSiteSettings } from "@/lib/settings";
import { getSession } from "@/lib/session";
import { LiveNotifications } from "@/components/live-notifications";
import { SearchStrip } from "@/components/search-strip";
import { getTaxonomies } from "@/lib/taxonomies";
import { getChrome } from "@/lib/pages";
import { SiteFooter } from "@/components/site-footer";
import { menuAt } from "@/lib/menus";
import { getCampaigns } from "@/lib/marketing";
import { SitePopup } from "@/components/marketing/site-popup";
import { headers } from "next/headers";
import { getSeoOverride, withSeoOverride } from "@/lib/seo";

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
  // Réglages SEO de la page (back-office → Pages SEO → Pages du site).
  return withSeoOverride(headers().get("x-moboo-path") || "/", {
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
  });
}

/** Texte SEO ajouté en bas d'une page existante (back-office → Pages SEO). */
async function SeoBottom() {
  const o = await getSeoOverride(headers().get("x-moboo-path") || "/");
  if (!o?.content) return null;
  return (
    <section className="container-page border-t border-slate-200 py-10">
      <div className="rich-text mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: o.content }} />
    </section>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, chrome] = await Promise.all([getSiteSettings(), getChrome()]);
  const { general, header } = settings;
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen font-sans" style={{ ["--container-max" as string]: `${general.containerWidth}px` }}>
        <ClientSettings favoritesLoginRequired={general.favoritesLoginRequired} loggedIn={!!getSession()} />
        {header.topBarEnabled && (header.topBarText || header.topBarPhone || header.topBarEmail) ? <TopBar h={header} /> : null}
        <SiteHeader settings={settings} nav={{ items: menuAt(chrome.menus, chrome.locations, "header"), mobile: menuAt(chrome.menus, chrome.locations, "mobile"), style: chrome.menuStyle }} />
        {settings.search.headerSearch !== "none" ? <SearchStrip variant={settings.search.headerSearch} pages={settings.search.headerSearchPages} types={(await getTaxonomies()).type} /> : null}
        <main>{children}</main>
        <SeoBottom />
        <SiteFooter chrome={chrome} settings={settings} />
        {general.backToTop ? <BackToTop /> : null}
        <SitePopup items={await getCampaigns("site_popup")} loggedIn={!!getSession()} />
        {/* Temps réel : une seule connexion par onglet (les cloches lisent son compteur). */}
        {getSession() ? <LiveNotifications /> : null}
      </body>
    </html>
  );
}
