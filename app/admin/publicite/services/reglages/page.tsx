import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getAdminSettings } from "../../../actions";

/** Publicités de services → Réglages (fréquence, prix, validation, catégories). */
export default async function ServiceAdsSettings() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "serviceAds");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  return <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />;
}
