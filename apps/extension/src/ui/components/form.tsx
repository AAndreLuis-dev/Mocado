import { ChevronDown } from 'lucide-react';
import {
  createContext,
  useContext,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

const COLS = {
  2: ['sm:grid-cols-2', 'grid-cols-2'],
  3: ['sm:grid-cols-3', 'grid-cols-3'],
  4: ['sm:grid-cols-4', 'grid-cols-4'],
} as const;

const SPAN = {
  1: ['', ''],
  2: ['sm:col-span-2', 'col-span-2'],
  3: ['sm:col-span-3', 'col-span-3'],
  full: ['col-span-full', 'col-span-full'],
} as const;

const Fixed = createContext(false);

export function FormGrid({
  cols = 2,
  fixed = false,
  bare = false,
  className = '',
  children,
}: {
  cols?: keyof typeof COLS;
  fixed?: boolean;
  bare?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const layout = fixed ? COLS[cols][1] : `grid-cols-1 ${COLS[cols][0]}`;
  const rules = bare ? '' : 'border-t border-l border-tinta/25';
  return (
    <Fixed.Provider value={fixed}>
      <div className={`grid ${layout} ${rules} ${className}`}>{children}</div>
    </Fixed.Provider>
  );
}

export function Band({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="col-span-full flex min-h-9 items-center justify-between gap-3 border-r border-b border-tinta/25 bg-pauta px-3 py-1">
      <h2 className="text-[13px] font-bold">{children}</h2>
      {aside}
    </div>
  );
}

export function Box({
  label,
  htmlFor,
  span = 1,
  dense = false,
  className = '',
  children,
}: {
  label?: ReactNode;
  htmlFor?: string;
  span?: keyof typeof SPAN;
  dense?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const fixed = useContext(Fixed);
  return (
    <div
      className={`flex min-w-0 ${dense ? 'py-2' : 'min-h-16 pt-1.5 pb-2'} flex-col gap-1 border-r border-b border-tinta/25 px-3 transition-colors focus-within:bg-caneta-claro/60 ${SPAN[span][fixed ? 1 : 0]} ${className}`}
    >
      {label && (
        <label htmlFor={htmlFor} className="text-[11.5px] leading-tight text-grafite">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

export const pen = 'font-semibold text-caneta';

export function PenInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-transparent text-[15px] outline-none placeholder:font-normal placeholder:text-grafite/60 ${pen} ${className}`}
      {...props}
    />
  );
}

export function PenSelect({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`relative flex ${className}`}>
      <select
        className={`w-full cursor-pointer appearance-none bg-transparent pr-6 text-[15px] outline-none ${pen}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-grafite"
      />
    </span>
  );
}

export function PenTextarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full resize-y bg-transparent bg-[linear-gradient(transparent_calc(1.75rem-1px),var(--pauta)_calc(1.75rem-1px))] bg-[length:100%_1.75rem] font-mono text-[14px] leading-7 outline-none placeholder:font-normal placeholder:text-grafite/60 ${pen} ${className}`}
      {...props}
    />
  );
}

const PEN_X = 'M4 4.6 13.9 13.5M13.6 4.1 4.5 13.8';

export function PenCheck({
  label,
  hint,
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode; hint?: ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 ${className}`}>
      <span className="relative mt-0.5 grid size-[18px] shrink-0">
        <input
          type="checkbox"
          className="peer size-full cursor-pointer appearance-none rounded-[2px] border-[1.5px] border-tinta/60 bg-ficha"
          {...props}
        />
        <svg
          viewBox="0 0 18 18"
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden text-caneta peer-checked:block"
        >
          <path
            d={PEN_X}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col">
        <span className="text-[15px]">{label}</span>
        {hint && <span className="text-xs text-grafite">{hint}</span>}
      </span>
    </label>
  );
}

export function PenRadio({
  label,
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 has-checked:font-semibold has-checked:text-caneta ${className}`}
    >
      <span className="relative grid size-[18px] shrink-0">
        <input
          type="radio"
          className="peer size-full cursor-pointer appearance-none rounded-full border-[1.5px] border-tinta/60 bg-ficha"
          {...props}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[4px] hidden rounded-full bg-caneta peer-checked:block"
        />
      </span>
      <span className="text-[15px]">{label}</span>
    </label>
  );
}

export function ValueBox({
  label,
  value,
  span,
  action,
}: {
  label: string;
  value: string;
  span?: keyof typeof SPAN;
  action?: ReactNode;
}) {
  return (
    <Box label={label} span={span}>
      <span className="flex items-center gap-1">
        <span
          className={`min-w-0 flex-1 truncate font-mono text-[13px] tracking-tight tabular-nums ${pen}`}
          title={value}
        >
          {value}
        </span>
        {action}
      </span>
    </Box>
  );
}

export const LONG_FIELDS = new Set<string>([
  'nome',
  'mae',
  'pai',
  'email',
  'logradouro',
  'complemento',
  'razaoSocial',
  'nomeFantasia',
  'cartaoNome',
  'certidao',
  'texto',
]);
