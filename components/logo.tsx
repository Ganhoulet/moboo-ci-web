/**
 * Logo Moboo — trois anneaux bleus + wordmark (repris de moboo.ci), ou le logo
 * choisi dans le back-office (Logos et favicon).
 */
export function MobooLogo({ className = "", src, height = 32, alt = "Moboo.ci", tone = "light" }: {
  className?: string; src?: string | null; height?: number; alt?: string;
  /** « dark » : logo par défaut en blanc (en-tête sombre). */
  tone?: "light" | "dark";
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} style={{ height }} className={`w-auto ${className}`} />;
  }
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg width="34" height="30" viewBox="0 0 48 44" aria-hidden="true" className="shrink-0">
        <g fill="none" stroke={tone === "dark" ? "#fff" : "#1e40af"} strokeWidth="5">
          <circle cx="24" cy="13" r="10" />
          <circle cx="15" cy="29" r="10" />
          <circle cx="33" cy="29" r="10" />
        </g>
      </svg>
      <span className={"text-[1.35rem] font-black tracking-tight font-display " + (tone === "dark" ? "text-white" : "text-brand-900")}>
        Moboo
      </span>
    </span>
  );
}
