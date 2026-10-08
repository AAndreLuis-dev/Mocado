import type { FieldType } from '@mocado/core';
import { semAcento } from '../../domain/text';
import { AUTOCOMPLETE, IGNORE_WORDS, SYNONYMS, WEAK_WORDS } from './synonyms';

/** Everything the classifier looks at, already extracted from the DOM (keeps this pure/testable). */
export interface Signals {
  tag: 'input' | 'select' | 'textarea';
  type?: string;
  autocomplete?: string;
  name?: string;
  id?: string;
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  title?: string;
  nearby?: string;
  maxLength?: number;
  pattern?: string;
}

export interface Classification {
  type: FieldType;
  score: number;
  /** Expected format from maxlength/pattern/placeholder; undefined = no hint (use default). */
  masked?: boolean;
}

/** "dtNasc_cliente" → "dt nasc cliente"; "E-mail" → "e mail"; accents removed. */
export function normalize(s = ''): string {
  return semAcento(s)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)|(\d)([a-zA-Z])/g, '$1$3 $2$4')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const SOURCES: [keyof Signals, number][] = [
  ['label', 45],
  ['ariaLabel', 45],
  ['name', 40],
  ['id', 40],
  ['placeholder', 30],
  ['title', 20],
  ['nearby', 15],
];

const MIN_SCORE = 12;

const ENTRIES = Object.entries(SYNONYMS) as [FieldType, string[]][];

/** Best phrase match of each type inside one normalized text. */
function matches(text: string): Map<FieldType, number> {
  const padded = ` ${text} `;
  const out = new Map<FieldType, number>();
  for (const [type, words] of ENTRIES) {
    let best = 0;
    for (const w of words) {
      if (!padded.includes(` ${w} `)) continue;
      const tokens = w.split(' ').length;
      const strength = (1 + 0.6 * (tokens - 1)) * (tokens === 1 && WEAK_WORDS.has(w) ? 0.5 : 1);
      best = Math.max(best, strength);
    }
    if (best) out.set(type, best);
  }
  return out;
}

/** Per-type sample values [masked, unmasked] to test `pattern` attributes against. */
const SAMPLES: Partial<Record<FieldType, [string, string]>> = {
  cpf: ['123.456.789-09', '12345678909'],
  cnpj: ['11.222.333/0001-81', '11222333000181'],
  cep: ['01310-100', '01310100'],
  telefone: ['(11) 3333-4444', '1133334444'],
  celular: ['(11) 98888-7777', '11988887777'],
  pis: ['120.12345.67-8', '12012345678'],
  titulo: ['0043 5687 0906', '004356870906'],
  rg: ['24.678.131-2', '246781312'],
  cartaoNumero: ['4111 1111 1111 1111', '4111111111111111'],
  placa: ['ABC-1234', 'ABC1234'],
  certidao: ['104539 01 55 2013 1 00012 021 0000123 11', '10453901552013100012021000012311'],
};

const LENGTHS: Partial<Record<FieldType, [unmasked: number[], masked: number[]]>> = {
  cpf: [[11], [14]],
  cnpj: [[14], [18]],
  cep: [[8], [9, 10]],
  telefone: [
    [10, 11],
    [13, 14],
  ],
  celular: [[11], [15, 16]],
  pis: [[11], [14]],
  titulo: [[12], [14]],
  rg: [[9], [12]],
  cartaoNumero: [[16], [19]],
  placa: [[7], [8]],
  certidao: [[32], [40]],
};

export function expectedMask(type: FieldType, s: Signals): boolean | undefined {
  if (s.type === 'number') return false;
  const sample = SAMPLES[type];
  if (s.pattern && sample) {
    try {
      const re = new RegExp(`^(?:${s.pattern})$`);
      const [m, u] = sample.map((v) => re.test(v));
      if (m !== u) return !!m;
    } catch {
      /* invalid pattern: ignore */
    }
  }
  const lengths = LENGTHS[type];
  if (lengths && s.maxLength && s.maxLength > 0) {
    if (lengths[0].includes(s.maxLength)) return false;
    if (lengths[1].includes(s.maxLength)) return true;
  }
  const ph = s.placeholder ?? '';
  if (/[\d_X9]/.test(ph) && /^[\d_X9().\-/\s]+$/.test(ph)) return /[().\-/\s]/.test(ph.trim());
  return undefined;
}

export function classify(s: Signals): Classification | null {
  const all = normalize([s.name, s.id, s.label, s.ariaLabel, s.placeholder].join(' '));
  if (s.type === 'search' || IGNORE_WORDS.some((w) => ` ${all} `.includes(` ${w} `))) return null;

  const scores = new Map<FieldType, number>();
  const add = (t: FieldType, n: number) => scores.set(t, (scores.get(t) ?? 0) + n);

  for (const token of (s.autocomplete ?? '').toLowerCase().split(/\s+/)) {
    const t = AUTOCOMPLETE[token];
    if (t) add(t, 100);
  }
  for (const [key, weight] of SOURCES) {
    const text = normalize(String(s[key] ?? ''));
    if (text) for (const [t, strength] of matches(text)) add(t, weight * strength);
  }

  switch (s.type) {
    case 'email':
      add('email', 60);
      break;
    case 'tel':
      add('celular', 15);
      add('telefone', 10);
      break;
    case 'date':
      add('nascimento', 15);
      add('dataAbertura', 8);
      break;
    case 'month':
      add('cartaoValidade', 30);
      break;
    case 'password':
      add('senha', 60);
      break;
  }
  if (s.tag === 'textarea') add('texto', 20);

  let best: FieldType | null = null;
  let score = 0;
  for (const [t, n] of scores) if (n > score) [best, score] = [t, n];
  if (!best || score < MIN_SCORE) return null;

  // A date input can only hold dates.
  if (s.type === 'date' && !['nascimento', 'dataAbertura'].includes(best)) best = 'nascimento';
  return { type: best, score, masked: expectedMask(best, s) };
}
