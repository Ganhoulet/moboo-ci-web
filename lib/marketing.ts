// Zone marketing : lecture des campagnes en cours (bannières et pop-ups du
// site). Cache 60 s, vidé à chaque modification dans le back-office.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";
import type { Creative } from "@/components/marketing/creative";

export const MARKETING_TAG = "site-marketing";

export type LiveCampaign = Creative & {
  id: string; audience: "all" | "guests" | "members"; frequency: "once" | "daily" | "always";
  dismissible: boolean; delaySec: number; version: string;
};

export async function getCampaigns(placement: "site_banner" | "site_popup", zones?: string[]): Promise<LiveCampaign[]> {
  try {
    // zones : bannières des annonceurs ciblées sur ces villes / communes (page de résultats).
    const z = zones?.length ? `&zone=${encodeURIComponent(zones.slice(0, 20).join(","))}` : "";
    const r = await fetch(`${API_URL}/site/marketing?placement=${placement}${z}`, {
      next: { revalidate: 60, tags: [MARKETING_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) },
    });
    return r.ok ? ((await r.json()).items as LiveCampaign[]) : [];
  } catch {
    return [];
  }
}
