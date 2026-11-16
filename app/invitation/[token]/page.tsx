import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invitation | Moboo.ci", robots: { index: false, follow: false } };

interface Invitation {
  nomEvenement: string; typeEvenement: string; dateDebut: string; dateFin: string; creneau: string | null; passe: boolean;
  salle: { nom: string | null; adresse: string | null; photo: string | null; slug: string | null; latitude: number | null; longitude: number | null };
  mapsUrl: string | null; wazeUrl: string | null;
}

async function getInvitation(token: string): Promise<Invitation | null> {
  try {
    const r = await fetch(`${API_URL}/marketplace/invitation/${encodeURIComponent(token)}`, { cache: "no-store", headers: { Accept: "application/json" } });
    return r.ok ? ((await r.json()) as Invitation) : null;
  } catch { return null; }
}

// Côte d'Ivoire = UTC+0.
const jour = (s: string) => new Date(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan" });
const heure = (s: string) => new Date(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" });

/** Page à partager aux invités : événement, date et heure, salle, itinéraire. Ni montants, ni code du jour J. */
export default async function InvitationPage({ params }: { params: { token: string } }) {
  const i = await getInvitation(params.token);
  if (!i) notFound();
  const memeJour = i.dateDebut.slice(0, 10) === i.dateFin.slice(0, 10) || new Date(i.dateFin).getTime() - new Date(i.dateDebut).getTime() < 86_400_000;
  const quand = memeJour
    ? `${jour(i.dateDebut)}, de ${heure(i.dateDebut)} à ${heure(i.dateFin)}`
    : `du ${jour(i.dateDebut)} au ${jour(i.dateFin)}`;
  const partage = `Vous êtes invité(e) : ${i.nomEvenement} — ${quand}${i.salle.nom ? `, ${i.salle.nom}` : ""}. Lieu et itinéraire : `;
  return (
    <div className="container-page max-w-xl py-8 sm:py-10">
      <p className="text-sm uppercase tracking-wide text-muted">Invitation</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{i.nomEvenement}</h1>
      <p className="mt-2 text-lg text-ink first-letter:uppercase">{quand}</p>
      {i.passe ? <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm text-muted">Cet événement est passé.</p> : null}

      <section className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {i.salle.photo ? <img src={i.salle.photo} alt={i.salle.nom ?? "Salle"} className="h-48 w-full object-cover" /> : null}
        <div className="space-y-2 p-5">
          <h2 className="font-display text-lg font-bold text-ink">{i.salle.nom ?? "Lieu de l’événement"}</h2>
          {i.salle.adresse ? <p className="text-ink">{i.salle.adresse}</p> : null}
          <div className="flex flex-wrap gap-2 pt-2">
            {i.mapsUrl ? <a href={i.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary bg-green-700 hover:bg-green-800">Itinéraire Google Maps</a> : null}
            {i.wazeUrl ? <a href={i.wazeUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-4 py-2 text-sm font-semibold text-sky-800 ring-1 ring-sky-300 hover:bg-sky-50">Waze</a> : null}
          </div>
        </div>
      </section>

      <a href={`https://wa.me/?text=${encodeURIComponent(partage)}`} className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-50"
        target="_blank" rel="noopener noreferrer">Partager sur WhatsApp</a>
      <p className="mt-2 text-xs text-muted">Astuce : partagez aussi l’adresse de cette page, elle contient le lieu et l’itinéraire.</p>

      {i.salle.slug ? <p className="mt-8 text-sm text-muted">Salle réservée sur <Link href={`/espace/${i.salle.slug}`} className="font-semibold text-brand-800 hover:underline">Moboo.ci</Link>.</p> : null}
    </div>
  );
}
