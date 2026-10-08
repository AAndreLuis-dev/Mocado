import icon from '@/assets/icon.svg';
import type { ReactNode } from 'react';

export function Stamp({
  children,
  replay,
  className = '',
  decorative = false,
}: {
  children: ReactNode;
  replay?: unknown;
  className?: string;
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

export const KIND_BADGE = {
  pessoa: 'bg-caneta text-sobre-caneta',
  empresa: 'bg-carimbo text-ficha',
  avulso: 'bg-grafite text-ficha',
} as const;
