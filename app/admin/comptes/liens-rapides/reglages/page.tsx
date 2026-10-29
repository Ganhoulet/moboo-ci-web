import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getAdminSettings } from "../../../actions";

/** Liens de publication rapide → Réglages (champs, photos, position, vidéo, IA, textes, anti-spam). */
export default async function QuickSettings() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "quickPublish");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  return <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />;
}
