import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getAdminSettings } from "../../../actions";

/** Bourse des demandes → Réglages (prix des contacts, nombre d'agents, durée, compte obligatoire…). */
export default async function LeadMarketSettings() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "leadMarket");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  return <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />;
}
