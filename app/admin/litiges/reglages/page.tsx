import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getAdminSettings } from "../../actions";

/** Back-office → Litiges → Réglages (délais, annulation par le client, texte d'introduction). */
export default async function DisputeSettings() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "disputes");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  return <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />;
}
