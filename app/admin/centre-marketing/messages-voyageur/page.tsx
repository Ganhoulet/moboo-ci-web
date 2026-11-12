import Link from "next/link";
import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { authedFetch } from "@/lib/server-api";
import { getAdminSettings } from "../../actions";

export const dynamic = "force-dynamic";

interface Overview {
  channels: { email: boolean; sms: boolean; whatsapp: boolean };
  recent: { id: string; channel: string; status: string; at: string; phone: string | null; email: string | null; stage?: string; place?: string; dates?: string }[];
  hostRecent?: { id: string; channel: string; status: string; at: string; phone: string | null; email: string | null; stage?: string }[];
}

const STAGE: Record<string, string> = { requested: "Demande envoyée", accepted: "Demande acceptée", confirmed: "Confirmée", cancelled: "Annulée", reminder: "Rappel de la veille", host_request: "Nouvelle demande", host_reminder: "Relance" };
const CHANNEL: Record<string, string> = { EMAIL: "E-mail", SMS: "SMS", WHATSAPP: "WhatsApp" };
const TEMPLATES: [string, string][] = [
  ["guest_requested", "Demande envoyée"], ["guest_accepted", "Demande acceptée"], ["guest_confirmed", "Réservation confirmée"],
  ["guest_cancelled", "Refusée ou annulée"], ["guest_reminder", "Rappel de la veille"],
];

/** Back-office → Centre marketing → Messages au voyageur. */
export default async function GuestMessagesPage() {
  const [settings, res] = await Promise.all([getAdminSettings(), authedFetch("/site/admin/guest-messages", { method: "GET" })]);
  const section = settings?.schema.find((s) => s.id === "guestMessages");
  const hostSection = settings?.schema.find((s) => s.id === "hostMessages");
  if (!settings || !section) notFound();
  const hostUpdated = hostSection ? settings.updated.find((u) => u.section === hostSection.id) : undefined;
  const o = (res.ok ? res.data : null) as Overview | null;
  const updated = settings.updated.find((u) => u.section === section.id);
  const tile = (label: string, on: boolean | undefined, hint: string, href: string) => (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${on ? "text-emerald-700" : "text-amber-700"}`}>{on ? "Branché" : "Pas encore branché"}</p>
      <p className="mt-1 text-xs text-muted">{hint} <Link href={href} className="font-semibold text-brand-800 hover:underline">Régler</Link></p>
    </div>
  );
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Messages au voyageur</h1>
        <p className="max-w-3xl text-sm text-muted">Ce que reçoit le voyageur à chaque étape de sa réservation de résidence meublée ou d’espace. L’e-mail part par défaut. WhatsApp et SMS partent seulement quand leur case est cochée et que leur fournisseur est branché.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {tile("E-mail", o?.channels.email, "Serveur d’envoi des e-mails.", "/admin/reglages/emails")}
        {tile("WhatsApp", o?.channels.whatsapp, "WhatsApp Business et modèles approuvés.", "/admin/centre-marketing/canaux")}
        {tile("SMS", o?.channels.sms, "Fournisseur SMS (Orange, Twilio, Infobip…).", "/admin/centre-marketing/canaux")}
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-ink">Textes des e-mails</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATES.map(([id, label]) => <Link key={id} href={`/admin/reglages/email_${id}`} className="rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-slate-200 hover:bg-slate-100">{label}</Link>)}
        </div>
      </div>
      <SettingsForm key={section.id} section={section} initial={settings.values[section.id] ?? {}} updatedAt={updated?.updatedAt ?? null} />
      {hostSection ? (
        <>
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">Messages à l’hôte</h2>
            <p className="max-w-3xl text-sm text-muted">L’hôte d’une résidence reçoit chaque nouvelle demande avec deux boutons, Accepter ou Refuser, qui marchent sans ouvrir l’application. Rien ne se passe à l’ouverture du lien : l’hôte confirme sur la page. S’il accepte, le voyageur reçoit aussitôt le lien de paiement.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[["host_request", "E-mail : nouvelle demande"], ["host_reminder", "E-mail : relance"]].map(([id, label]) => <Link key={id} href={`/admin/reglages/email_${id}`} className="rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-slate-200 hover:bg-slate-100">{label}</Link>)}
            </div>
          </div>
          <SettingsForm key={hostSection.id} section={hostSection} initial={settings.values[hostSection.id] ?? {}} updatedAt={hostUpdated?.updatedAt ?? null} />
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <p className="border-b border-slate-100 p-4 text-sm font-semibold text-ink">Derniers messages aux hôtes</p>
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="p-3">Date</th><th className="p-3">Message</th><th className="p-3">Canal</th><th className="p-3">Hôte</th><th className="p-3">Résultat</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(o?.hostRecent ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 whitespace-nowrap">{new Date(r.at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="p-3">{STAGE[r.stage ?? ""] ?? r.stage ?? "—"}</td>
                    <td className="p-3">{CHANNEL[r.channel] ?? r.channel}</td>
                    <td className="p-3">{r.phone ? <a href={`tel:${r.phone}`} className="font-semibold text-brand-800 hover:underline">Appeler {r.phone}</a> : null}{r.email ? <span className="block text-xs text-muted">{r.email}</span> : null}</td>
                    <td className={`p-3 font-semibold ${r.status === "sent" ? "text-emerald-700" : "text-red-700"}`}>{r.status === "sent" ? "Envoyé" : "Échec"}</td>
                  </tr>
                ))}
                {!o?.hostRecent?.length ? <tr><td colSpan={5} className="p-6 text-center text-muted">Aucun message envoyé aux hôtes pour l’instant.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <p className="border-b border-slate-100 p-4 text-sm font-semibold text-ink">Derniers messages envoyés aux voyageurs</p>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="p-3">Date</th><th className="p-3">Étape</th><th className="p-3">Canal</th><th className="p-3">Réservation</th><th className="p-3">Voyageur</th><th className="p-3">Résultat</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(o?.recent ?? []).map((r) => (
              <tr key={r.id}>
                <td className="p-3 whitespace-nowrap">{new Date(r.at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="p-3">{STAGE[r.stage ?? ""] ?? r.stage ?? "—"}</td>
                <td className="p-3">{CHANNEL[r.channel] ?? r.channel}</td>
                <td className="p-3">{r.place ?? "—"}<span className="block text-xs text-muted">{r.dates}</span></td>
                <td className="p-3">
                  {r.phone ? <a href={`tel:${r.phone}`} className="font-semibold text-brand-800 hover:underline">Appeler {r.phone}</a> : null}
                  {r.email ? <span className="block text-xs text-muted">{r.email}</span> : null}
                </td>
                <td className={`p-3 font-semibold ${r.status === "sent" ? "text-emerald-700" : "text-red-700"}`}>{r.status === "sent" ? "Envoyé" : "Échec"}</td>
              </tr>
            ))}
            {!o?.recent?.length ? <tr><td colSpan={6} className="p-6 text-center text-muted">Aucun message envoyé pour l’instant.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
