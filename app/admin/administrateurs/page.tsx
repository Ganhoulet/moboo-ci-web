import { AdminUsers } from "@/components/admin-users";
import { listAdmins } from "../actions";

export default async function Administrateurs() {
  const data = await listAdmins();
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Administrateurs</h1>
        <p className="mt-1 text-sm text-muted">Comptes du site ayant accès à ce back-office, et leur rôle. Les droits de chaque rôle se règlent dans <a href="/admin/roles" className="font-semibold text-brand-800 hover:underline">Rôles et permissions</a>.</p>
      </div>
      <AdminUsers items={data?.items ?? []} pendingPhones={data?.pendingPhones ?? []} roles={data?.roles ?? []} />
    </div>
  );
}
