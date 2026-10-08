import { Check, ChevronDown, Copy } from 'lucide-react';
import {
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
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

/** Square icon-only button; `label` is its accessible name and tooltip. */
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

/** Copy button with short "Copiado!" feedback; `text` is the visible label (default "Copiar"). */
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

/** Icon-only copy for list rows: "Copiar CPF". */
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

/** Native checkbox drawn as a switch (keeps checkbox semantics for forms and tests). */
export function Switch({
  label,
  hint,
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode; hint?: ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-start justify-between gap-4 ${className}`}>
      <span className="flex flex-col gap-0.5">
        <span>{label}</span>
        {hint && <span className="text-xs text-grafite">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-linha transition-colors before:absolute before:top-0.5 before:left-0.5 before:size-4 before:rounded-full before:bg-ficha before:shadow-sm before:transition-transform checked:bg-caneta checked:before:translate-x-4"
        {...props}
      />
    </label>
  );
}

/** Native select with the app's look and a chevron. */
export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <select
        className="h-8 w-full cursor-pointer appearance-none rounded-md border border-linha bg-ficha pr-7 pl-2.5 text-sm text-tinta hover:border-grafite/60"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-grafite"
      />
    </span>
  );
}

export const inputClass =
  'h-8 rounded-md border border-linha bg-ficha px-2.5 text-sm text-tinta placeholder:text-grafite/80 hover:border-grafite/60';

/** "Ctrl+Shift+F" as keycaps. */
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
