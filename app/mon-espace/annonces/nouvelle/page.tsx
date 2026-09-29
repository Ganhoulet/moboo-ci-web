import { redirect } from "next/navigation";
import { getSession, displayName } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { PageHeader } from "@/components/dashboard-ui";
import { ListingEditor, emptyDraft } from "@/components/listing-editor";

export default function NouvelleAnnonce() {
  const account = getSession()!;
  if (!canAccess(account.accountType, "nouvelle")) redirect("/mon-espace");
  const name = account.companyName || displayName(account);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Publier une annonce" sub="Vente ou location longue durée — contact direct, sans commission." />
      <ListingEditor initial={emptyDraft({ name: name !== account.phone ? name : "", phone: account.whatsapp || account.phone })} />
    </div>
  );
}
