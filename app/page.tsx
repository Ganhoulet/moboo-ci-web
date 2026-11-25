import Link from "next/link";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { getHomeData, getHomePage } from "@/lib/pages";
import { normalizeHome } from "@/lib/page-blocks";
import { HomeSection } from "@/components/home/sections";
import { getSiteSettings } from "@/lib/settings";
import { ldJson, organizationLd, websiteLd } from "@/lib/structured-data";
import { LivePage } from "@/components/builder/live-page";
import { EditButtons } from "@/components/builder/edit-buttons";

export const dynamic = "force-dynamic";

/**
 * Page d'accueil composée dans le back-office (Apparence → Page d'accueil).
 * Administrateur : bouton « Modifier » sur chaque section et aperçu du brouillon (?apercu=1).
 */
export default async function HomePage({ searchParams }: { searchParams: { apercu?: string; modifier?: string } }) {
  const account = getSession();
  const isAdmin = !!account?.isAdmin;
  const live = isAdmin && searchParams.modifier === "1";
  const preview = isAdmin && (searchParams.apercu === "1" || live);
  let page = await getHomePage();
  if (preview) {
    const r = await authedFetch("/site/admin/pages/home", { method: "GET" });
    if (r.ok && (r.data?.draft || r.data?.published)) page = normalizeHome(r.data.draft ?? r.data.published);
  }
  const [data, settings] = await Promise.all([getHomeData(), getSiteSettings()]);
  const { branding, header } = settings;
  // Moboo (éditeur du site) pour Google : nom, logo, réseaux sociaux.
  const org = organizationLd({
    name: branding.siteName, logoUrl: branding.logoUrl,
    sameAs: [header.facebookUrl, header.instagramUrl, header.tiktokUrl, header.linkedinUrl, header.youtubeUrl],
  });

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(org) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(websiteLd(branding.siteName)) }} />
      {preview && !live ? (
        <div className="sticky top-16 z-30 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          Aperçu du brouillon — non visible des visiteurs. <Link href="/admin/accueil" className="underline">Retour au constructeur</Link>
        </div>
      ) : null}
      {live
        ? <LivePage slug="home" catalogKey="home" sections={page.sections} exitHref="/" builderHref="/admin/accueil" render={(s) => <HomeSection s={s} data={data} />} />
        : page.sections.map((s) => <HomeSection key={s.id} s={s} data={data} edit={isAdmin && !preview} />)}
      {isAdmin && !preview ? <EditButtons live="/?modifier=1" builder="/admin/accueil" /> : null}
    </div>
  );
}
