"use client";

import { useEffect, useState, useTransition } from "react";
import { broadcastProAction } from "@/app/admin/moboo-pro/comptes-actions";

interface Contact { whatsapp: string; email: string }
type Canal = "appli" | "whatsapp" | "email" | "sms" | "relance";

const CANAUX: { key: Canal; label: string }[] = [
  { key: "appli", label: "Notification Moboo Pro" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "E-mail" },
  { key: "sms", label: "SMS" },
  { key: "relance", label: "Relance (1 semaine après)" },
];

const ou = (c: Contact) => [c.whatsapp && `par WhatsApp au ${c.whatsapp}`, c.email && `par e-mail à ${c.email}`].filter(Boolean).join(" ou ") || "en réponse à ce message";

/** Messages prêts à envoyer aux agences pour qu'elles confient leur catalogue (statistiques seulement). */
function modeles(c: Contact): Record<Canal, { titre?: string; objet?: string; texte: string }> {
  return {
    appli: {
      titre: "Votre marché, encore plus précis",
      texte: `Envoyez-nous votre catalogue (Excel) : vos annonces restent privées et ne sont jamais publiées. En retour, vos prix sont comparés au marché de votre zone dans « Mon marché ». Envoi ${ou(c)}.`,
    },
    whatsapp: {
      texte:
`Bonjour,

Moboo Pro vous montre désormais le marché immobilier en direct (loyers et prix par commune, recherches des clients, opportunités) dans l’écran « Mon marché ».

Pour rendre ces chiffres encore plus justes dans votre zone, nous vous proposons de nous confier votre catalogue d’annonces, y compris celles que vous publiez sur d’autres sites :
✅ vos annonces ne sont jamais publiées sur Moboo.ci sans votre accord : elles servent seulement aux statistiques ;
✅ vous voyez où se situent vos prix par rapport au marché de chaque commune ;
✅ vous pouvez retirer votre catalogue à tout moment.

Il suffit d’un fichier Excel (référence, location ou vente, type, chambres, prix, commune, quartier). Envoyez-le ${ou(c)}, nous vous envoyons le modèle si besoin.

Merci de votre confiance,
L’équipe Moboo`,
    },
    email: {
      objet: "Votre catalogue pour des statistiques de marché plus justes (Moboo Pro)",
      texte:
`Bonjour,

Moboo Pro affiche désormais le marché immobilier en direct dans l’écran « Mon marché » : loyers et prix par commune et par quartier, types de biens, recherches des clients, départs de locataires et opportunités.

Pour que ces chiffres soient encore plus justes dans votre zone, nous vous proposons de nous confier votre catalogue d’annonces, y compris celles que vous publiez sur d’autres sites (IvoireDomi, CoinAfrique, etc.).

Ce que cela change pour vous :
- vos annonces ne sont jamais publiées sur Moboo.ci sans votre accord : elles servent uniquement aux statistiques, regroupées par commune ;
- vous voyez où se situent vos prix par rapport au marché de chaque commune ;
- vous pouvez retirer votre catalogue à tout moment, sur simple demande.

Comment faire : un simple fichier Excel avec la référence, location ou vente, le type de bien, le nombre de chambres, le prix, la commune et le quartier. Envoyez-le ${ou(c)}. Si votre logiciel immobilier le permet, l’envoi peut aussi être automatique (API partenaires Moboo).

Nous restons à votre disposition pour toute question.

Bien cordialement,
L’équipe Moboo`,
    },
    sms: {
      texte: `Moboo Pro : confiez-nous votre catalogue (Excel) pour des chiffres de marché plus justes dans votre zone. Vos annonces ne sont jamais publiées. Envoi ${ou(c)}.`,
    },
    relance: {
      texte:
`Bonjour,

Petit rappel : vous pouvez nous confier votre catalogue d’annonces (fichier Excel) pour enrichir les chiffres de « Mon marché » dans Moboo Pro. Vos annonces restent privées et ne sont jamais publiées.

Envoi ${ou(c)}. Nous vous aidons volontiers à préparer le fichier.

L’équipe Moboo`,
    },
  };
}

