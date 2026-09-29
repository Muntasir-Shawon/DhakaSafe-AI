import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '../../lib/cx';

interface DisclosureProps {
  /** The short, always-visible summary, e.g. "Why this route?" */
  summary: ReactNode;
  /** Optional second line, always visible even when collapsed. */
  detail?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Progressive disclosure. The most important thing is visible; supporting
 * detail stays one tap away.
 */
export function Disclosure({
  summary,
  detail,
  children,
  defaultOpen = false,
  className,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `${id}-panel`;

  return (
    <div className={cx('rounded-control border border-line bg-surface-2/40', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left rounded-control transition-colors hover:bg-surface-2/70"
      >
        <span className="min-w-0 space-y-0.5">
          <span className="block text-body font-medium text-ink">{summary}</span>
          {detail ? <span className="block text-meta text-ink-2">{detail}</span> : null}
        </span>
        <ChevronDown
          className={cx(
            'h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 ease-standard',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="border-t border-line px-3.5 py-3 animate-fade-in"
      >
        {children}
      </div>
    </div>
  );
}
