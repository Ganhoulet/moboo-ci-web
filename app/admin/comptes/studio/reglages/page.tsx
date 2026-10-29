import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getAdminSettings } from "../../../actions";

/** Studio de publication → Réglages (accord, profils non inscrits, quota, IA, messages WhatsApp). */
export default async function GrowthSettings() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "growth");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  return <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />;
}
