import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAgent } from "@/lib/agent";
import { AgentLoginForm } from "@/components/agent-login-form";

export const metadata: Metadata = { title: "Espace agent — Connexion" };
export const dynamic = "force-dynamic";

export default function AgentLoginPage() {
  if (getAgent()) redirect("/agent");
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-md">
        <span className="chip bg-brand-50 text-brand-800">Espace pro</span>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Espace agent</h1>
        <p className="mt-2 text-muted">
          Agents & propriétaires de résidences / espaces : gérez vos annonces,
          suivez les vues et les demandes reçues.
        </p>
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
          <AgentLoginForm />
        </div>
      </div>
    </div>
  );
}
