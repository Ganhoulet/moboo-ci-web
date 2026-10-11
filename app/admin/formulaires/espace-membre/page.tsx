import Link from "next/link";
import { MemberSpaceBuilder } from "@/components/backoffice/form-builder";
import { DASH_MENU } from "@/lib/accounts";
import { parseMemberSpace } from "@/lib/listing-form";
import { getAdminSettings } from "../../actions";

export const dynamic = "force-dynamic";

/** Onglets reliés à l'espace « Mon espace » de l'application Moboo.ci. */
const IN_APP = new Set(["statistiques", "annonces", "nouvelle", "demandes", "realisations", "avis", "equipe", "reservations", "messages", "favoris", "recherches", "infos", "pagepro", "forfait", "publicite", "factures", "verification", "profil"]);

/** Espace membre : onglets actifs, renommés ou réservés à certains profils. */
export default async function EspaceMembreReglages() {
  const settings = await getAdminSettings();
  if (!settings) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Réglages indisponibles.</p>;
  const forms = (settings.values.forms ?? {}) as { memberSpace?: string };
  const items = DASH_MENU.map((i) => ({ key: i.key, label: i.label, types: i.types, locked: i.key === "tableau" || i.key === "profil", app: IN_APP.has(i.key) }));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Espace membre</h1>
        <p className="max-w-3xl text-sm text-muted">
          Activez, coupez, renommez ou réservez à certains profils chaque onglet de « Mon espace ». Un onglet coupé disparaît du menu et sa page
          n’est plus accessible ; le même réglage s’applique dans l’application Moboo.ci. Les profils proposés sont ceux qui ont droit à l’onglet.
          {" "}<Link href="/admin/formulaires" className="font-semibold text-brand-800 hover:underline">← Formulaire de publication</Link>
        </p>
      </div>
      <MemberSpaceBuilder initial={parseMemberSpace(forms.memberSpace)} items={items} />
    </div>
  );
}
