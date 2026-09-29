import Link from "next/link";
import { MobooLogo } from "./logo";
import { FavoritesNavButton } from "./favorites-nav-button";
import { MessagesBell } from "./live-notifications";
import { getSession, initials } from "@/lib/session";
import type { SiteSettings } from "@/lib/settings";
import type { MenuItem, MenuStyle } from "@/lib/menus";
import { MobileMenu, NavMenu } from "./nav-menu";

type Tone = "light" | "dark";

/** Menus composés dans le back-office (Apparence → Menus). */
export interface HeaderNav { items: MenuItem[]; mobile: MenuItem[]; style: MenuStyle }

/** Boutons de droite : Publier, favoris, messages, compte / connexion. */
function Actions({ settings, tone, mobile }: { settings: SiteSettings; tone: Tone; mobile?: MenuItem[] }) {
  const { header, auth } = settings;
  const account = getSession();
  const ghost = tone === "dark" ? "border-white/25 text-white hover:bg-white/10" : "border-slate-200 text-slate-600 hover:bg-slate-50";
  return (
    <div className="flex shrink-0 items-center gap-2">
      {header.showPublishButton ? (
        <Link href="/publier" className="hidden items-center gap-1 rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 sm:inline-flex">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          {header.publishButtonText}
        </Link>
      ) : null}
      <FavoritesNavButton tone={tone} />
      {account ? <MessagesBell tone={tone} /> : null}
      {account?.isAdmin ? (
        <Link href="/admin" title="Back-office" className={"hidden items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition lg:inline-flex " + ghost}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
          Back-office
        </Link>
      ) : null}
      {account ? (
        <Link href="/mon-espace" aria-label="Mon espace"
          className={"grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition " + (tone === "dark" ? "bg-white text-brand-900 hover:bg-brand-50" : "bg-brand-800 text-white hover:bg-brand-900")}>
          {initials(account)}
        </Link>
      ) : (
        <>
          {header.showSignupButton && auth.signupEnabled ? (
            <Link href="/inscription" className={"hidden rounded-full border px-4 py-2 text-sm font-semibold transition md:inline-flex " + (tone === "dark" ? "border-white/25 text-white hover:bg-white/10" : "border-slate-200 text-ink hover:border-slate-300 hover:bg-slate-50")}>
              Créer un compte
            </Link>
          ) : null}
          <Link href="/compte" aria-label="Se connecter" className={"grid h-10 w-10 place-items-center rounded-full border transition " + ghost}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" strokeLinecap="round" /></svg>
          </Link>
        </>
      )}
      {mobile ? <MobileMenu items={mobile} tone={tone} /> : null}
    </div>
  );
}

function Contact({ icon, label, sub, href }: { icon: React.ReactNode; label: string; sub?: string; href?: string }) {
  const body = (
    <span className="flex items-center gap-2.5">
      <span className="text-brand-700">{icon}</span>
      <span className="leading-tight"><span className="block text-sm font-semibold text-ink">{label}</span>{sub ? <span className="block text-xs text-muted">{sub}</span> : null}</span>
    </span>
  );
  return href ? <a href={href} className="hover:opacity-80">{body}</a> : body;
}
const ic = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

/**
 * En-tête du site. Style, largeur et alignement du menu : back-office → « En-têtes
 * et barre du haut ». Sur téléphone, toujours la version compacte (logo + boutons).
 */
export function SiteHeader({ settings, nav }: { settings: SiteSettings; nav: HeaderNav }) {
  const { header, branding } = settings;
  const style = header.headerStyle;
  const wrap = header.headerLayout === "full" ? "w-full px-4 sm:px-6 lg:px-8" : "container-page";
  const logo = (tone: Tone) => (
    <Link href="/" aria-label="Accueil" className="shrink-0">
      <MobooLogo src={branding.logoUrl} height={branding.logoHeight} alt={branding.siteName} tone={branding.logoUrl ? "light" : tone} />
    </Link>
  );

  // Styles à deux étages (ordinateur) : coordonnées ou logo centré, puis barre de menu sombre.
  if (style === "contacts" || style === "centered") {
    const socials = [
      ["Facebook", header.facebookUrl], ["Instagram", header.instagramUrl], ["TikTok", header.tiktokUrl],
      ["LinkedIn", header.linkedinUrl], ["YouTube", header.youtubeUrl],
    ].filter(([, u]) => u) as [string, string][];
    return (
      <>
        {/* Téléphone : compact */}
        <header className="print:hidden sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur md:hidden">
          <div className={`${wrap} flex h-16 items-center justify-between`}>{logo("light")}<Actions settings={settings} tone="light" mobile={nav.mobile} /></div>
        </header>
        <div className="hidden bg-white md:block print:hidden">
          <div className={`${wrap} flex h-20 items-center gap-6 ${style === "centered" ? "justify-between" : ""}`}>
            {style === "contacts" ? (
              <>
                {logo("light")}
                <div className="ml-auto flex items-center gap-8">
                  {header.topBarPhone ? <Contact href={`tel:${header.topBarPhone}`} label={header.topBarPhone} sub={header.topBarEmail || undefined} icon={<svg {...ic}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" strokeLinejoin="round" /></svg>} /> : null}
                  {header.headerAddress ? <Contact label={header.headerAddress} icon={<svg {...ic}><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>} /> : null}
                  {header.headerHours ? <Contact label={header.headerHours} icon={<svg {...ic}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>} /> : null}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-1 gap-3 text-xs font-semibold text-brand-800">
                  {socials.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" className="hover:underline">{n}</a>)}
                </div>
                {logo("light")}
                <div className="flex flex-1 justify-end">
                  {header.showPublishButton ? (
                    <Link href="/publier" className="inline-flex items-center gap-1 rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700">{header.publishButtonText}</Link>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
        <header className="print:hidden sticky top-0 z-40 hidden bg-brand-900 md:block">
          <div className={`${wrap} flex h-14 items-center gap-6`}>
            <NavMenu items={nav.items} style={nav.style} tone="dark" align={style === "centered" ? "center" : header.navAlign} />
            <Actions settings={{ ...settings, header: { ...header, showPublishButton: style === "centered" ? false : header.showPublishButton } }} tone="dark" />
          </div>
        </header>
      </>
    );
  }

  // Styles sur une ligne : classique (blanc) ou sombre.
  const tone: Tone = style === "dark" ? "dark" : "light";
  return (
    <header className={"print:hidden sticky top-0 z-40 " + (tone === "dark" ? "bg-brand-900" : "border-b border-slate-200/70 bg-white/90 backdrop-blur")}>
      <div className={`${wrap} flex h-16 items-center justify-between gap-6`}>
        {logo(tone)}
        <NavMenu items={nav.items} style={nav.style} tone={tone} align={header.navAlign} className="hidden md:flex" />
        <Actions settings={settings} tone={tone} mobile={nav.mobile} />
      </div>
    </header>
  );
}
