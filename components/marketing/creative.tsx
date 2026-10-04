// Rendu d'une créa marketing (bannière / pop-up), identique à celui de
// l'application mobile : image seule, texte + photo (split) ou photo en fond (hero).
// Module neutre (aucun hook) : utilisable côté serveur et dans le back-office.

export interface Creative {
  id?: string;
  template: "image" | "split" | "hero";
  title?: string | null;
  text?: string | null;
  imageUrl?: string | null;
  badge?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  bgColor: string;
  textColor: string;
  ctaColor: string;
}

export function CreativeView({ c, variant }: { c: Creative; variant: "banner" | "popup" }) {
  const popup = variant === "popup";
  if (c.template === "image") {
    return c.imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={c.imageUrl} alt={c.title || ""} className={"block w-full object-cover " + (popup ? "rounded-2xl" : "aspect-[21/9] rounded-2xl")} />
    ) : (
      <div className="grid aspect-[21/9] place-items-center rounded-2xl bg-slate-100 text-sm text-slate-400">Image de la créa</div>
    );
  }
  const cta = c.ctaLabel ? (
    <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm" style={{ background: c.ctaColor }}>
      {c.ctaLabel} <span aria-hidden>›</span>
    </span>
  ) : null;
  const badge = c.badge ? <span className="inline-block rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">{c.badge}</span> : null;

  if (c.template === "hero" || popup) {
    return (
      <div className={"relative flex flex-col justify-end overflow-hidden rounded-2xl " + (popup ? "aspect-[4/5]" : "aspect-[21/9]")} style={{ background: c.bgColor, color: c.textColor }}>
        {c.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${c.bgColor} 8%, ${c.bgColor}cc 38%, transparent 75%)` }} />
        {badge ? <div className="absolute right-3 top-3">{badge}</div> : null}
        <div className={"relative text-center " + (popup ? "p-6" : "p-4")}>
          {c.title ? <p className={"font-display font-black leading-tight " + (popup ? "text-2xl" : "text-lg")}>{c.title}</p> : null}
          {c.text ? <p className="mt-1 text-sm opacity-90">{c.text}</p> : null}
          {cta}
        </div>
      </div>
    );
  }
  // split : texte à gauche, photo à droite (bannière d'accueil)
  return (
    <div className="relative flex min-h-[132px] overflow-hidden rounded-2xl" style={{ background: c.bgColor, color: c.textColor }}>
      <div className={"relative z-10 flex flex-col justify-center p-4 " + (c.imageUrl ? "w-[58%]" : "w-full sm:px-6")}>
        {badge ? <div className="mb-1">{badge}</div> : null}
        {c.title ? <p className="font-display text-base font-black leading-tight sm:text-lg">{c.title}</p> : null}
        {c.text ? <p className="mt-1 line-clamp-2 text-xs opacity-90">{c.text}</p> : null}
        {cta ? <div>{cta}</div> : null}
      </div>
      {c.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.imageUrl} alt="" className="absolute inset-y-0 right-0 h-full w-[50%] object-cover [mask-image:linear-gradient(to_right,transparent,black_30%)]" />
      ) : null}
    </div>
  );
}
