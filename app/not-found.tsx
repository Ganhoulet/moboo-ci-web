import Link from "next/link";
import { Log404 } from "@/components/log-404";

/** Page introuvable : l'adresse est notée (back-office → Redirections et 404) pour créer la redirection manquante. */
export default function NotFound() {
  return (
    <div className="bg-slate-50 py-16 sm:py-24">
      <Log404 />
      <div className="mx-auto max-w-xl px-4 text-center">
        <p className="font-display text-7xl font-black text-brand-800">404</p>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">Cette page est introuvable</h1>
        <p className="mt-2 text-muted">
          L’annonce a peut-être été louée, vendue ou retirée, ou l’adresse a changé avec le nouveau site Moboo.ci.
        </p>
        <form action="/annonces" className="mx-auto mt-6 flex max-w-md gap-2">
          <input name="q" placeholder="Quartier, ville, type de bien…" className="input flex-1" aria-label="Rechercher un bien" />
          <button className="btn-primary bg-accent-600 hover:bg-accent-700">Rechercher</button>
        </form>
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          {[["/annonces?transaction=rent", "Biens à louer"], ["/annonces?transaction=sale", "Biens à vendre"], ["/annonces?transaction=furnished", "Meublés"], ["/", "Accueil"]].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full bg-white px-4 py-2 font-semibold text-brand-800 ring-1 ring-slate-200 hover:ring-brand-400">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
