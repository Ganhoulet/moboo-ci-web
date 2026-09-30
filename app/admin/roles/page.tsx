import Link from "next/link";
import { getRoles } from "../backoffice-actions";
import { RolesEditor } from "@/components/backoffice/roles-editor";

/** Back-office → Rôles et permissions (façon WordPress « rôles et capacités »). */
export default async function RolesPage() {
  const data = await getRoles();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Rôles et permissions</h1>
        <p className="text-sm text-muted">
          Chaque membre de l’équipe n’accède qu’aux rubriques de son rôle : le menu s’adapte et l’API refuse le reste.
          Les rôles intégrés ne se modifient pas mais peuvent être dupliqués. Attribuez les rôles dans <Link href="/admin/administrateurs" className="font-semibold text-brand-800 hover:underline">Administrateurs</Link>.
        </p>
      </div>
      {data ? <RolesEditor roles={data.roles} permissions={data.permissions} /> : <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger les rôles.</p>}
    </div>
  );
}
