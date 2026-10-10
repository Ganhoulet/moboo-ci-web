"use client";

import { useEffect, useRef } from "react";
import { myBookingContact } from "@/app/reserver/actions";

/** Pré-remplit « Votre nom » / « Téléphone » quand le visiteur est connecté (site et application). */
export function useBookingContact() {
  const name = useRef<HTMLInputElement>(null);
  const phone = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let live = true;
    myBookingContact().then((c) => {
      if (!live || !c) return;
      if (name.current && !name.current.value) name.current.value = c.name;
      if (phone.current && !phone.current.value) phone.current.value = c.phone;
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  return { name, phone };
}
