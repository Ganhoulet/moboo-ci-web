import { ReviewsSection } from "@/components/reviews";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPro } from "@/lib/api";
import { accountLabel } from "@/lib/accounts";
import { getSiteSettings, roleNames } from "@/lib/settings";
import { VerifiedBadge } from "@/components/verified-badge";
import { mapListing } from "@/lib/property";
import { PropertyCard } from "@/components/property-card";
import { ReportButton } from "@/components/report-button";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const p = await getPro(params.username);
  if (!p) return { title: "Profil" };
  const description = `${p.name} — ${accountLabel(p, roleNames(await getSiteSettings()))} sur Moboo.ci. ${p.listings.length} annonce(s) en ligne.`;
  return { title: p.name, description, openGraph: { title: p.name, description, images: p.avatarUrl ? [p.avatarUrl] : undefined } };
}

export default async function ProPage({ params }: { params: { username: string } }) {
  const p = await getPro(params.username);
  if (!p) notFound();
  const settings = await getSiteSettings();
  const names = roleNames(settings);
  const wa = (p.whatsapp || "").replace(/[^0-9]/g, "");
  const waLink = wa ? `https://wa.me/${wa.startsWith("225") ? wa : "225" + wa}` : null;
  const socials = [
    { k: "website", l: "Site web", v: p.website }, { k: "facebook", l: "Facebook", v: p.facebook },
    { k: "instagram", l: "Instagram", v: p.instagram }, { k: "tiktok", l: "TikTok", v: p.tiktok },
    { k: "linkedin", l: "LinkedIn", v: p.linkedin },
  ].filter((s) => s.v);
  const rent = p.listings.filter((l) => l.transaction === "rent").length;

  return (
    <div>
      <div className="bg-gradient-to-br from-brand-800 to-brand-900 text-white">
        <div className="container-page flex flex-wrap items-center gap-5 py-10">
          {p.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-white/20" />
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-full bg-white/15 font-display text-4xl font-extrabold">{p.name.charAt(0).toUpperCase()}</span>
          )}
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{accountLabel(p, names)}</span>
            <h1 className="mt-2 flex flex-wrap items-center gap-2 font-display text-3xl font-extrabold">{p.name}{p.verified ? <VerifiedBadge tone="dark" /> : null}</h1>
            <p className="mt-1 text-sm text-white/80">
              {[p.commune, p.city].filter(Boolean).join(", ") || "Côte d'Ivoire"} · Membre depuis {new Date(p.memberSince).getFullYear()}
              {" · "}{p.listings.length} annonce(s){rent ? ` dont ${rent} en location` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.phone ? <a href={`tel:${p.phone}`} className="btn-primary bg-white text-brand-900 hover:bg-brand-50">Appeler</a> : null}
            {waLink ? <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-primary bg-[#25D366] text-white hover:opacity-90">WhatsApp</a> : null}
          </div>
        </div>
      </div>

      <div className="container-page py-10">
        {p.bio || socials.length ? (
          <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_280px]">
            {p.bio ? (
              <section>
                <h2 className="font-display text-lg font-bold text-ink">À propos</h2>
                <p className="mt-2 whitespace-pre-line text-slate-600">{p.bio}</p>
              </section>
            ) : <div />}
            {socials.length ? (
              <section className="rounded-2xl bg-white p-5 shadow-card">
                <h2 className="font-display font-bold text-ink">Retrouvez-nous</h2>
                <ul className="mt-2 space-y-1.5">
                  {socials.map((s) => (
                    <li key={s.k}><a href={s.v!} target="_blank" rel="noopener noreferrer nofollow" className="text-sm font-semibold text-brand-800 hover:underline">{s.l} ↗</a></li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}

        <h2 className="font-display text-xl font-bold text-ink">Annonces en ligne</h2>
        {p.listings.length ? (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {p.listings.map((l) => <PropertyCard key={l.id} p={mapListing(l)} />)}
          </div>
        ) : (
          <p className="mt-3 text-muted">Aucune annonce en ligne pour le moment.</p>
        )}

        <div className="mt-12 max-w-3xl">
          <ReviewsSection type="pro" id={p.username} path={`/pro/${p.username}`} />
        </div>
        {settings.moderation.reportsEnabled ? (
          <div className="mt-8"><ReportButton targetType="account" targetId={p.username} /></div>
        ) : null}
      </div>
    </div>
  );
}
