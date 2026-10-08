export const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const plain = (s: string) => stripAccents(s).toLowerCase();

export const alnum = (s: string) => plain(s).replace(/[^0-9a-z]/g, '');
