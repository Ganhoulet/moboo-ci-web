import Link from "next/link";
import { MobooLogo } from "./logo";
import { MobileMenu } from "./nav-menu";
import type { SiteSettings } from "@/lib/settings";
import type { MenuItem } from "@/lib/menus";

const BG = {
  brand: "bg-brand-800",
  accent: "bg-accent-600",
  dark: "bg-ink",
  white: "border-b border-slate-200 bg-white",
} as const;

/** Barre de recherche du téléphone : envoie vers les annonces (même recherche que l'accueil). */
function SearchPill({ placeholder }: { placeholder: string }) {
  return (
    <form action="/annonces" role="search" className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3.5 py-2 shadow-sm ring-1 ring-black/5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-accent-600" aria-hidden="true">
        <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" />
      </svg>
      <input name="q" type="search" enterKeyHint="search" placeholder={placeholder} aria-label="Rechercher une annonce"
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-slate-500" />
    </form>
  );
}

/**
 * En-tête du téléphone (back-office → En-têtes → Téléphone) : collé en haut pendant le défilement,
 * façon application (menu ☰ + recherche), ou logo + boutons avec la recherche dessous.
 */
export function MobileHeader({ settings, menu, actions }: { settings: SiteSettings; menu: MenuItem[]; actions: React.ReactNode }) {
  const { header, branding } = settings;
  const color = BG[header.mobileHeaderColor] ?? BG.brand;
  const tone = header.mobileHeaderColor === "white" ? "light" : "dark";
  const search = <SearchPill placeholder={header.mobileSearchPlaceholder || "Commune, quartier, ville…"} />;
  if (header.mobileHeaderStyle === "logo_search") {
    return (
      <header className={`print:hidden sticky top-0 z-40 md:hidden ${color}`}>
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <Link href="/" aria-label="Accueil" className="shrink-0">
            <MobooLogo src={branding.logoUrl} height={Math.min(branding.logoHeight, 34)} alt={branding.siteName} tone={branding.logoUrl ? "light" : tone} />
          </Link>
          {actions}
        </div>
        <div className="px-4 pb-3">{search}</div>
      </header>
    );
  }
  return (
    <header className={`print:hidden sticky top-0 z-40 md:hidden ${color}`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        {menu.length ? <MobileMenu items={menu} tone={tone} className={tone === "dark" ? "border-transparent" : ""} /> : (
          <Link href="/" aria-label="Accueil" className="shrink-0">
            <MobooLogo src={branding.logoUrl} height={28} alt={branding.siteName} tone={branding.logoUrl ? "light" : tone} />
          </Link>
        )}
        {search}
      </div>
    </header>
  );
}
