"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Recherche de l'en-tête du téléphone, façon MagicBricks : sur une page qui a sa propre
 * recherche (accueil, #hero-search), elle n'apparaît qu'une fois ce formulaire dépassé ;
 * ailleurs, elle est toujours là. `idle` : ce qui s'affiche à sa place (logo, boutons).
 */
export function MobileSearchReveal({ reveal, search, idle }: { reveal: boolean; search: React.ReactNode; idle?: React.ReactNode }) {
  const path = usePathname();
  const [show, setShow] = useState(!reveal);
  useEffect(() => {
    if (!reveal) return setShow(true);
    const el = document.getElementById("hero-search");
    if (!el) return setShow(true);
    setShow(false);
    // Visible dès que le bas du formulaire passe sous l'en-tête (≈ 60 px).
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: "-60px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [reveal, path]);
  if (!show) return idle ? <>{idle}</> : null;
  return <div className="flex min-w-0 flex-1 animate-[fadeIn_.2s_ease-out]">{search}</div>;
}
