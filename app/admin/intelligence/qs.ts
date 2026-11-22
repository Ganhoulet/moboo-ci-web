export interface Filtre { commune?: string; quartier?: string; type?: string; tx?: string }

export const qs = (f: Filtre) => new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
