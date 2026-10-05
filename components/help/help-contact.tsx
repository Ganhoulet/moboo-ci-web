import { getSiteSettings } from "@/lib/settings";

/** Bloc « Vous n'avez pas trouvé ? » : WhatsApp, téléphone, e-mail du support (Réglages → Pages légales). */
export async function HelpContact() {
  const { legal } = await getSiteSettings();
  const phone = (legal.contactPhone || "").trim();
  const digits = phone.replace(/[^\d]/g, "");
  const wa = digits ? (digits.length === 10 ? `225${digits}` : digits) : "";
  return (
    <section className="rounded-3xl bg-gradient-to-br from-brand-800 to-brand-900 p-6 text-white shadow-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-extrabold">Vous n’avez pas trouvé votre réponse ?</h2>
          <p className="mt-1 text-white/80">Notre équipe vous répond du lundi au samedi. Donnez-nous le plus de détails possible (numéro du compte, lien de l’annonce, référence de réservation).</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {wa ? <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Bonjour Moboo.ci, j’ai besoin d’aide : ")}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white hover:brightness-95">WhatsApp</a> : null}
          {phone ? <a href={`tel:${phone.replace(/\s/g, "")}`} className="rounded-full bg-white/10 px-5 py-3 text-sm font-bold ring-1 ring-white/30 hover:bg-white/20">Appeler {phone}</a> : null}
          {legal.contactEmail ? <a href={`mailto:${legal.contactEmail}`} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-900 hover:bg-brand-50">Écrire un e-mail</a> : null}
        </div>
      </div>
    </section>
  );
}
