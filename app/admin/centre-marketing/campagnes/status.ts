export const STATUS: Record<string, [string, string]> = {
  draft: ["Brouillon", "bg-slate-100 text-slate-700"],
  scheduled: ["Programmée", "bg-sky-100 text-sky-800"],
  sending: ["Envoi en cours", "bg-amber-100 text-amber-800"],
  sent: ["Envoyée", "bg-emerald-100 text-emerald-800"],
  cancelled: ["Arrêtée", "bg-red-100 text-red-800"],
};
export const CHANNEL: Record<string, string> = { email: "E-mail", whatsapp: "WhatsApp", sms: "SMS", push: "Push" };
export const when = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
