// Mirrors core's `semAcento`: the injected script imports this file but never core (size budget).
export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Lowercase without accents: "São João" → "sao joao". */
export const plain = (s: string) => semAcento(s).toLowerCase();

/** Lowercase alphanumerics only, so masks don't matter: "123.456.789-09" → "12345678909". */
export const alnum = (s: string) => plain(s).replace(/[^0-9a-z]/g, '');
