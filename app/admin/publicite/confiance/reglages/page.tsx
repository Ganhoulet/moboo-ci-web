import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getAdminSettings } from "../../../actions";

/** Biens vérifiés & diaspora → Réglages (prix, validité, textes, offres). */
export default async function TrustSettings() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "trust");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  return <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />;
}
