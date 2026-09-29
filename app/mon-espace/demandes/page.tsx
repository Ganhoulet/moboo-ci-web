import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { InquiryBoard } from "@/components/inquiry-board";
import { listMyInquiries } from "../actions";

export default async function Demandes() {
  const account = getSession()!;
  if (!canAccess(account.accountType, "demandes")) redirect("/mon-espace");
  const items = await listMyInquiries();
  return (
    <div>
      <PageHeader title="Demandes" sub="Suivez chaque contact jusqu'à la vente ou la location : étape, note, rappel en un geste." />
      {items.length ? <InquiryBoard items={items} /> : (
        <EmptyState title="Aucune demande pour l'instant" text="Les demandes de contact et de visite envoyées depuis vos annonces arrivent ici." />
      )}
    </div>
  );
}
