import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { formatXOF, getListing } from "@/lib/api";
import { getSiteSettings } from "@/lib/settings";
import { MobooLogo } from "@/components/logo";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { robots: { index: false } };

const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement", maison: "Maison", villa: "Villa", studio: "Studio",
  terrain: "Terrain", bureau: "Bureau", magasin: "Magasin", autre: "Bien",
};

/**
 * Fiche imprimable d'une annonce (back-office → Imprimer la propriété) :
 * logo, photo, prix, détails, description, équipements, galerie, contact.
 */
export default async function PrintListing({ params }: { params: { id: string } }) {
  const [l, settings] = await Promise.all([getListing(params.id), getSiteSettings()]);
  const cfg = settings.print;
  if (!l || !cfg.enabled) notFound();

  const zone = [l.quartier, l.commune, l.city].filter(Boolean).join(", ");
  const details: [string, string][] = [
    ["Transaction", l.transaction === "rent" ? "À louer" : "À vendre"],
    ["Type", TYPE_LABEL[l.propertyType] ?? "Bien"],
    ...(l.bedrooms != null ? [["Chambres", String(l.bedrooms)] as [string, string]] : []),
    ...(l.bathrooms != null ? [["Salles de bain", String(l.bathrooms)] as [string, string]] : []),
    ...(l.surface != null ? [["Surface", `${l.surface} m²`] as [string, string]] : []),
    ...(l.garage ? [["Garage", String(l.garage)] as [string, string]] : []),
    ...(l.reference ? [["Référence", String(l.reference)] as [string, string]] : []),
  ];
  // Annonceur : agent / agence (reprise WP), sinon compte du site, sinon contact saisi.
  const contact = l.agent
    ? { name: l.agent.name, phone: l.agent.phone, whatsapp: l.agent.whatsapp, email: l.agent.email, photo: l.agent.photoUrl, role: l.agent.kind === "agency" ? "Agence" : "Agent" }
    : l.owner
      ? { name: l.owner.name, phone: l.owner.phone, whatsapp: l.owner.whatsapp, email: l.owner.email, photo: l.owner.photoUrl, role: "Annonceur" }
      : { name: l.contactName || "Annonceur", phone: l.contactPhone, whatsapp: null, email: null, photo: null, role: "Annonceur" };
  const logo = cfg.logoUrl || settings.branding.logoUrl;
  // Adresse publique de la fiche, sur le domaine consulté (moboo.ci, Vercel…).
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "moboo.ci";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/annonce/${l.id}`;
  // QR code généré ici (SVG), sans service extérieur : scanné, il ouvre la fiche.
  const qr = cfg.showQr ? await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0f172a", light: "#ffffff" } }) : null;

  return (
    <div className="mx-auto max-w-3xl bg-white px-6 py-8 text-ink print:max-w-none print:px-0 print:py-0">
      {/* Feuille A4 avec de vraies marges : rien ne touche les bords à l'impression / en PDF. */}
      <style>{`@page { size: A4; margin: 16mm 14mm; } @media print { html, body { background: #fff !important; } }`}</style>
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link href={`/annonce/${l.id}`} className="text-sm font-semibold text-brand-800 hover:underline">← Retour à l’annonce</Link>
        <PrintButton />
      </div>

      <header className="flex items-center justify-between border-b-2 border-brand-800 pb-4">
        <MobooLogo src={logo} height={40} alt={settings.branding.siteName} />
        <p className="text-right text-xs text-slate-500">{new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}<br />{url}</p>
      </header>

      <section className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold">{l.title}</h1>
          <p className="mt-1 text-slate-600">{zone}</p>
        </div>
        <p className="shrink-0 text-right text-xl font-extrabold text-brand-800">
          {formatXOF(l.price)}{l.transaction === "rent" ? <span className="block text-xs font-medium text-slate-500">par mois</span> : null}
        </p>
      </section>

      {l.photos?.[0] || qr ? (
        <div className="relative mt-4 break-inside-avoid">
          {l.photos?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.photos[0]} alt="" className="aspect-[16/9] w-full rounded-lg object-cover print:rounded-none" />
          ) : <div className="h-40" />}
          {qr ? (
            <div className="absolute bottom-3 right-3 w-32 rounded-lg bg-white p-2 text-center shadow-md ring-1 ring-slate-200 print:shadow-none">
              <div className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="mt-1 text-[10px] font-semibold leading-tight text-slate-700">Scannez pour voir l’annonce</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {cfg.showAgent ? (
        <section className="mt-4 flex break-inside-avoid items-center gap-4 rounded-lg border border-slate-200 p-4">
          {contact.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contact.photo} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-md bg-brand-800 text-xl font-bold text-white">{(contact.name || "?").charAt(0).toUpperCase()}</span>
          )}
          <div className="min-w-0 space-y-0.5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{contact.role}</p>
            <p className="flex items-center gap-2 font-bold text-ink"><span aria-hidden>👤</span>{contact.name}</p>
            {contact.phone || contact.whatsapp ? (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-0.5 font-semibold">
                {contact.phone ? <span><span aria-hidden>📞</span> {contact.phone}</span> : null}
                {contact.whatsapp && contact.whatsapp !== contact.phone ? <span>WhatsApp : {contact.whatsapp}</span> : contact.whatsapp ? <span className="text-slate-500">(WhatsApp)</span> : null}
              </p>
            ) : null}
            {contact.email ? <p><span aria-hidden>✉️</span> {contact.email}</p> : null}
          </div>
        </section>
      ) : null}

      {cfg.showDetails ? (
        <section className="mt-6 break-inside-avoid">
          <h2 className="border-b border-slate-200 pb-1 font-display text-lg font-bold">Détails</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            {details.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-dotted border-slate-200 pb-1"><dt className="text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </dl>
        </section>
      ) : null}

      {cfg.showDescription && l.description ? (
        <section className="mt-6">
          <h2 className="border-b border-slate-200 pb-1 font-display text-lg font-bold">Description</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">{l.description}</p>
        </section>
      ) : null}

      {cfg.showFeatures && l.features?.length ? (
        <section className="mt-6 break-inside-avoid">
          <h2 className="border-b border-slate-200 pb-1 font-display text-lg font-bold">Équipements</h2>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 text-sm sm:grid-cols-3">
            {l.features.map((f) => <li key={f}>✓ {f}</li>)}
          </ul>
        </section>
      ) : null}

      {cfg.showGallery && (l.photos?.length ?? 0) > 1 ? (
        <section className="mt-6">
          <h2 className="border-b border-slate-200 pb-1 font-display text-lg font-bold">Galerie</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {l.photos.slice(1, 10).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p} src={p} alt="" className="aspect-[4/3] w-full break-inside-avoid rounded object-cover" />
            ))}
          </div>
        </section>
      ) : null}


      <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-xs text-slate-500">{cfg.footerText}</footer>
    </div>
  );
}
