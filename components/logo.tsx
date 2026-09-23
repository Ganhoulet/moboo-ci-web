/** Logo Moboo — trois anneaux bleus + wordmark (repris de moboo.ci). */
export function MobooLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg width="34" height="30" viewBox="0 0 48 44" aria-hidden="true" className="shrink-0">
        <g fill="none" stroke="#1e40af" strokeWidth="5">
          <circle cx="24" cy="13" r="10" />
          <circle cx="15" cy="29" r="10" />
          <circle cx="33" cy="29" r="10" />
        </g>
      </svg>
      <span className="text-[1.35rem] font-black tracking-tight text-brand-900 font-display">
        Moboo
      </span>
    </span>
  );
}
