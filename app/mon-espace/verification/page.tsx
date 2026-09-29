import { redirect } from "next/navigation";
import { getSession, displayName } from "@/lib/session";
import { PageHeader } from "@/components/dashboard-ui";
import { VerificationForm } from "@/components/verification-form";
import { getMyVerification } from "../actions";

export default async function Verification() {
  const account = getSession()!;
  const v = await getMyVerification();
  if (!v?.enabled || !v.concerned) redirect("/mon-espace");
  const last = v.last;
  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Vérification du compte" sub={v.intro} />
      {v.verified ? (
        <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-900">
          <p className="font-semibold">✓ Votre compte est vérifié</p>
          <p className="text-sm">Depuis le {new Date(v.verifiedAt!).toLocaleDateString("fr-FR")}. Le badge « Vérifié » apparaît sur votre page et vos annonces.</p>
        </div>
      ) : last?.status === "pending" ? (
        <div className="rounded-2xl bg-amber-50 p-5 text-amber-900">
          <p className="font-semibold">Demande en cours d’examen</p>
          <p className="text-sm">{last.docType} envoyée le {new Date(last.createdAt).toLocaleDateString("fr-FR")}. Vous serez prévenu(e) par e-mail.</p>
        </div>
      ) : (
        <>
          {v.required ? <p className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">La vérification est nécessaire pour publier des annonces.</p> : null}
          {last && (last.status === "rejected" || last.status === "more_info") ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">{last.statusLabel}</p>
              {last.adminNote ? <p className="mt-1 whitespace-pre-line">{last.adminNote}</p> : null}
              <p className="mt-1">Vous pouvez envoyer une nouvelle demande ci-dessous.</p>
            </div>
          ) : null}
          <VerificationForm docTypes={v.docTypes} defaultName={displayName(account)} />
        </>
      )}
    </div>
  );
}
