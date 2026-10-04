"use client";

import { useEffect, useState } from "react";
import { presenceAction } from "@/app/signals-actions";
import { TONE_CLASS, type ConversionSignal, type SignalTarget } from "@/lib/signals";

function visitorId() {
  try {
    let v = localStorage.getItem("moboo_vid");
    if (!v) { v = `v-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`; localStorage.setItem("moboo_vid", v); }
    return v;
  } catch {
    return `v-${Math.random().toString(36).slice(2, 14)}`;
  }
}

/**
 * Messages de conversion d'une fiche (façon Booking), à partir de données réelles :
 * premier rendu côté serveur, puis présence du visiteur et mise à jour chaque minute.
 */
export function ConversionSignals({ type, id, initial, checkIn, checkOut, className = "" }: {
  type: SignalTarget; id: string; initial: ConversionSignal[]; checkIn?: string; checkOut?: string; className?: string;
}) {
  const [items, setItems] = useState(initial);
  useEffect(() => {
    const v = visitorId();
    let alive = true;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      presenceAction(type, id, v, { checkIn, checkOut }).then((x) => { if (alive) setItems(x); }).catch(() => {});
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => { alive = false; clearInterval(t); };
  }, [type, id, checkIn, checkOut]);
  if (!items.length) return null;
  return (
    <ul className={"flex flex-col gap-2 " + className} aria-label="Infos sur la demande">
      {items.map((s) => (
        <li key={s.key} className={"flex items-start gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 " + TONE_CLASS[s.tone]}>
          <span aria-hidden>{s.icon}</span><span>{s.text}</span>
        </li>
      ))}
    </ul>
  );
}
