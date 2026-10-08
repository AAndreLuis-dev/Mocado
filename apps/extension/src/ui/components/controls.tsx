import { Check, Copy } from 'lucide-react';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { t } from '../../infra/browser/i18n';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-caneta text-sobre-caneta hover:bg-caneta-forte shadow-sm',
  secondary: 'border border-linha bg-ficha text-tinta hover:border-grafite/60 hover:bg-papel',
  ghost: 'text-grafite hover:bg-pauta hover:text-tinta',
  danger: 'border border-erro bg-erro-claro text-erro',
};

export function Button({
  variant = 'secondary',
  icon,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md text-grafite transition-colors hover:bg-pauta hover:text-tinta ${className}`}
      {...props}
    />
  );
}

function useCopy(value: string) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = async () => {
    const ok = await navigator.clipboard.writeText(value).then(
      () => true,
      () => false,
    );
    setState(ok ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), 1200);
  };
  return { state, copy };
}

export function CopyButton({
  value,
  text = t('popup.copy'),
  variant = 'secondary',
}: {
  value: string;
  text?: string;
  variant?: Variant;
}) {
  const { state, copy } = useCopy(value);
  return (
    <Button
      variant={variant}
      onClick={copy}
      icon={state === 'copied' ? <Check size={15} /> : <Copy size={15} />}
    >
      {state === 'copied' ? t('popup.copied') : state === 'failed' ? t('popup.copyFailed') : text}
    </Button>
  );
}

export function CopyIconButton({ value, label }: { value: string; label: string }) {
  const { state, copy } = useCopy(value);
  return (
    <IconButton
      label={`${t('popup.copy')} ${label}`}
      onClick={copy}
      className={state === 'copied' ? 'text-caneta' : ''}
    >
      {state === 'copied' ? <Check size={15} /> : <Copy size={15} />}
    </IconButton>
  );
}

export function Kbd({ keys, className = '' }: { keys: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {keys.split('+').map((k, i) => (
        <kbd
          key={i}
          className="rounded border border-current/30 px-1 font-mono text-[11px] leading-4 font-medium"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
