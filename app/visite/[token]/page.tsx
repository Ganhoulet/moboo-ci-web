import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ma visite | Moboo.ci", robots: { index: false, follow: false } };

interface Visite {
  statut: "DEMANDE" | "CONFIRMEE" | "REFUSEE" | "ANNULEE" | "FAITE"; debut: string; motif: string | null; clientNom: string;
  salle: { nom: string; slug: string | null; commune: string | null; photo: string | null };
  acces: { adresse: string | null; mapsUrl: string | null; wazeUrl: string | null } | null;
}

async function getVisite(token: string): Promise<Visite | null> {
  try {
    const r = await fetch(`${API_URL}/marketplace/visite/${encodeURIComponent(token)}`, { cache: "no-store", headers: { Accept: "application/json" } });
    return r.ok ? ((await r.json()) as Visite) : null;
  } catch { return null; }
}

const quand = (s: string) => new Date(s).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" });
const STATUT: Record<Visite["statut"], [string, string]> = {
  DEMANDE: ["En attente du propriétaire", "bg-amber-50 text-amber-900"],
  CONFIRMEE: ["Visite confirmée", "bg-green-50 text-green-900"],
  REFUSEE: ["Le propriétaire ne peut pas vous recevoir à ce moment", "bg-red-50 text-red-900"],
  ANNULEE: ["Visite annulée", "bg-slate-100 text-slate-700"],
  FAITE: ["Visite effectuée", "bg-slate-100 text-slate-700"],
};

/** Suivi d'une demande de visite : statut, puis adresse et itinéraire une fois confirmée, et lien pour réserver. */
export default async function VisitePage({ params }: { params: { token: string } }) {
  const v = await getVisite(params.token);
  if (!v) notFound();
  const [label, tone] = STATUT[v.statut];
  const fiche = v.salle.slug ? `/espace/${v.salle.slug}` : null;
  return (
    <div className="container-page max-w-xl py-8 sm:py-10">
      <p className="text-sm uppercase tracking-wide text-muted">Visite de salle</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{v.salle.nom}</h1>
      <p className="mt-2 text-lg text-ink first-letter:uppercase">{quand(v.debut)}</p>
      <p className={"mt-4 rounded-lg p-3 text-sm font-semibold " + tone}>{label}{v.motif ? ` : ${v.motif}` : ""}</p>
      {v.statut === "DEMANDE" ? <p className="mt-2 text-sm text-muted">Vous recevrez un message dès que le propriétaire aura répondu. L’adresse exacte s’affiche ici une fois la visite confirmée.</p> : null}
      {v.acces ? (
        <section className="mt-6 space-y-2 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <h2 className="font-display text-lg font-bold text-ink">Adresse</h2>
          <p className="text-ink">{v.acces.adresse ?? "Le propriétaire vous indiquera l’adresse."}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {v.acces.mapsUrl ? <a href={v.acces.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary bg-green-700 hover:bg-green-800">Itinéraire Google Maps</a> : null}
            {v.acces.wazeUrl ? <a href={v.acces.wazeUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-4 py-2 text-sm font-semibold text-sky-800 ring-1 ring-sky-300 hover:bg-sky-50">Waze</a> : null}
          </div>
        </section>
      ) : null}
      {fiche ? (
        <Link href={fiche} className="btn-primary mt-6 inline-flex bg-accent-600 hover:bg-accent-700">
          {v.statut === "REFUSEE" ? "Choisir un autre moment" : "Réserver cette salle"}
        </Link>
      ) : null}
    </div>
  );
}
