import Link from "next/link";
import { MobooLogo } from "./logo";
import type { ChromeContent } from "@/lib/page-blocks";
import type { SiteSettings } from "@/lib/settings";

const isExternal = (h: string) => /^https?:\/\//.test(h);
const A = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
  isExternal(href) ? <a href={href} className={className}>{children}</a> : <Link href={href} className={className}>{children}</Link>;

/** Pied de page composé dans le back-office (Apparence → Menu et pied de page). */
export function SiteFooter({ chrome, settings }: { chrome: ChromeContent; settings: SiteSettings }) {
  const { footer } = chrome;
  const { branding, header } = settings;
  const socials = [["Facebook", header.facebookUrl], ["Instagram", header.instagramUrl], ["TikTok", header.tiktokUrl], ["LinkedIn", header.linkedinUrl], ["YouTube", header.youtubeUrl]]
    .filter(([, u]) => u) as [string, string][];
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50 print:hidden">
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <MobooLogo src={branding.logoUrl} height={branding.logoHeight} alt={branding.siteName} />
          <p className="mt-3 max-w-sm text-sm text-muted">{footer.about || branding.footerTagline}</p>
          {socials.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-ink">{n}</a>)}
            </div>
          ) : null}
          {footer.showApps ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={footer.playStoreUrl || "https://play.google.com/store/search?q=moboo.ci"} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white">▶ Google Play</a>
              {footer.appStoreUrl ? <a href={footer.appStoreUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white"> App Store</a> : null}
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footer.columns.map((c, i) => (
            <div key={i}>
              <p className="text-sm font-semibold text-ink">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.filter((l) => l.label && l.href).map((l, j) => <li key={j}><A href={l.href} className="text-sm text-slate-600 hover:text-ink hover:underline">{l.label}</A></li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="container-page py-5 text-xs text-slate-500">{footer.bottomText.replace("{year}", String(new Date().getFullYear()))}</div>
      </div>
    </footer>
  );
}
