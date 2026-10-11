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
        <p className="max-w-3xl text-sm text-muted">Sur TikTok, seul le lien de la bio est cliquable : il mène à moboo.ci/tiktok, où chaque vidéo numérotée renvoie vers ses annonces. Vous voyez combien de visites chaque vidéo apporte. Liée à un quartier, elle s’affiche aussi sur ses pages (contenu vidéo apprécié par Google et par les visiteurs).</p>
      </div>
      <TiktokManager items={items} zones={zones.filter((z) => z.level !== "pays").map((z) => ({ slug: z.slug, name: z.name }))} />
    </div>
  );
}
