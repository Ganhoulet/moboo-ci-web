import Link from "next/link";
import { getAm } from "../../actions";
import { SupportReply } from "@/components/backoffice/am-support";

export const dynamic = "force-dynamic";

const dt = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Abidjan" });

/** Conversation de support avec un client (messages, captures, réponse). */
export default async function AmSupportThread({ params }: { params: { tid: string } }) {
  const t = await getAm<any>(`/support/${encodeURIComponent(params.tid)}`);
  if (!t) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Demande introuvable.</p>;
  return (
    <div className="space-y-4">
      <Link href="/admin/comptes/support" className="text-sm font-semibold text-brand-800">← Toutes les demandes</Link>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">{t.subject}</h1>
          <p className="text-sm text-muted">
            {t.client ? <Link href={`/admin/comptes/site/${t.client.id}`} className="font-semibold text-brand-800 hover:underline">{t.client.name}</Link> : "Client"}
            {t.client?.phone ? ` · ${t.client.phone}` : ""} · {t.status === "ferme" ? "close" : t.status === "repondu" ? "répondu" : "à traiter"}
          </p>
        </div>
        <a href={t.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-800 hover:underline">Voir comme le client ↗</a>
      </div>
      <ol className="space-y-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
        {t.messages.map((m: any) => (
          <li key={m.id} className={"flex " + (m.staff ? "justify-end" : "justify-start")}>
            <div className={"max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm " + (m.staff ? "bg-brand-800 text-white" : "bg-white text-ink ring-1 ring-slate-200")}>
              {m.file ? (
                /\.pdf($|\?)/i.test(m.file)
                  ? <a href={m.file} target="_blank" rel="noreferrer" className="underline">📄 Document joint</a>
                  // eslint-disable-next-line @next/next/no-img-element
                  : <a href={m.file} target="_blank" rel="noreferrer"><img src={m.file} alt="Capture du client" className="mb-1.5 max-h-80 rounded-lg" /></a>
              ) : null}
              <p className="whitespace-pre-line">{m.body}</p>
              <p className={"mt-1 text-[11px] " + (m.staff ? "text-white/70" : "text-muted")}>{m.staff ? "Vous" : t.client?.name ?? "Client"} · {dt(m.at)}</p>
            </div>
          </li>
        ))}
      </ol>
      <SupportReply id={t.id} status={t.status} />
    </div>
  );
}
