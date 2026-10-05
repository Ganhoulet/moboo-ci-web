// Longueur des SMS (miroir de l'API : moboo-resi-api/src/modules/whatsapp/sms.util.ts).
const GSM = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXT = "^{}\\[~]|€";

export function plainSms(text: string) {
  const s = text
    .replace(/[‘’ʼ]/g, "'").replace(/«[\s  ]*/g, '"').replace(/[\s  ]*»/g, '"').replace(/[“”]/g, '"')
    .replace(/…/g, "...").replace(/[–—]/g, "-").replace(/[   ]/g, " ").replace(/œ/g, "oe").replace(/Œ/g, "OE").replace(/•/g, "-");
  let out = "";
  for (const ch of s) {
    if (GSM.includes(ch) || GSM_EXT.includes(ch)) out += ch;
    else {
      const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      out += [...base].every((c) => GSM.includes(c)) ? base : "";
    }
  }
  return out.replace(/ {2,}/g, " ").trim();
}

export function smsInfo(text: string) {
  let units = 0;
  for (const ch of text) {
    if (GSM.includes(ch)) units += 1;
    else if (GSM_EXT.includes(ch)) units += 2;
    else {
      const len = [...text].length;
      return { encoding: "unicode" as const, chars: len, segments: len <= 70 ? 1 : Math.ceil(len / 67) };
    }
  }
  return { encoding: "gsm" as const, chars: units, segments: units <= 160 ? 1 : Math.ceil(units / 153) };
}

/** Compteur affiché sous un texte SMS (variables comptées telles quelles ; lien STOP ≈ 40 caractères). */
export function smsCounter(text: string, plain = true, stop = true) {
  const t = (plain ? plainSms(text) : text) + (stop ? " STOP: moboo.ci/stop/s2250700000000.xxxxxxxxxx" : "");
  const i = smsInfo(t);
  return `${i.chars} caractères${stop ? " (lien STOP compris)" : ""} · ${i.segments} SMS par personne${i.encoding === "unicode" ? " · caractères spéciaux : 70 caractères par SMS" : ""}`;
}
