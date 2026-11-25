import Link from "next/link";

export const metadata = { title: "Guide de l’account manager" };

/** Une étape du guide : ce qu'on fait, comment, et la capture de l'écran. */
interface Step { id: string; title: string; why: string; how: string[]; img?: string; alt?: string; phone?: boolean; tip?: string }

const STEPS: Step[] = [
  {
    id: "connexion", title: "1. Se connecter", img: "/guide-am/01-connexion.jpg", alt: "Page de connexion account manager", phone: true,
    why: "Votre espace est réservé : il protège les comptes de nos clients.",
    how: [
      "Ouvrez am.moboo.ci (ou moboo.ci/am) sur votre téléphone ou votre ordinateur.",
      "Choisissez « Par téléphone », saisissez votre numéro, puis le code reçu par SMS ou WhatsApp.",
      "La première fois, activez la double sécurité (application d’authentification ou e-mail) : elle est obligatoire.",
    ],
    tip: "Ne prêtez jamais votre accès. Toutes vos actions sont enregistrées à votre nom.",
  },
  {
    id: "journee", title: "2. Commencer sa journée : « Aujourd’hui »", img: "/guide-am/02-aujourdhui.jpg", alt: "Écran Aujourd’hui",
    why: "Tout ce qui est urgent est en haut : les clients qui attendent une réponse.",
    how: [
      "« À appeler maintenant » : les demandes de réservation auxquelles l’hôte n’a pas répondu. Appelez l’hôte (bouton bleu) ou écrivez-lui sur WhatsApp.",
      "« Rappels du jour » : les tâches que vous vous êtes fixées (rappeler, envoyer un lien…).",
      "« Mon portefeuille » : le nombre de comptes qui vous sont confiés.",
    ],
    tip: "La page se met à jour toute seule. Gardez-la ouverte pendant la journée.",
  },
  {
    id: "reservation", title: "3. Confirmer une réservation pour un hôte", img: "/guide-am/03-aujourdhui-telephone.jpg", alt: "Carte d’une réservation à confirmer sur téléphone", phone: true,
    why: "Un voyageur qui attend trop longtemps réserve ailleurs. Vous êtes là pour que personne n’attende.",
    how: [
      "Appelez l’hôte : « Bonjour, ici Moboo, vous avez une demande pour [logement] du [dates] : le logement est-il libre ? »",
      "S’il est d’accord : « Confirmer pour l’hôte ». Le voyageur reçoit tout de suite son lien de paiement.",
      "S’il refuse : « Refuser (indisponible) » avec la raison. Si les dates changent : « Changer les dates ».",
      "Pas de réponse ? Cliquez « Pas de réponse » : c’est noté et vous serez relancé.",
    ],
  },
  {
    id: "portefeuille", title: "4. Suivre son portefeuille", img: "/guide-am/04-portefeuille.jpg", alt: "Portefeuille",
    why: "Vos comptes, leur note de santé sur 100 et leurs signaux d’alerte, d’un seul coup d’œil.",
    how: [
      "Vert = en forme, orange = à surveiller, rouge = à risque : commencez par les rouges.",
      "Les signaux (réservation à confirmer, photos de faible qualité, annulations…) disent quoi faire.",
      "Cliquez sur le nom d’un client pour ouvrir sa fiche de suivi.",
    ],
  },
  {
    id: "fiche", title: "5. La fiche d’un client : appeler, noter, aider", img: "/guide-am/05-fiche-client.jpg", alt: "Fiche de suivi d’un client",
    why: "Tout l’historique du client au même endroit : ce que vous avez fait, ce que vos collègues ont fait.",
    how: [
      "Après chaque appel ou message, notez-le dans « Ajouter un suivi » (joint, sans réponse, à rappeler…).",
      "Programmez une tâche si vous devez revenir vers lui (elle apparaîtra dans « Rappels du jour »).",
      "Les recommandations proposent des améliorations à envoyer au client en un clic.",
    ],
  },
  {
    id: "studio", title: "6. Publier pour un agent (Studio)", img: "/guide-am/06-studio.jpg", alt: "Studio de publication",
    why: "Beaucoup d’agents envoient leurs biens par WhatsApp : vous les publiez pour eux en 1 minute.",
    how: [
      "Choisissez l’agent. Sans « Accord validé », envoyez-lui d’abord le lien d’accord.",
      "Collez son message WhatsApp, ajoutez les photos : l’IA remplit la fiche. Vérifiez le prix, la commune et le type.",
      "Publiez : l’annonce est en ligne au nom de l’agent, les clients l’appellent directement.",
    ],
    tip: "Jamais de publication sans l’accord de l’agent : c’est la règle.",
  },
  {
    id: "support", title: "7. Répondre à un client qui a un problème", img: "/guide-am/08-support-conversation.jpg", alt: "Conversation de support avec une capture",
    why: "Le client vous montre son problème avec une capture : vous comprenez tout de suite et vous réglez.",
    how: [
      "Sur sa fiche, « Lien support » : écrivez le sujet, « Créer le lien », puis « Envoyer par WhatsApp ».",
      "Le client ouvre le lien sur son téléphone, décrit le problème et joint une capture d’écran.",
      "Sa demande arrive dans l’onglet « Support » avec une pastille. Répondez : il est prévenu par SMS.",
      "Quand c’est réglé : « Problème réglé : clore ».",
    ],
  },
  {
    id: "support-client", title: "Ce que voit le client", img: "/guide-am/09-support-client.jpg", alt: "Page du lien support côté client", phone: true,
    why: "Une page simple, sans mot de passe, avec votre nom et votre photo : le client sait à qui il parle.",
    how: ["Ajoutez une vraie photo à votre profil (« Mon profil ») : les clients répondent plus volontiers."],
  },
  {
    id: "compte", title: "8. Intervenir dans le compte d’un client", img: "/guide-am/10-connexion-directe.jpg", alt: "Aider le client dans son compte",
    why: "Quand le client vous le demande, vous pouvez modifier ses annonces ou son profil à sa place.",
    how: [
      "Accès assisté : « Demander l’accès au client ». Il reçoit un code et vous le donne au téléphone.",
      "Connexion directe (si votre rôle le permet) : écrivez le motif, puis « Ouvrir son compte ». Le client est prévenu tout de suite.",
      "Vous êtes dans son compte (bandeau en haut) : faites la modification, puis « Terminer ». Le client reçoit le récapitulatif.",
    ],
    tip: "Paiements, mot de passe, numéro et suppression restent bloqués. Ne demandez jamais un mot de passe.",
  },
  {
    id: "academie", title: "9. Écrire avec l’Académie", img: "/guide-am/11-academie.jpg", alt: "Académie des messages",
    why: "Les bons mots pour chaque situation, comme dans les grandes plateformes. Toute l’équipe parle d’une même voix.",
    how: [
      "Ouvrez l’Académie depuis la fiche du client (son nom et son numéro sont remplis).",
      "Choisissez la situation (accueil, relance, réservation, problème…) et le message.",
      "Complétez les éléments entre accolades, relisez, puis « Envoyer par WhatsApp / SMS / E-mail ». L’envoi est noté dans le suivi.",
    ],
  },
  {
    id: "actions", title: "10. Mes actions et mes objectifs", img: "/guide-am/12-mes-actions.jpg", alt: "Mes actions",
    why: "Tout ce que vous faites est noté : c’est votre historique, et la garantie pour nos clients.",
    how: [
      "« Mes actions » : le journal de vos actions (publications, accès, réservations, liens…).",
      "« Objectifs » : vos chiffres du mois et vos objectifs (réservations confirmées, délai d’intervention, contacts…).",
    ],
  },
];

