import Link from "next/link";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

const ST: Record<string, [string, string]> = { ouvert: ["À traiter", "bg-amber-50 text-amber-800"], repondu: ["Répondu", "bg-sky-50 text-sky-800"], ferme: ["Clos", "bg-slate-100 text-slate-600"] };
const dt = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Abidjan" });

/** Demandes de support de mes clients (liens support envoyés). */
export default async function AmSupport({ searchParams }: { searchParams: { status?: string } }) {
  const status = ["ouvert", "repondu", "ferme"].includes(searchParams.status ?? "") ? searchParams.status! : "";
  const d = await getAm<{ unread: number; items: any[] }>(`/support${status ? `?status=${status}` : ""}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Support indisponible.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Support de mes clients</h1>
        <p className="max-w-3xl text-sm text-muted">Envoyez un lien support depuis la fiche d’un client : il décrit son problème et joint une capture d’écran. Ses messages arrivent ici ; vos réponses lui parviennent par SMS avec le lien.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {[["", "Toutes"], ["ouvert", `À traiter${d.unread ? ` (${d.unread})` : ""}`], ["repondu", "Répondu"], ["ferme", "Closes"]].map(([k, l]) => (
          <Link key={k} href={k ? `?status=${k}` : "?"} className={"rounded-full px-3 py-1 font-semibold " + (status === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>
        ))}
      </div>
      <ul className="divide-y divide-slate-100 rounded-lg bg-white ring-1 ring-slate-200">
        {d.items.map((t) => (
          <li key={t.id}>
            <Link href={`/admin/comptes/support/${t.id}`} className="flex flex-wrap items-start gap-3 p-4 hover:bg-slate-50">
              {t.unread ? <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-amber-500" aria-label="Nouveau message" /> : <span className="mt-1.5 h-2.5 w-2.5" />}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{t.client?.name ?? "Client"} · <span className="font-normal">{t.subject}</span></span>
                <span className="block truncate text-sm text-muted">{t.last ? `${t.last.staff ? "Vous : " : ""}${t.last.file ? "📷 " : ""}${t.last.body}` : "—"}</span>
              </span>
              <span className="text-right text-xs text-muted">
                <span className={"mb-1 inline-block rounded-full px-2 py-0.5 font-semibold " + (ST[t.status]?.[1] ?? "")}>{ST[t.status]?.[0] ?? t.status}</span><br />{dt(t.updatedAt)}
              </span>
            </Link>
          </li>
        ))}
        {!d.items.length ? <li className="p-6 text-center text-sm text-muted">Aucune demande. Ouvrez la fiche d’un client et créez un lien support.</li> : null}
      </ul>
    </div>
  );
}
