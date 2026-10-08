import { type Generator } from './types';
import { defaultRng, digits, int, pick, type Rng } from './rng';
import { maskIf, onlyDigits, pad, stripAccents } from './mask';
import { DDD, UFS, type UF } from './uf';
import NOMES from './data/nomes.json' with { type: 'json' };
import SOBRENOMES from './data/sobrenomes.json' with { type: 'json' };

export type Sex = 'M' | 'F';
export const SEX_LABEL: Record<Sex, string> = { M: 'Masculino', F: 'Feminino' };

interface RngOption {
  rng?: Rng;
}

export const sex = ({ rng = defaultRng }: RngOption = {}): Sex => pick(rng, ['M', 'F'] as const);

export const firstName = ({ sex: s, rng = defaultRng }: RngOption & { sex?: Sex } = {}) =>
  pick(rng, NOMES[s ?? sex({ rng })]);

export const lastName = ({ rng = defaultRng }: RngOption = {}) => pick(rng, SOBRENOMES);

export function fullName({ sex: s, rng = defaultRng }: RngOption & { sex?: Sex } = {}): string {
  const first = firstName({ sex: s, rng });
  const a = lastName({ rng });
  let b: string;
  do b = lastName({ rng });
  while (b === a);
  return `${first} ${a} ${b}`;
}

export function parents(
  nome: string,
  { rng = defaultRng }: RngOption = {},
): { mother: string; father: string } {
  const parts = nome.split(' ');
  const [first, last] = [parts[1] ?? lastName({ rng }), parts.at(-1) ?? lastName({ rng })];
  return {
    mother: `${firstName({ sex: 'F', rng })} ${lastName({ rng })} ${first}`,
    father: `${firstName({ sex: 'M', rng })} ${lastName({ rng })} ${last}`,
  };
}

const slug = (s: string) =>
  stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

export const EMAIL_DOMAINS = ['example.com', 'example.net', 'example.org'] as const;

export function email(
  nome: string,
  { rng = defaultRng, domain }: RngOption & { domain?: string } = {},
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
  return `${user}@${domain ?? pick(rng, EMAIL_DOMAINS)}`;
}

export type PhoneKind = 'fixo' | 'celular';

export interface PhoneOptions {
  uf?: UF;
  kind?: PhoneKind;
}

const ALL_DDDS = new Set(Object.values(DDD).flat());

export const phone: Generator<PhoneOptions> = {
  generate({ uf, kind = 'celular', rng = defaultRng, masked = true } = {}) {
    const ddd = pick(rng, DDD[uf ?? pick(rng, UFS)]);
    const num =
      kind === 'celular' ? '9' + int(rng, 6, 9) + digits(rng, 7) : int(rng, 2, 5) + digits(rng, 7);
    return phone.format(`${ddd}${num}`, { masked });
  },
  validate(value, { uf, kind } = {}) {
    const v = onlyDigits(value);
    if (/[^\d\s()+-]/.test(value)) return false;
    const ddd = Number(v.slice(0, 2));
    if (!(uf ? DDD[uf].includes(ddd) : ALL_DDDS.has(ddd))) return false;
    const celular = /^\d{2}9\d{8}$/.test(v);
    const fixo = /^\d{2}[2-5]\d{7}$/.test(v);
    return kind === 'celular' ? celular : kind === 'fixo' ? fixo : celular || fixo;
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

export const formatDateBR = (d: Date) =>
  `${pad(d.getDate(), 2)}/${pad(d.getMonth() + 1, 2)}/${d.getFullYear()}`;

export const brDateToISO = (br: string) => br.split('/').reverse().join('-');

export function age(br: string, now = new Date()): number {
  const [d = 0, m = 0, y = 0] = br.split('/').map(Number);
  const age = now.getFullYear() - y;
  return now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d) ? age - 1 : age;
}

export function birthDate({
  minAge = 18,
  maxAge = 60,
  rng = defaultRng,
  now = new Date(),
}: RngOption & { minAge?: number; maxAge?: number; now?: Date } = {}): string {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const day = 86_400_000;
  const latest = Date.UTC(now.getFullYear() - minAge, now.getMonth(), now.getDate());
  const earliest = Date.UTC(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate()) + day;
  const t =
    earliest +
    int(rng, 0, Math.max(0, Math.floor((Math.min(latest, today) - earliest) / day))) * day;
  const d = new Date(t);
  return formatDateBR(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export interface PasswordOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}

const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lowercase: 'abcdefghijkmnopqrstuvwxyz',
  numbers: '23456789',
  symbols: '!@#$%&*?-_+=',
};

export function password({
  length = 12,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true,
  rng = defaultRng,
}: PasswordOptions & RngOption = {}): string {
  const on = (Object.keys(CHARACTER_SETS) as (keyof typeof CHARACTER_SETS)[]).filter(
    (k) => ({ uppercase, lowercase, numbers, symbols })[k],
  );
  const pools = (on.length ? on : (['lowercase'] as const)).map((k) => CHARACTER_SETS[k]);
  const size = Math.max(length, pools.length);
  const chars = pools.map((p) => pick(rng, [...p]));
  const all = [...pools.join('')];
  while (chars.length < size) chars.push(pick(rng, all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = int(rng, 0, i);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join('');
}
