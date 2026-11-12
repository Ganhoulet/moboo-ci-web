import Link from "next/link";
import { StayCardView } from "./stay-card";
import { commonText, getZoneStays, nightly } from "@/lib/stays";

/**
 * Bloc « Ce soir à … » des pages de résidences meublées : chiffres réels tirés
 * de Moboo Resi (logements libres ce soir, prix de la nuitée), résidences libres
 * et repères proches. Rien n'est affiché si la zone n'a aucune résidence.
 */
export async function StaysLive({ zone }: { zone: string }) {
  const z = await getZoneStays(zone);
  if (!z || !z.residences) return null;
  const at = new Date(z.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" });
  const tracked = z.tracked ?? 0;
  const free = z.items.filter((s) => s.freeTonight > 0).slice(0, 6);
  const shown = free.length ? free : z.items.slice(0, 6);
  return (
    <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-ink">{tracked ? `Ce soir à ${z.zone.label}` : `Résidences meublées à ${z.zone.label}`}</h2>
        <p className="text-xs text-muted">{tracked ? `Calendriers tenus dans Moboo Resi, mis à jour à ${at}` : "Prix affichés par les hôtes"}</p>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {tracked ? (
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs uppercase tracking-wide text-muted">Logements libres ce soir</dt>
            <dd className="mt-1 font-display text-2xl font-extrabold text-ink">{z.freeTonight} <span className="text-sm font-semibold text-muted">sur {tracked} suivis en direct</span></dd>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs uppercase tracking-wide text-muted">Résidences meublées</dt>
            <dd className="mt-1 font-display text-2xl font-extrabold text-ink">{z.residences} <span className="text-sm font-semibold text-muted">· {z.apartments} logements</span></dd>
          </div>
        )}
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-xs uppercase tracking-wide text-muted">Prix le plus fréquent</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold text-ink">{commonText(z.night) ?? (z.night ? nightly(z.night.median) : "—")}</dd>
          <p className="text-xs text-muted">{z.night?.common?.length ? `${z.night.commonCount} logements à ce prix par nuit` : "par nuit"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-xs uppercase tracking-wide text-muted">Prix médian de la nuitée</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold text-ink">{z.night ? nightly(z.night.median) : "—"}</dd>
          {z.night ? <p className="text-xs text-muted">{tracked && z.freeTonightFrom ? `dès ${nightly(z.freeTonightFrom)} ce soir` : `dès ${nightly(z.night.min)}`}{z.night.count >= 4 ? ` · la moitié entre ${nightly(z.night.p25)} et ${nightly(z.night.p75)}` : ""}</p> : null}
        </div>
      </dl>
      {shown.length ? (
        <>
          <h3 className="mt-6 font-semibold text-ink">{free.length ? "Libres ce soir" : "Résidences à découvrir"}</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((s) => <StayCardView key={s.id} s={s} />)}</div>
        </>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        {z.landmarks.map((l) => (
          <Link key={l.slug} href={`/meuble-pres-de/${l.slug}`} className="rounded-full border border-slate-300 px-3 py-1.5 text-ink hover:border-ink">Meublés {l.near}</Link>
        ))}
        <Link href="/prix-nuitee" className="rounded-full border border-slate-300 px-3 py-1.5 text-ink hover:border-ink">Prix de la nuitée par commune</Link>
      </div>
    </section>
  );
}
