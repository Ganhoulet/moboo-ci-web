import { notFound } from "next/navigation";
import { CampaignEditor } from "@/components/marketing/campaign-editor";
import { listCampaigns } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditCampaign({ params }: { params: { id: string } }) {
  const c = (await listCampaigns()).find((x) => x.id === params.id);
  if (!c) notFound();
  return <CampaignEditor key={c.updatedAt} initial={c} />;
}
