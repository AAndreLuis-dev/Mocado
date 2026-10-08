import icon from '@/assets/icon.svg';
import type { ReactNode } from 'react';

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

export function Logo({ size = 24 }: { size?: number }) {
  return <img src={icon} alt="" width={size} height={size} className="shrink-0" />;
}

/** File-tab color per profile kind: person in pen blue, company in stamp violet. */
export const TIPO_BG = {
  pessoa: 'bg-caneta text-sobre-caneta',
  empresa: 'bg-carimbo text-ficha',
  avulso: 'bg-grafite text-ficha',
} as const;
