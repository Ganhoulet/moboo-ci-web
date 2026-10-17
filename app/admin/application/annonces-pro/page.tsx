import { getProAnnouncements } from "../pro-actions";
import { AnnouncementsManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function AnnoncesPro() {
  const items = await getProAnnouncements();
  if (!items) return <p className="text-muted">Annonces indisponibles (droit « Application » requis).</p>;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Annonces de l’application Moboo Pro</h1>
        <p className="max-w-3xl text-sm text-muted">Le carrousel d’accueil de Moboo Pro (nouveautés, promotions, mises à jour), affiché sans mise à jour de l’application. Les statistiques comptent les personnes : vues, écoutes de l’audio, clics et fermetures.</p>
      </div>
      <AnnouncementsManager items={items} />
    </div>
  );
}