const lire = (): Contact => {
  try { return JSON.parse(localStorage.getItem("moboo-intel-contact") || "") as Contact; } catch { return { whatsapp: "", email: "" }; }
};

export function AgencyMessages() {
  const [contact, setContact] = useState<Contact>({ whatsapp: "", email: "" });
  const [canal, setCanal] = useState<Canal>("appli");
  const [titre, setTitre] = useState("");
  const [objet, setObjet] = useState("");
  const [texte, setTexte] = useState("");
  const [copie, setCopie] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => { setContact(lire()); }, []);
  // Le texte se régénère quand on change de canal ou de contact (les retouches faites à la main sont alors remplacées).
  useEffect(() => {
    const m = modeles(contact)[canal];
    setTitre(m.titre ?? ""); setObjet(m.objet ?? ""); setTexte(m.texte); setMsg(null);
  }, [canal, contact]);

  const majContact = (c: Contact) => {
    setContact(c);
    try { localStorage.setItem("moboo-intel-contact", JSON.stringify(c)); } catch { /* navigation privée */ }
  };
  const copier = async () => {
    await navigator.clipboard.writeText(canal === "email" ? `Objet : ${objet}\n\n${texte}` : texte).catch(() => undefined);
    setCopie(true); setTimeout(() => setCopie(false), 2000);
  };
  const envoyerAppli = () => {
    if (!window.confirm("Envoyer cette notification à toutes les agences Moboo Pro ?")) return;
    start(async () => {
      const r = await broadcastProAction("agence", titre, texte);
      setMsg(r.ok ? { ok: true, text: "Notification envoyée aux agences." } : { ok: false, text: r.error || "Envoi impossible." });
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Numéro WhatsApp où les agences envoient leur fichier
          <input value={contact.whatsapp} onChange={(e) => majContact({ ...contact, whatsapp: e.target.value })} placeholder="Ex. : +225 07 00 00 00 00" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm font-medium">E-mail où les agences envoient leur fichier
          <input value={contact.email} onChange={(e) => majContact({ ...contact, email: e.target.value })} placeholder="Ex. : marche@moboo.ci" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {CANAUX.map((c) => (
          <button key={c.key} type="button" onClick={() => setCanal(c.key)} className={"rounded-full px-3 py-1 text-sm font-semibold " + (canal === c.key ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300 hover:bg-slate-50")}>{c.label}</button>
        ))}
      </div>
      {canal === "appli" ? (
        <label className="block text-sm font-medium">Titre<input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={120} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
      ) : null}
      {canal === "email" ? (
        <label className="block text-sm font-medium">Objet<input value={objet} onChange={(e) => setObjet(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
      ) : null}
      <label className="block text-sm font-medium">Message (modifiable)
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={canal === "email" || canal === "whatsapp" ? 14 : 4} maxLength={canal === "appli" ? 500 : canal === "sms" ? 320 : 4000} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-relaxed" />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {canal === "appli" ? (
          <button type="button" disabled={pending || titre.trim().length < 3 || !texte.trim()} onClick={envoyerAppli} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{pending ? "Envoi…" : "Envoyer à toutes les agences Moboo Pro"}</button>
        ) : null}
        <button type="button" onClick={copier} className="rounded-md bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">{copie ? "✓ Copié" : "Copier le message"}</button>
        {canal === "whatsapp" || canal === "relance" ? (
          <a href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Ouvrir dans WhatsApp</a>
        ) : null}
        {canal === "email" ? (
          <a href={`mailto:?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(texte)}`} className="rounded-md bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Ouvrir dans ma messagerie</a>
        ) : null}
        <span className="text-xs text-muted">{texte.length} caractères</span>
      </div>
      {msg ? <p className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      <p className="text-xs text-muted">Rien ne part sans votre clic. La notification Moboo Pro va à tous les comptes « agence » ; WhatsApp, e-mail et SMS s’envoient depuis votre téléphone ou votre messagerie, aux agences de votre choix.</p>
    </div>
  );
}
