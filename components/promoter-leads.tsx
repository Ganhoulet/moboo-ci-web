"use client";

import { LeadsTable } from "@/components/backoffice/programs-admin";
import { setProgramLeadStatusAction } from "@/app/mon-espace/programmes/actions";

/** Contacts reçus par un promoteur (statut : contacté, visite, vendu…). */
export function PromoterLeads({ leads, programs }: { leads: any[]; programs: { id: string; name: string }[] }) {
  return <LeadsTable leads={leads} programs={programs} onStatus={setProgramLeadStatusAction} />;
}
