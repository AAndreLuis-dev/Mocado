import { defaultRng, int, pick, type Rng } from './rng';

const WORDS =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(
    ' ',
  );

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

export function lorem({
  paragrafos = 1,
  palavras,
  rng = defaultRng,
}: { paragrafos?: number; palavras?: number; rng?: Rng } = {}): string {
  if (palavras)
    return cap(Array.from({ length: palavras }, () => pick(rng, WORDS)).join(' ')) + '.';
  const sentence = () =>
    cap(Array.from({ length: int(rng, 6, 14) }, () => pick(rng, WORDS)).join(' ')) + '.';
  const paragraph = () => Array.from({ length: int(rng, 3, 6) }, sentence).join(' ');
  return Array.from({ length: paragrafos }, paragraph).join('\n\n');
}

export const numero = ({
  min = 0,
  max = 1000,
  rng = defaultRng,
}: { min?: number; max?: number; rng?: Rng } = {}) => int(rng, min, max);

export function uuid({ rng = defaultRng }: { rng?: Rng } = {}): string {
  const h = Array.from({ length: 32 }, () => int(rng, 0, 15).toString(16));
  h[12] = '4';
  h[16] = ((int(rng, 0, 15) & 0x3) | 0x8).toString(16);
  const s = h.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
