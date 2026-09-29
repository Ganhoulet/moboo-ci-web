import Link from "next/link";
import { ADMIN_ICONS } from "@/components/admin-icons";
import { getAdminSettings, getOverview } from "./actions";

const KPIS: [string, string, string][] = [
  ["accounts", "Comptes", "inscrits sur le site"],
  ["newAccounts", "Nouveaux comptes", "30 derniers jours"],
  ["listings", "Annonces en ligne", "vente / location"],
  ["inquiries", "Demandes", "30 derniers jours"],
  ["conversations", "Conversations", "annonceurs ↔ intéressés"],
  ["messages", "Messages", "30 derniers jours"],
];

export default async function AdminHome() {
  const [overview, settings] = await Promise.all([getOverview(), getAdminSettings()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Back-office Moboo.ci</h1>
        <p className="mt-1 text-sm text-muted">Réglez le site sans toucher au code : chaque modification est en ligne dès l’enregistrement.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {KPIS.map(([k, label, hint]) => (
          <div key={k} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink">{(overview?.[k] ?? 0).toLocaleString("fr-FR")}</p>
            <p className="text-xs text-muted">{hint}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Réglages</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {settings?.schema.filter((s) => !s.parent).map((s) => {
            const u = settings.updated.find((x) => x.section === s.id);
            const children = settings.schema.filter((c) => c.parent === s.id).length;
            return (
              <Link key={s.id} href={`/admin/reglages/${s.id}`} className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-400">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-800">{ADMIN_ICONS[s.icon] ?? ADMIN_ICONS.gauge}</span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{s.label}</span>
                  <span className="block text-xs text-muted">{children ? `${children} modèles · ` : ""}{s.fields.length} réglage(s) · {u ? `modifié le ${new Date(u.updatedAt).toLocaleDateString("fr-FR")}` : "valeurs par défaut"}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
