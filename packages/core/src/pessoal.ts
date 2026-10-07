import { type Generator } from './types';
import { defaultRng, digits, int, pick, type Rng } from './rng';
import { maskIf, onlyDigits, pad } from './mask';
import { DDD, UFS, type UF } from './uf';
import NOMES from './data/nomes.json' with { type: 'json' };
import SOBRENOMES from './data/sobrenomes.json' with { type: 'json' };

export type Sexo = 'M' | 'F';
export const SEXO_LABEL: Record<Sexo, string> = { M: 'Masculino', F: 'Feminino' };

interface RngOpt {
  rng?: Rng;
}

export const sexo = ({ rng = defaultRng }: RngOpt = {}): Sexo => pick(rng, ['M', 'F'] as const);

export const primeiroNome = ({ sexo: s, rng = defaultRng }: RngOpt & { sexo?: Sexo } = {}) =>
  pick(rng, NOMES[s ?? sexo({ rng })]);

export const sobrenome = ({ rng = defaultRng }: RngOpt = {}) => pick(rng, SOBRENOMES);

/** "Primeiro Sobrenome1 Sobrenome2" (two distinct surnames). */
export function nomeCompleto({ sexo: s, rng = defaultRng }: RngOpt & { sexo?: Sexo } = {}): string {
  const first = primeiroNome({ sexo: s, rng });
  const a = sobrenome({ rng });
  let b: string;
  do b = sobrenome({ rng });
  while (b === a);
  return `${first} ${a} ${b}`;
}

/** Parents coherent with the child: mother keeps the 1st surname, father passes the last one. */
export function pais(
  nome: string,
  { rng = defaultRng }: RngOpt = {},
): { mae: string; pai: string } {
  const parts = nome.split(' ');
  const [first, last] = [parts[1] ?? sobrenome({ rng }), parts.at(-1) ?? sobrenome({ rng })];
  return {
    mae: `${primeiroNome({ sexo: 'F', rng })} ${sobrenome({ rng })} ${first}`,
    pai: `${primeiroNome({ sexo: 'M', rng })} ${sobrenome({ rng })} ${last}`,
  };
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

/** RFC 2606 reserved domains: generated addresses never reach a real inbox. */
export const EMAIL_DOMINIOS = ['example.com', 'example.net', 'example.org'] as const;

export function email(
  nome: string,
  { rng = defaultRng, dominio }: RngOpt & { dominio?: string } = {},
): string {
  const parts = nome.split(' ').map(slug).filter(Boolean);
  const first = parts[0] ?? 'usuario';
  const last = parts.at(-1) ?? 'teste';
  const user = pick(rng, [
    `${first}.${last}`,
    `${first}${last}`,
    `${first}.${last}${int(rng, 1, 99)}`,
    `${first[0]}${last}${int(rng, 1, 999)}`,
  ]);
  return `${user}@${dominio ?? pick(rng, EMAIL_DOMINIOS)}`;
}

// ---------- Telefone ----------

export type TelefoneTipo = 'fixo' | 'celular';

export interface TelefoneOptions {
  uf?: UF;
  tipo?: TelefoneTipo;
}

const ALL_DDD = new Set(Object.values(DDD).flat());

export const telefone: Generator<TelefoneOptions> = {
  generate({ uf, tipo = 'celular', rng = defaultRng, masked = true } = {}) {
    const ddd = pick(rng, DDD[uf ?? pick(rng, UFS)]);
    const num =
      tipo === 'celular' ? '9' + int(rng, 6, 9) + digits(rng, 7) : int(rng, 2, 5) + digits(rng, 7);
    return telefone.format(`${ddd}${num}`, { masked });
  },
  validate(value, { uf, tipo } = {}) {
    const v = onlyDigits(value);
    if (/[^\d\s()+-]/.test(value)) return false;
    const ddd = Number(v.slice(0, 2));
    if (!(uf ? DDD[uf].includes(ddd) : ALL_DDD.has(ddd))) return false;
    const celular = /^\d{2}9\d{8}$/.test(v);
    const fixo = /^\d{2}[2-5]\d{7}$/.test(v);
    return tipo === 'celular' ? celular : tipo === 'fixo' ? fixo : celular || fixo;
  },
  format: (value, { masked }) => {
    const v = onlyDigits(value);
    return maskIf(v, v.length === 11 ? '(##) #####-####' : '(##) ####-####', masked);
  },
};

export const dddUF = (value: string): UF | undefined => {
  const ddd = Number(onlyDigits(value).slice(0, 2));
  return UFS.find((uf) => DDD[uf].includes(ddd));
};

// ---------- Datas ----------

/** "DD/MM/AAAA" */
export const dataBR = (d: Date) =>
  `${pad(d.getDate(), 2)}/${pad(d.getMonth() + 1, 2)}/${d.getFullYear()}`;

/** "DD/MM/AAAA" → "AAAA-MM-DD" (for <input type="date">). */
export const dataISO = (br: string) => br.split('/').reverse().join('-');

export function idade(br: string, now = new Date()): number {
  const [d = 0, m = 0, y = 0] = br.split('/').map(Number);
  const age = now.getFullYear() - y;
  return now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d) ? age - 1 : age;
}

/** Birth date ("DD/MM/AAAA") for an age in [idadeMin, idadeMax]. */
export function nascimento({
  idadeMin = 18,
  idadeMax = 60,
  rng = defaultRng,
  now = new Date(),
}: RngOpt & { idadeMin?: number; idadeMax?: number; now?: Date } = {}): string {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const day = 86_400_000;
  // youngest: born today − idadeMin years; oldest: born (idadeMax + 1) years ago + 1 day
  const latest = Date.UTC(now.getFullYear() - idadeMin, now.getMonth(), now.getDate());
  const earliest = Date.UTC(now.getFullYear() - idadeMax - 1, now.getMonth(), now.getDate()) + day;
  const t =
    earliest +
    int(rng, 0, Math.max(0, Math.floor((Math.min(latest, today) - earliest) / day))) * day;
  const d = new Date(t);
  return dataBR(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ---------- Senha ----------

export interface SenhaOptions {
  tamanho?: number;
  maiusculas?: boolean;
  minusculas?: boolean;
  numeros?: boolean;
  simbolos?: boolean;
}

const CLASSES = {
  maiusculas: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  minusculas: 'abcdefghijkmnopqrstuvwxyz',
  numeros: '23456789',
  simbolos: '!@#$%&*?-_+=',
};

/** Password with at least one char of each enabled class. */
export function senha({
  tamanho = 12,
  maiusculas = true,
  minusculas = true,
  numeros = true,
  simbolos = true,
  rng = defaultRng,
}: SenhaOptions & RngOpt = {}): string {
  const on = (Object.keys(CLASSES) as (keyof typeof CLASSES)[]).filter(
    (k) => ({ maiusculas, minusculas, numeros, simbolos })[k],
  );
  const pools = (on.length ? on : (['minusculas'] as const)).map((k) => CLASSES[k]);
  const size = Math.max(tamanho, pools.length);
  const chars = pools.map((p) => pick(rng, [...p]));
  const all = [...pools.join('')];
  while (chars.length < size) chars.push(pick(rng, all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = int(rng, 0, i);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join('');
}
