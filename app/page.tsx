import Link from "next/link";
import { listResidences } from "@/lib/api";
import { ResidenceCard } from "@/components/residence-card";

export const revalidate = 120;

export default async function HomePage() {
  const featured = await listResidences({ perPage: 4 });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-800 to-brand-900" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="container-page relative py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="chip bg-white/10 text-white ring-1 ring-white/20">
              Nouveau · Réservation en ligne
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              Trouvez. Réservez.{" "}
              <span className="text-accent-400">Profitez.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">
              Résidences meublées et espaces événementiels en Côte d'Ivoire —
              réservés en ligne, confirmés par l'hôte, sécurisés de bout en bout.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace?type=residence" className="btn-primary bg-white text-brand-800 hover:bg-brand-50">
                Réserver une résidence
              </Link>
              <Link
                href="/marketplace?type=espace"
                className="btn-ghost border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Réserver un espace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container-page py-16">
        <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
          Comment ça marche
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { n: "1", t: "Réservez", d: "Choisissez vos dates et envoyez votre demande en quelques secondes." },
            { n: "2", t: "L'hôte confirme", d: "Vous ne payez l'acompte qu'une fois la disponibilité confirmée." },
            { n: "3", t: "Code d'arrivée", d: "Recevez votre code, présentez-le à l'arrivée. C'est tout." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-white p-6 shadow-card">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-800 font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold text-ink">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Aperçu résidences */}
      {featured.items.length > 0 && (
        <section className="container-page pb-16">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">À la une</h2>
            <Link href="/marketplace" className="text-sm font-semibold text-brand-800 hover:underline">
              Tout voir →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.map((r) => (
              <ResidenceCard key={r.id} r={r} />
            ))}
          </div>
        </section>
      )}

      {/* Bandeau propriétaires */}
      <section className="container-page pb-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-brand-800 to-brand-900 px-8 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white">Vous êtes propriétaire ?</h2>
            <p className="mt-1 max-w-lg text-brand-100">
              Publiez et gérez vos biens depuis Moboo Resi (résidences) ou
              Moboo Event (espaces). Vos annonces apparaissent ici automatiquement.
            </p>
          </div>
          <a href="https://resi.moboo.ci" className="btn-primary shrink-0 bg-accent-600 hover:bg-accent-700">
            Devenir hôte
          </a>
        </div>
      </section>
    </div>
  );
}
