import { useId, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

type Variant = 'default' | 'primary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700',
  primary: 'bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white font-semibold',
  ghost: 'bg-transparent hover:bg-white/10 text-zinc-200',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export function Button({ variant = 'default', size = 'md', active, className = '', type = 'button', ...rest }: BtnProps) {
  const sizes = { sm: 'h-8 px-2.5 text-xs gap-1.5', md: 'h-9 px-3 text-sm gap-2', lg: 'h-11 px-5 text-base gap-2' };
  return (
    <button
      type={type}
      {...rest}
      className={`inline-flex items-center justify-center rounded-lg transition-colors select-none whitespace-nowrap
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400
        disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${VARIANTS[variant]}
        ${active ? 'ring-1 ring-sky-400 !bg-sky-500/20' : ''} ${className}`}
    />
  );
}

export function IconButton({ label, className = '', ...rest }: BtnProps & { label: string }) {
  return <Button {...rest} aria-label={label} title={label} className={`!px-0 w-9 ${className}`} />;
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 mb-1 text-xs font-medium text-zinc-300">
        <span>{label}</span>
        {hint && <span className="text-zinc-500 font-normal tabular-nums">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: ReactNode;
  disabled?: boolean;
  onChange: (v: number) => void;
}

export function Slider({ label, value, min, max, step = 1, unit = '', hint, disabled, onChange }: SliderProps) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <label htmlFor={id} className="text-xs font-medium text-zinc-300">
          {label}
        </label>
        {hint && <span className="text-[11px] text-zinc-500 tabular-nums">{hint}</span>}
      </div>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-sky-400 h-1.5 cursor-pointer"
        />
        <span className="flex items-center rounded-md bg-zinc-900 border border-zinc-700 pr-1.5 focus-within:border-sky-400">
          <input
            type="number"
            aria-label={`${label} value`}
            min={min}
            max={max}
            step={step}
            value={Number.isFinite(value) ? value : ''}
            disabled={disabled}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
            }}
            className="w-14 bg-transparent text-right text-xs py-1 pl-1.5 outline-none tabular-nums"
          />
          {unit && <span className="text-[10px] text-zinc-500 ml-0.5">{unit}</span>}
        </span>
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-3 cursor-pointer ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <span>
        <span className="block text-xs font-medium text-zinc-300">{label}</span>
        {hint && <span className="block text-[11px] text-zinc-500">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-5 w-9 shrink-0 rounded-full bg-zinc-700 transition-colors peer-checked:bg-sky-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-sky-400
          after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}

export function Banner({
  tone = 'info',
  children,
  action,
}: {
  tone?: 'info' | 'warn' | 'error';
  children: ReactNode;
  action?: ReactNode;
}) {
  const tones = {
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
    error: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
  };
  return (
    <div role={tone === 'info' ? 'status' : 'alert'} className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={`w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-sky-400 disabled:opacity-40 ${className}`}
    />
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex w-full rounded-lg bg-zinc-900 border border-zinc-700 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1 text-xs transition-colors ${
            value === o.value ? 'bg-sky-500 text-zinc-950 font-semibold' : 'text-zinc-300 hover:bg-white/10'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] justify-center rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-[11px] font-mono text-zinc-200">
      {children}
    </kbd>
  );
}
