import Link from "next/link";
import { CampaignEditor } from "@/components/backoffice/campaign-editor";
import { listCampaigns } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCampaign() {
  const d = await listCampaigns();
  return (
    <div className="space-y-4">
      <Link href="/admin/centre-marketing/campagnes" className="text-sm font-semibold text-brand-800 hover:underline">← Campagnes ciblées</Link>
      <h1 className="font-display text-2xl font-extrabold text-ink">Nouvelle campagne</h1>
      <CampaignEditor variables={d?.variables ?? {}}
        initial={{ name: "", channel: "email", audience: {}, subject: "", body: "", waTemplate: "", waLanguage: "fr", waVars: [], pushApp: "resi", link: "" }} />
    </div>
  );
}
