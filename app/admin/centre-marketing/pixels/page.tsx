import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { TRACKING_FORMATS } from "@/lib/tracking-config";
import { getAdminSettings } from "../../actions";

export const dynamic = "force-dynamic";

const TOOLS = [
  { key: "ga4Id", name: "Google Analytics", format: TRACKING_FORMATS.ga4 },
  { key: "metaPixelId", name: "Pixel Facebook", format: TRACKING_FORMATS.meta },
  { key: "tiktokPixelId", name: "Pixel TikTok", format: TRACKING_FORMATS.tiktok },
];

/** Back-office → Centre marketing → Pixels et mesure. */
export default async function TrackingSettings() {
  const settings = await getAdminSettings();
  const section = settings?.schema.find((s) => s.id === "tracking");
  if (!settings || !section) notFound();
  const updated = settings.updated.find((u) => u.section === section.id);
  const values = (settings.values[section.id] ?? {}) as Record<string, unknown>;
  const enabled = values.enabled !== false;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {TOOLS.map((t) => {
          const v = String(values[t.key] ?? "").trim();
          const valid = t.format.test(v);
          const [label, color] = !v ? ["Non renseigné", "text-slate-500"] : !valid ? ["Format non reconnu : inactif", "text-red-700"] : enabled ? ["Actif", "text-emerald-700"] : ["Mesure désactivée", "text-amber-700"];
          return (
            <div key={t.key} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-ink">{t.name}</p>
              <p className={`mt-1 text-sm font-semibold ${color}`}>{label}</p>
            </div>
          );
        })}
      </div>
      <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />
    </div>
  );
}
