import { CampaignList } from "@/components/marketing/campaign-list";
import { listCampaigns } from "./actions";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  return <CampaignList items={await listCampaigns()} />;
}
