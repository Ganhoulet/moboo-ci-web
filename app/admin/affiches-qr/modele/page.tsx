import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getAdminSettings } from "../../actions";

/** Back-office → Marketing terrain → Modèle des affiches SEO (textes et couleurs par défaut). */
export default async function QrPosterTemplate() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "qrPoster");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  return <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />;
}
