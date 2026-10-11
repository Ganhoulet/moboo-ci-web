import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getAdminSettings } from "../../actions";

/** Suivi des comptes → Réglages (délai avant d'appeler l'hôte, alerte de contact). */
export default async function AmSettings() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "am");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  return <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />;
}
