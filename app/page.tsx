import Link from "next/link";
import { listProperties } from "@/lib/property";
import { PropertyCard } from "@/components/property-card";
import { getPartners } from "@/lib/community";

export const revalidate = 120;

export default async function HomePage() {
  const [all, partners] = await Promise.all([listProperties(), getPartners()]);
  const featured = all.slice(0, 8);

  return (
    <div>
      {/* Hero + recherche (identité moboo.ci) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-100 to-slate-50">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-10 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl" />
        <div className="container-page relative py-16 sm:py-24">
          <h1 className="max-w-3xl text-center font-display text-4xl font-black leading-tight tracking-tight text-brand-900 sm:text-6xl mx-auto">
            Quel logement cherchez-vous ?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-muted sm:text-lg">
            À louer, à vendre, meublé ou pour un événement — trouvez votre bien en
            Côte d'Ivoire, et réservez en ligne quand c'est possible.
          </p>

          {/* Carte de recherche */}
          <form
            action="/annonces"
            className="mx-auto mt-8 grid max-w-3xl gap-3 rounded-2xl bg-white p-4 shadow-card sm:grid-cols-[1fr_1fr_auto]"
          >
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <select name="transaction" className="w-full bg-transparent text-sm text-ink outline-none" defaultValue="">
                <option value="">Je cherche à…</option>
                <option value="rent">Louer</option>
                <option value="sale">Acheter</option>
                <option value="furnished">Meublé (courte durée)</option>
                <option value="event">Espace événementiel</option>
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 sm:col-span-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <input
                name="q"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
                placeholder="Rue, quartier, commune"
                aria-label="Lieu"
              />
            </label>

            <button type="submit" className="btn-primary bg-accent-600 hover:bg-accent-700 sm:col-span-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              Rechercher
            </button>
          </form>

          {/* Raccourcis */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              { href: "/annonces?transaction=rent", label: "🏠 À louer" },
              { href: "/annonces?transaction=sale", label: "🔑 À vendre" },
              { href: "/annonces?transaction=furnished", label: "🛏️ Meublés" },
              { href: "/annonces?transaction=event", label: "🎉 Espaces" },
            ].map((c) => (
              <Link key={c.href} href={c.href} className="chip bg-white shadow-sm transition hover:bg-brand-50">
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* À la une */}
      {featured.length > 0 && (
        <section className="container-page py-14">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-ink">À la une</h2>
              <p className="text-sm text-muted">Une sélection de biens disponibles</p>
            </div>
            <Link href="/annonces" className="text-sm font-semibold text-accent-600 hover:underline">
              Tout voir →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Réservation en ligne (spécifique meublé/événementiel) */}
      <section className="bg-brand-900">
        <div className="container-page py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="chip bg-white/10 text-white ring-1 ring-white/20">Nouveau · Réservation en ligne</span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-white sm:text-3xl">
                Meublés & espaces : réservez en 3 étapes
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { n: "1", t: "Réservez", d: "Choisissez vos dates." },
                  { n: "2", t: "L'hôte confirme", d: "Acompte après accord." },
                  { n: "3", t: "Code d'arrivée", d: "À présenter sur place." },
                ].map((s) => (
                  <div key={s.n} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-600 text-sm font-bold text-white">
                      {s.n}
                    </span>
                    <p className="mt-3 font-semibold text-white">{s.t}</p>
                    <p className="text-sm text-brand-100">{s.d}</p>
                  </div>
                ))}
              </div>
              <Link href="/annonces?reservable=1" className="btn-primary mt-6 bg-white text-brand-900 hover:bg-brand-50">
                Voir les biens réservables
              </Link>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 p-8 text-white shadow-card">
              <p className="text-sm/relaxed opacity-90">Vous êtes propriétaire ?</p>
              <p className="mt-1 text-xl font-bold">Publiez depuis Moboo Resi & Event</p>
              <p className="mt-2 text-sm text-white/90">
                Vos annonces apparaissent ici automatiquement. Gérez demandes,
                check-in et paiements dans l'app.
              </p>
              <a href="https://resi.moboo.ci" className="btn-ghost mt-5 border-white/40 bg-white/10 text-white hover:bg-white/20">
                Devenir hôte
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Partenaires (back-office → Immobilier → Partenaires) */}
      {partners.length ? (
        <section className="container-page py-12">
          <h2 className="text-center font-display text-xl font-extrabold text-ink">Ils nous font confiance</h2>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {partners.map((p) => {
              // eslint-disable-next-line @next/next/no-img-element
              const logo = <img src={p.logoUrl} alt={p.name} title={p.name} loading="lazy" className="h-12 w-auto max-w-[9rem] object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0" />;
              return <li key={p.id}>{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{logo}</a> : logo}</li>;
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
