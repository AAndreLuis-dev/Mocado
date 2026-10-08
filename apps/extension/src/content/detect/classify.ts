import type { FieldType } from '@mocado/core';
import { stripAccents } from '../../domain/text';
import { AUTOCOMPLETE, IGNORE_WORDS, SYNONYMS, WEAK_WORDS } from './synonyms';

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
  masked?: boolean;
}

export function normalize(s = ''): string {
  return stripAccents(s)
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

function compilePattern(pattern: string): RegExp | null {
  try {
    return new RegExp(`^(?:${pattern})$`);
  } catch {
    return null;
  }
}

export function expectedMask(type: FieldType, signals: Signals): boolean | undefined {
  if (signals.type === 'number') return false;
  const sample = SAMPLES[type];
  const re = signals.pattern && sample ? compilePattern(signals.pattern) : null;
  if (re && sample) {
    const [maskedMatches, plainMatches] = sample.map((example) => re.test(example));
    if (maskedMatches !== plainMatches) return !!maskedMatches;
  }
  const lengths = LENGTHS[type];
  if (lengths && signals.maxLength && signals.maxLength > 0) {
    if (lengths[0].includes(signals.maxLength)) return false;
    if (lengths[1].includes(signals.maxLength)) return true;
  }
  const placeholder = signals.placeholder ?? '';
  if (/[\d_X9]/.test(placeholder) && /^[\d_X9().\-/\s]+$/.test(placeholder))
    return /[().\-/\s]/.test(placeholder.trim());
  return undefined;
}

export function classify(signals: Signals): Classification | null {
  const all = normalize(
    [signals.name, signals.id, signals.label, signals.ariaLabel, signals.placeholder].join(' '),
  );
  if (signals.type === 'search' || IGNORE_WORDS.some((word) => ` ${all} `.includes(` ${word} `)))
    return null;

  const scores = new Map<FieldType, number>();
  const add = (type: FieldType, points: number) =>
    scores.set(type, (scores.get(type) ?? 0) + points);

  for (const token of (signals.autocomplete ?? '').toLowerCase().split(/\s+/)) {
    const type = AUTOCOMPLETE[token];
    if (type) add(type, 100);
  }
  for (const [key, weight] of SOURCES) {
    const text = normalize(String(signals[key] ?? ''));
    if (text) for (const [type, strength] of matches(text)) add(type, weight * strength);
  }

  switch (signals.type) {
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
  if (signals.tag === 'textarea') add('texto', 20);

  let best: FieldType | null = null;
  let score = 0;
  for (const [type, points] of scores) if (points > score) [best, score] = [type, points];
  if (!best || score < MIN_SCORE) return null;

  if (signals.type === 'date' && !['nascimento', 'dataAbertura'].includes(best))
    best = 'nascimento';
  return { type: best, score, masked: expectedMask(best, signals) };
}
