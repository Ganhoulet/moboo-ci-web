import { getAm } from "../actions";
import { AcademyBrowser, type AcademyData } from "@/components/backoffice/am-academy";

export const dynamic = "force-dynamic";

/** Académie : messages prêts à l'emploi (WhatsApp, SMS, e-mail) selon la situation et le type de client. */
export default async function AmAcademy({ searchParams }: { searchParams: { kind?: string; id?: string } }) {
  const mine = await getAm<{ name: string; permissions?: string[] }>("/me");
  const p = mine?.permissions ?? [];
  const canEdit = p.includes("accounts.all") || p.includes("settings");
  const data = await getAm<AcademyData>(`/academy${canEdit ? "?all=1" : ""}`);
  const kind = ["site", "org", "event"].includes(searchParams.kind ?? "") ? searchParams.kind! : null;
  const acc = kind && searchParams.id ? await getAm<any>(`/accounts/${kind}/${encodeURIComponent(searchParams.id)}`) : null;
  if (!data) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Académie indisponible.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Académie</h1>
        <p className="max-w-3xl text-sm text-muted">
          Les messages de l’équipe Moboo, prêts à envoyer : choisissez la situation, complétez les éléments entre accolades, puis envoyez par WhatsApp, SMS ou e-mail.
          Un ton professionnel et chaleureux, les mêmes formules pour toute l’équipe.
        </p>
      </div>
      <AcademyBrowser
        data={data}
        canEdit={canEdit}
        me={mine?.name ?? ""}
        client={acc ? { kind: acc.kind, id: acc.id, name: acc.profile?.name ?? "", phone: acc.profile?.whatsapp || acc.profile?.phone || null, email: acc.profile?.email ?? null } : null}
      />
    </div>
  );
}
