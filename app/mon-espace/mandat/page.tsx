import { getMyGrowth } from "../actions";
import { MandateActions } from "./mandate-actions";

export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("fr-FR");

/** Mon espace → Publication par Moboo : accord donné à l'équipe, résultats des annonces. */
export default async function MandatePage({ searchParams }: { searchParams: { t?: string } }) {
  const g = await getMyGrowth();
  const m = g?.mandate ?? null;
  const token = searchParams.t ?? "";
  const r = g?.report;
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Publication par Moboo</h1>
        <p className="text-sm text-muted">Votre conseiller Moboo publie gratuitement pour vous les biens que vous lui envoyez sur WhatsApp. Les annonces sont à votre nom : les clients vous appellent directement.</p>
      </div>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-card">
        {token && m?.status !== "active" ? (
          <>
            <p className="font-semibold text-ink">Autorisez-vous Moboo à publier vos biens pour vous ?</p>
            <p className="text-sm text-muted">Vous gardez la main : vous voyez et modifiez vos annonces dans « Mes annonces », et vous pouvez retirer cet accord à tout moment.</p>
            <MandateActions mode="accept" token={token} />
          </>
        ) : m?.status === "active" ? (
          <>
            <p className="font-semibold text-emerald-800">Accord donné{m.managerName ? ` à ${m.managerName}` : ""}{m.grantedAt ? ` le ${new Date(m.grantedAt).toLocaleDateString("fr-FR")}` : ""}.</p>
            <MandateActions mode="revoke" />
          </>
        ) : m?.status === "declared" ? (
          <>
            <p className="font-semibold text-ink">{m.managerName || "Votre conseiller Moboo"} a noté votre accord pour publier vos biens.</p>
            <p className="text-sm text-muted">Confirmez-le, ou retirez-le si vous n’êtes pas d’accord.</p>
            <MandateActions mode="confirm" />
          </>
        ) : m?.status === "pending" ? (
          <p className="text-sm text-muted">Un lien d’accord vous a été envoyé par WhatsApp : ouvrez-le pour valider.</p>
        ) : (
          <p className="text-sm text-muted">Aucun accord en cours. Pour que Moboo publie vos biens, contactez votre conseiller Moboo.</p>
        )}
      </section>

      {r ? (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-card">
          <h2 className="font-bold text-ink">Vos résultats des {r.days} derniers jours</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Vues", r.totals.views], ["Appels", r.totals.calls], ["WhatsApp", r.totals.whatsapp]].map(([l, v]) => (
              <div key={l as string} className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-extrabold text-ink">{n(v as number)}</p><p className="text-xs text-muted">{l}</p></div>
            ))}
          </div>
          <p className="text-xs text-muted">{r.listings} annonce(s) en ligne{r.teamListings ? `, dont ${r.teamListings} publiée(s) par Moboo (${n(r.teamTotals.calls + r.teamTotals.whatsapp)} contacts)` : ""}.</p>
          {r.top.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {r.top.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                  <a href={`/annonce/${l.id}`} className="min-w-0 truncate font-semibold text-brand-800 hover:underline">{l.title}{l.team ? <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-800">par Moboo</span> : null}</a>
                  <span className="shrink-0 text-xs text-muted">{n(l.views)} vues · {n(l.calls)} appels · {n(l.whatsapp)} WhatsApp</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
