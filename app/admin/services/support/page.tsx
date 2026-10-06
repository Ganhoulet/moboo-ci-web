import Link from "next/link";
import { getServices } from "../actions";
import { SupportConsole } from "@/components/backoffice/services-admin-widgets";

export const dynamic = "force-dynamic";

const STATUS: [string, string][] = [["", "Tous"], ["ouvert", "Ouverts"], ["repondu", "Répondus"], ["ferme", "Fermés"]];
const APPS: [string, string][] = [["", "Toutes les applications"], ["moboo_ci", "Moboo.ci"], ["moboo_pro", "Moboo Pro"]];
const LABEL: Record<string, string> = { ouvert: "Ouvert", repondu: "Répondu", ferme: "Fermé" };

/** Services Moboo → Support : tickets des applications, réponse et statut. */
export default async function SupportAdmin({ searchParams }: { searchParams: { statut?: string; app?: string; ticket?: string; page?: string } }) {
  const st = searchParams.statut ?? "";
  const app = searchParams.app ?? "";
  const d = await getServices<any>(`/support?status=${st}&app=${app}&page=${Number(searchParams.page) || 1}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Support indisponible.</p>;
  const qs = (o: Record<string, string>) => "?" + new URLSearchParams({ ...(st ? { statut: st } : {}), ...(app ? { app } : {}), ...o }).toString();
  const sel = searchParams.ticket ?? d.items[0]?.uuid ?? "";
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Support</h1>
        <p className="text-sm text-muted">{d.unread} ticket(s) à lire. Les forfaits payants ont le chat ; les autres demandes arrivent ici et le client reçoit votre réponse par notification et e-mail.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {STATUS.map(([k, l]) => <Link key={k} href={qs({ statut: k })} className={"rounded-full px-3 py-1 font-semibold " + (st === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
        <span className="mx-1 text-slate-300">|</span>
        {APPS.map(([k, l]) => <Link key={k} href={qs({ app: k })} className={"rounded-full px-3 py-1 font-semibold " + (app === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="space-y-2">
          {d.items.map((t: any) => (
            <Link key={t.uuid} href={qs({ ticket: t.uuid })} className={"block rounded-lg bg-white p-3 shadow-sm ring-1 " + (sel === t.uuid ? "ring-brand-500" : "ring-slate-200 hover:ring-slate-300")}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink">{t.unread_staff ? <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" /> : null}#{t.id} {t.subject}</p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold">{LABEL[t.status] ?? t.status}</span>
              </div>
              <p className="text-xs text-muted">{t.user?.name ?? "—"} · {t.app === "moboo_pro" ? "Moboo Pro" : "Moboo.ci"} · {t.category} · {t.updated_at}</p>
            </Link>
          ))}
          {!d.items.length ? <p className="rounded-lg bg-white p-6 text-center text-sm text-muted ring-1 ring-slate-200">Aucun ticket.</p> : null}
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          {sel ? <SupportConsole key={sel} ticketId={sel} /> : <p className="text-sm text-muted">Choisissez un ticket.</p>}
        </div>
      </div>
    </div>
  );
}
