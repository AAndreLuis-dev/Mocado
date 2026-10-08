import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { t } from '../infra/browser/i18n';

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const base =
    'rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50';
  const look =
    variant === 'primary'
      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
      : 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700';
  return <button type="button" className={`${base} ${look} ${className}`} {...props} />;
}

/** Copy button with short "copied" feedback. */
export function CopyButton({
  value,
  label,
  text = t('popup.copy'),
}: {
  value: string;
  /** What is copied, for screen readers ("Copiar CPF"). */
  label?: ReactNode;
  /** Visible text; defaults to "Copiar". */
  text?: string;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  return (
    <Button
      aria-label={
        label ? `${t('popup.copy')} ${typeof label === 'string' ? label : ''}`.trim() : undefined
      }
      onClick={async () => {
        const ok = await navigator.clipboard.writeText(value).then(
          () => true,
          () => false,
        );
        setState(ok ? 'copied' : 'failed');
        setTimeout(() => setState('idle'), 1200);
      }}
    >
      {state === 'copied' ? t('popup.copied') : state === 'failed' ? t('popup.copyFailed') : text}
    </Button>
  );
}

export const selectClass =
  'rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800';
