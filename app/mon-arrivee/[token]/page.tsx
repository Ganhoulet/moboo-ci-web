import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getArrival } from "@/lib/stays";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon arrivée | Moboo.ci", robots: { index: false, follow: false } };

const day = (s: string) => new Date(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Page envoyée à la personne qui séjourne (réservé pour un proche) : code d'arrivée, QR, adresse, itinéraire. */
export default async function ArrivalPage({ params }: { params: { token: string } }) {
  const a = await getArrival(params.token);
  if (!a) notFound();
  const first = a.name.split(" ")[0] || "";
  const qr = a.ready && a.code ? await QRCode.toDataURL(a.code, { margin: 1, width: 240, color: { dark: "#000000", light: "#ffffff" } }) : null;
  return (
    <div className="container-page max-w-xl py-8 sm:py-10">
      <p className="text-sm text-muted">{a.bookedBy ? `Réservé par ${a.bookedBy} sur Moboo.ci` : "Réservation Moboo.ci"}</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{first ? `Bonjour ${first}` : "Votre arrivée"}</h1>
      <p className="mt-2 text-muted"><strong className="text-ink">{a.place}</strong> · arrivée {day(a.checkIn)}, départ {day(a.checkOut)} ({a.nights} nuit{a.nights > 1 ? "s" : ""}).</p>
      {a.ready ? (
        <>
          <section className="mt-6 rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-muted">Code d’arrivée</p>
            <p className="mt-1 font-display text-5xl font-extrabold tracking-[0.2em] text-ink">{a.code}</p>
            {qr ? <img src={qr} alt={`QR code du code d’arrivée ${a.code}`} width={200} height={200} className="mx-auto mt-4" /> : null}
            <p className="mt-3 text-sm text-muted">Donnez ce code à l’hôte à votre arrivée, ou montrez-lui le QR code. {a.state === "arrived" ? "Votre arrivée est déjà enregistrée." : ""}</p>
          </section>
          <section className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="font-display text-lg font-bold text-ink">Adresse</h2>
            <p className="mt-1 text-ink">{a.address || "L’hôte vous indiquera l’adresse exacte."}{a.apartment ? ` · logement ${a.apartment}` : ""}</p>
            {a.checkInTime ? <p className="mt-1 text-sm text-muted">Arrivée à partir de {a.checkInTime}.</p> : null}
            {a.mapsUrl ? <a href={a.mapsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">Ouvrir l’itinéraire</a> : null}
          </section>
        </>
      ) : (
        <p className="mt-6 rounded-2xl bg-white p-6 text-muted ring-1 ring-slate-200">
          {a.state === "cancelled" ? "Cette réservation a été annulée." : a.state === "done" ? "Ce séjour est terminé. Merci d’avoir choisi Moboo.ci !" : "Le code d’arrivée et l’adresse s’afficheront ici dès que l’acompte sera payé."}
        </p>
      )}
      <p className="mt-6 text-sm text-muted">Une question ? <Link href="/aide" className="font-semibold text-ink underline">Aide Moboo.ci</Link></p>
    </div>
  );
}
