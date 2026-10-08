import type { ReactNode } from 'react';
import { CopyIconButton } from './controls';

/** A form slip: white card with a perforated top edge. */
export function Ficha({
  children,
  className = '',
  perforated = true,
  ...props
}: {
  children: ReactNode;
  className?: string;
  /** The torn-off edge marks generated data; plain panels (settings) go without. */
  perforated?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative rounded-lg border border-linha bg-ficha shadow-[0_1px_0_var(--linha)] ${className}`}
      {...props}
    >
      {perforated && <div aria-hidden className="picote h-1.5 rounded-t-lg" />}
      {children}
    </div>
  );
}

/** Rubber stamp ("FICTÍCIO", "FIXADO"). `replay` changes → the stamp hits the paper again. */
export function Stamp({
  children,
  replay,
  className = '',
  decorative = false,
}: {
  children: ReactNode;
  replay?: unknown;
  className?: string;
  /** Decorative stamps repeat something said elsewhere: hidden from screen readers. */
  decorative?: boolean;
}) {
  return (
    <span
      key={String(replay)}
      aria-hidden={decorative || undefined}
      className={`carimbo ${replay !== undefined ? 'carimbo-bate' : ''} ${className}`}
    >
      {children}
    </span>
  );
}

/** Ruled list of label/value rows, each copyable (generated profiles, history details). */
export function FieldList({
  entries,
  labelOf,
  className = '',
}: {
  entries: [string, string][];
  labelOf: (key: string) => string;
  className?: string;
}) {
  return (
    <dl className={`divide-y divide-pauta ${className}`}>
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2 py-1.5">
          <div className="min-w-0 flex-1">
            <dt className="text-[11px] text-grafite">{labelOf(k)}</dt>
            <dd className="truncate font-mono text-[13px] tabular-nums" title={v}>
              {v}
            </dd>
          </div>
          <CopyIconButton value={v} label={labelOf(k)} />
        </div>
      ))}
    </dl>
  );
}

/** The Mocado mark (same drawing as the extension icon). */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden className="shrink-0">
      <rect width="128" height="128" rx="28" fill="#2448c8" />
      <path
        d="M30 94V36l34 38 34-38v58"
        fill="none"
        stroke="#fff"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="100" r="13" fill="#e7b6f2" stroke="#2448c8" strokeWidth="4" />
    </svg>
  );
}

/** File-tab color per profile kind: person in pen blue, company in stamp violet. */
export const TIPO_BG = {
  pessoa: 'bg-caneta text-sobre-caneta',
  empresa: 'bg-carimbo text-ficha',
  avulso: 'bg-grafite text-ficha',
} as const;
