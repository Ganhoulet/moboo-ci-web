import { TiktokManager } from "@/components/backoffice/tiktok-manager";
import { getVideos } from "../backlinks/actions";
import { getGenZones } from "../generateur/actions";

export const dynamic = "force-dynamic";

export default async function TiktokPage() {
  const [items, zones] = await Promise.all([getVideos(), getGenZones()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Vidéos TikTok</h1>
        <p className="max-w-3xl text-sm text-muted">Chaque vidéo reçoit un lien court suivi (moboo.ci/go/…) à mettre en bio ou en description : vous voyez combien de visites elle apporte. Liée à un quartier, elle s’affiche aussi sur ses pages (contenu vidéo apprécié par Google et par les visiteurs).</p>
      </div>
      <TiktokManager items={items} zones={zones.filter((z) => z.level !== "pays").map((z) => ({ slug: z.slug, name: z.name }))} />
    </div>
  );
}