const RULES = [
  "Répondre vite : une demande de réservation ne doit jamais attendre plus de 5 minutes.",
  "Toujours noter ce que vous faites dans la fiche du client.",
  "Ne jamais demander ni noter un mot de passe ou un code de paiement.",
  "Publier ou modifier seulement avec l’accord du client.",
  "Rester courtois en toutes circonstances : utilisez les formules de l’Académie.",
  "Un doute, un litige, un client mécontent : prévenez votre responsable.",
];

/** Guide de l'account manager : le métier pas à pas, avec les captures des écrans. */
export default function AmGuide() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Guide de l’account manager</h1>
        <p className="max-w-3xl text-sm text-muted">Votre métier pas à pas : chaque écran, ce qu’il sert à faire et comment s’en servir. Les captures montrent des données d’exemple.</p>
        <nav className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {STEPS.filter((s) => /^\d/.test(s.title)).map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full bg-white px-2.5 py-1 font-semibold text-brand-800 ring-1 ring-slate-200">{s.title.replace(/^\d+\.\s*/, "")}</a>)}
        </nav>
      </div>

      <section className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
        <h2 className="font-display text-base font-bold text-ink">Les règles d’or</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">{RULES.map((r) => <li key={r}>{r}</li>)}</ol>
      </section>

      {STEPS.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-4 rounded-lg bg-white p-4 ring-1 ring-slate-200 sm:p-5">
          <div className={"grid gap-5 " + (s.img ? (s.phone ? "md:grid-cols-[1fr_16rem]" : "lg:grid-cols-[1fr_1.3fr]") : "")}>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">{s.title}</h2>
              <p className="mt-1 text-sm text-muted">{s.why}</p>
              <ol className="mt-3 space-y-2 text-sm text-ink">
                {s.how.map((h, i) => (
                  <li key={h} className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-800 text-[11px] font-bold text-white">{i + 1}</span><span>{h}</span></li>
                ))}
              </ol>
              {s.tip ? <p className="mt-3 rounded-md bg-slate-50 p-2.5 text-xs text-slate-700">💡 {s.tip}</p> : null}
            </div>
            {s.img ? (
              <a href={s.img} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.alt ?? s.title} loading="lazy" className={"w-full rounded-lg ring-1 ring-slate-200 " + (s.phone ? "mx-auto max-h-[32rem] max-w-[16rem] object-cover object-top" : "")} />
              </a>
            ) : null}
          </div>
        </section>
      ))}

      <p className="text-sm text-muted">Une question sur votre métier ? Votre responsable est là. Pour les messages aux clients, pensez à l’<Link href="/admin/comptes/academie" className="font-semibold text-brand-800">Académie</Link>.</p>
    </div>
  );
}
