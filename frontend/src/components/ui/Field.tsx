import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '../../lib/cx';

interface FieldProps {
  label: string;
  hint?: string;
  /** Renders the label for sighted users only; `hint` carries the meaning. */
  children: (id: string, describedBy?: string) => ReactNode;
  className?: string;
}

/**
 * Label + control + hint, wired together. Guarantees every control in the app
 * has a real `<label>` and that focus styling is never suppressed.
 */
export function Field({ label, hint, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cx('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-meta font-medium text-ink-2">
        {label}
      </label>
      {children(id, hintId)}
      {hint ? (
        <p id={hintId} className="text-meta text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const selectClasses =
  'w-full h-10 appearance-none bg-surface-2 border border-line rounded-control pl-3 pr-8 text-body text-ink cursor-pointer transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:border-accent disabled:opacity-50';

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cx(selectClasses, className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
        aria-hidden="true"
      />
    </div>
  );
}
