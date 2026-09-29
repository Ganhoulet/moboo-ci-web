"use client";

import { useEffect } from "react";
import { CreativeView } from "./creative";
import type { LiveCampaign } from "@/lib/marketing";
import { trackCampaignAction } from "@/app/marketing-actions";

/** Bannières marketing de l'accueil (1 : pleine largeur ; plusieurs : carrousel). */
export function SiteBanners({ items }: { items: LiveCampaign[] }) {
  useEffect(() => {
    for (const c of items) {
      try {
        if (sessionStorage.getItem(`moboo_banner_${c.id}`)) continue;
        sessionStorage.setItem(`moboo_banner_${c.id}`, "1");
      } catch { /* */ }
      void trackCampaignAction(c.id, "view").catch(() => {});
    }
  }, [items]);
  const one = items.length === 1;
  return (
    <div className={one ? "" : "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}>
      {items.map((c) => {
        const card = <CreativeView c={c} variant="banner" />;
        return (
          <div key={c.id} className={one ? "" : "w-[88%] shrink-0 snap-start sm:w-[60%] lg:w-[calc(50%-8px)]"}>
            {c.ctaUrl ? (
              <a href={c.ctaUrl} onClick={() => void trackCampaignAction(c.id, "click").catch(() => {})} className="block transition hover:opacity-95"
                {...(/^https?:/.test(c.ctaUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{card}</a>
            ) : card}
          </div>
        );
      })}
    </div>
  );
}
