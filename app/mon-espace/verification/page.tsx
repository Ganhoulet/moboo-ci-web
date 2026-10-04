import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, displayName } from "@/lib/session";
import { PageHeader } from "@/components/dashboard-ui";
import { VerificationForm } from "@/components/verification-form";
import { getMyVerification, type VerificationLevel } from "../actions";

const fr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function Step({ n, title, sub, state }: { n: number; title: string; sub: string; state: "done" | "pending" | "todo" | "locked" }) {
  const badge = {
    done: ["✓ Validé", "bg-emerald-50 text-emerald-700 ring-emerald-200"],
    pending: ["⏳ En cours d’examen", "bg-amber-50 text-amber-800 ring-amber-200"],
    todo: ["À faire", "bg-slate-100 text-slate-700 ring-slate-200"],
    locked: ["🔒 Après l’étape précédente", "bg-slate-50 text-slate-500 ring-slate-200"],
  }[state];
  return (
    <div className="flex items-start gap-3">
      <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold " + (state === "done" ? "bg-emerald-600 text-white" : "bg-brand-50 text-brand-800")}>{state === "done" ? "✓" : n}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title} <span className={"ml-1 inline-block rounded-full px-2 py-0.5 align-middle text-xs font-bold ring-1 " + badge[1]}>{badge[0]}</span></p>
        <p className="text-sm text-muted">{sub}</p>
      </div>
    </div>
  );
}

function LastAnswer({ lv }: { lv: VerificationLevel }) {
  const last = lv.last;
  if (!last || (last.status !== "rejected" && last.status !== "more_info")) return null;
  return (
    <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
      <p className="font-semibold">{last.statusLabel}</p>
      {last.adminNote ? <p className="mt-1 whitespace-pre-line">{last.adminNote}</p> : null}
      <p className="mt-1">Vous pouvez envoyer une nouvelle demande ci-dessous.</p>
    </div>
  );
}

const stateOf = (lv: VerificationLevel, locked = false) =>
  lv.verified ? "done" as const : lv.last?.status === "pending" ? "pending" as const : locked ? "locked" as const : "todo" as const;

/** Mon espace → Vérification : téléphone, identité (pièce + selfie), activité professionnelle. */
export default async function Verification() {
  const account = getSession()!;
  const v = await getMyVerification();
  if (!v?.enabled || !v.concerned) redirect("/mon-espace");
  const { identity: id, business: biz } = v;
  const bizLocked = id.offered && !id.verified;
  const soon = id.expiresAt && new Date(id.expiresAt).getTime() - Date.now() < 30 * 86_400_000;

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Vérification du compte" sub={v.intro} />

      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-card">
        <Step n={1} title="Téléphone confirmé" sub="Code reçu par SMS, WhatsApp ou e-mail à la connexion." state={v.phoneVerified ? "done" : "todo"} />
        {id.offered ? (
          <Step n={2} title="Identité vérifiée" state={stateOf(id)}
            sub={id.verified ? `Depuis le ${fr(id.verifiedAt!)}${id.expiresAt ? ` · pièce valable jusqu’au ${fr(id.expiresAt)}` : ""}.` : "Pièce d’identité et selfie : badge « Identité vérifiée » sur votre page et vos annonces."} />
        ) : null}
        {biz.offered ? (
          <Step n={id.offered ? 3 : 2} title="Professionnel vérifié" state={stateOf(biz, bizLocked)}
            sub={biz.verified ? `Depuis le ${fr(biz.verifiedAt!)}.` : "Registre du commerce ou agrément : badge « Pro vérifié », le plus haut niveau de confiance."} />
        ) : null}
        {!v.phoneVerified ? <p className="text-xs text-muted">Pour confirmer votre téléphone, déconnectez-vous puis reconnectez-vous avec un code. <Link href="/mon-espace/profil" className="text-brand-800 hover:underline">Mon profil</Link></p> : null}
      </section>

      {v.required && !id.verified ? <p className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">La vérification d’identité est nécessaire pour publier des annonces.</p> : null}
      {id.verified && soon ? <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Votre pièce expire bientôt : le badge sera retiré le {fr(id.expiresAt!)}. Vous pourrez envoyer votre nouvelle pièce dès réception.</p> : null}

      {id.offered && !id.verified && id.last?.status !== "pending" ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-ink">Vérifier mon identité</h2>
          <LastAnswer lv={id} />
          <VerificationForm level="identity" docTypes={id.docTypes} defaultName={displayName(account)} requireSelfie={v.requireSelfie} requireDocNumber={v.requireDocNumber} />
        </section>
      ) : null}

      {biz.offered && !biz.verified && !bizLocked && biz.last?.status !== "pending" ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-ink">Vérifier mon activité professionnelle</h2>
          <LastAnswer lv={biz} />
          <VerificationForm level="business" docTypes={biz.docTypes} defaultName={displayName(account)} defaultCompany={account.companyName ?? ""} />
        </section>
      ) : null}
    </div>
  );
}
