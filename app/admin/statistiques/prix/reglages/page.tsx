import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getAdminSettings } from "../../../actions";

/** Statistiques → Indice des prix → Réglages (pages publiques, repère sur les fiches, seuil, période). */
export default async function PricesSettings() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "prices");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  return <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />;
}
