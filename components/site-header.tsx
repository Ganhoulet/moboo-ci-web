import Link from "next/link";
import { MobooLogo } from "./logo";

const NAV = [
  { href: "/annonces?transaction=rent", label: "Louer" },
  { href: "/annonces?transaction=sale", label: "Acheter" },
  { href: "/annonces?transaction=furnished", label: "Meublés" },
  { href: "/annonces?transaction=event", label: "Espaces" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label="Accueil Moboo">
          <MobooLogo />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-brand-800">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/annonces?reservable=1"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 sm:inline-flex"
          >
            Réserver
          </Link>
          <button
            aria-label="Mon compte"
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
