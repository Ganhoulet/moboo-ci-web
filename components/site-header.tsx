import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-800 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 11 12 4l8 7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">
            Moboo<span className="text-accent-600">.ci</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <Link href="/marketplace" className="transition hover:text-ink">
            Réserver
          </Link>
          <Link href="/marketplace?type=residence" className="transition hover:text-ink">
            Résidences meublées
          </Link>
          <Link href="/marketplace?type=espace" className="transition hover:text-ink">
            Espaces événementiels
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/marketplace" className="btn-primary">
            Explorer
          </Link>
        </div>
      </div>
    </header>
  );
}
