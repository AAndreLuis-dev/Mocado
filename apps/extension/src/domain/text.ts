export const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const plain = (s: string) => semAcento(s).toLowerCase();

export const alnum = (s: string) => plain(s).replace(/[^0-9a-z]/g, '');
