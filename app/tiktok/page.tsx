import type { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Nos vidéos TikTok",
  description: "Retrouvez les biens et les quartiers présentés dans les vidéos TikTok de Moboo.ci.",
  robots: { index: false, follow: true },
};

interface BioVideo { number: number; title: string; code: string; zoneSlug: string | null; targetPath: string }

async function videos(): Promise<BioVideo[]> {
  try {
    const r = await fetch(`${API_URL}/site/seo/videos/bio`, { next: { revalidate: 60 }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? (await r.json()).items : [];
  } catch {
    return [];
  }
}

const label = (s: string) => s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/** Page « lien en bio » de TikTok : chaque vidéo numérotée, avec un bouton vers ses annonces. */
export default async function TiktokBioPage() {
  const [items, { branding }] = await Promise.all([videos(), getSiteSettings()]);
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="text-center">
        <p className="font-display text-2xl font-extrabold text-ink">{branding.siteName} sur TikTok</p>
        <p className="mt-1 text-sm text-muted">Vous avez vu une vidéo ? Retrouvez-la grâce à son numéro.</p>
      </div>
      <ul className="mt-6 space-y-3">
        {items.map((v) => (
          <li key={v.number}>
            <Link href={`/go/${v.code}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-ink">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink font-display text-lg font-extrabold text-white">{v.number}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{v.title || `Vidéo n°${v.number}`}</span>
                {v.zoneSlug ? <span className="block text-xs text-muted">{label(v.zoneSlug)}</span> : null}
              </span>
              <span className="shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white">Voir</span>
            </Link>
          </li>
        ))}
        {!items.length ? <li className="rounded-2xl bg-white p-6 text-center text-sm text-muted ring-1 ring-slate-200">Les premières vidéos arrivent bientôt.</li> : null}
      </ul>
      <div className="mt-6 grid gap-2 text-center">
        <Link href="/annonces" className="rounded-full border border-slate-300 py-3 text-sm font-semibold text-ink hover:border-ink">Toutes les annonces</Link>
        <Link href="/publier" className="rounded-full border border-slate-300 py-3 text-sm font-semibold text-ink hover:border-ink">Publier mon bien gratuitement</Link>
      </div>
    </div>
  );
}
