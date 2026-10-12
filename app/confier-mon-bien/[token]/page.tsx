import type { Metadata } from "next";
import { getCaptureAgent } from "@/lib/capture";
import { CaptureShell, InvalidLink } from "@/components/capture/capture-shell";
import { MandatForm } from "@/components/capture/mandat-form";

export const metadata: Metadata = { title: "Confier mon bien — Moboo.ci", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Lien public de prise de mandat d'un conseiller Moboo Pro. */
export default async function ConfierMonBien({ params }: { params: { token: string } }) {
  const token = String(params.token ?? "").replace(/[^a-zA-Z0-9]/g, "");
  const agent = await getCaptureAgent(token);
  if (!agent) return <InvalidLink />;
  return (
    <CaptureShell agentName={agent.agentName}>
      <MandatForm token={token} agentName={agent.agentName} />
    </CaptureShell>
  );
}
