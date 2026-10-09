import icon from '@/assets/icon.svg';

export function Logo({ size = 24 }: { size?: number }) {
  return <img src={icon} alt="" width={size} height={size} className="shrink-0" />;
}

export const KIND_COLOR = {
  pessoa: 'text-caneta',
  empresa: 'text-carimbo',
  avulso: 'text-grafite',
} as const;
