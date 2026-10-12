import type { Metadata } from "next";
import { getCaptureAgent } from "@/lib/capture";
import { CaptureShell, InvalidLink } from "@/components/capture/capture-shell";
import { DemandeForm, type Objectif } from "@/components/capture/demande-form";

export const metadata: Metadata = { title: "Faire une demande immobilière — Moboo.ci", robots: { index: false } };
export const dynamic = "force-dynamic";

const OBJECTIFS: Objectif[] = ["demande", "estimation", "alerte", "rdv", "interet"];

/** Lien public d'un conseiller Moboo Pro : /demande?ag=JETON&obj=…&src=…&bien=…&bien_titre=… */
export default async function Demande({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const token = String(searchParams.ag ?? "").replace(/[^a-zA-Z0-9]/g, "");
  const agent = await getCaptureAgent(token);
  if (!agent) return <InvalidLink />;
  const objectif = OBJECTIFS.includes(searchParams.obj as Objectif) ? (searchParams.obj as Objectif) : "demande";
  const bien = Number(searchParams.bien);
  return (
    <CaptureShell agentName={agent.agentName}>
      <DemandeForm token={token} objectif={objectif} src={String(searchParams.src ?? "lien").slice(0, 60)}
        propertyId={Number.isInteger(bien) && bien > 0 ? bien : null} propertyTitle={String(searchParams.bien_titre ?? "").slice(0, 200)} />
    </CaptureShell>
  );
}
