import Link from "next/link";
import { headers } from "next/headers";

const TABS: [string, string][] = [
  ["/admin/services", "Vue d’ensemble"],
  ["/admin/services/alertes", "Alertes"],
  ["/admin/services/etats-des-lieux", "États des lieux"],
  ["/admin/services/support", "Support"],
  ["/admin/services/estimations", "Estimations"],
  ["/admin/services/cartes", "Cartes pro"],
  ["/admin/services/application", "Configuration des applications"],
  ["/admin/services/reglages", "Réglages"],
];

/** Services Moboo (ex-extensions WordPress) : onglets communs. */
export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  const path = (headers().get("x-moboo-path") ?? "/admin/services").split("?")[0];
  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap gap-1 rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
        {TABS.map(([href, label]) => {
          const on = href === "/admin/services" ? path === href : path.startsWith(href);
          return <Link key={href} href={href} className={"rounded-md px-3 py-1.5 text-sm font-semibold " + (on ? "bg-ink text-white" : "text-ink hover:bg-slate-100")}>{label}</Link>;
        })}
      </nav>
      {children}
    </div>
  );
}
