import { type ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Rendered in the sticky footer, e.g. the primary action. */
  footer?: ReactNode;
  /** 0–1 progress line under the header; omit for no indicator. */
  progress?: number | null;
}

/**
 * The mobile counterpart to Modal. Anchored to the bottom of the viewport with
 * a safe-area inset so the home indicator never covers the primary action.
 */
export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  progress = null,
}: SheetProps) {
  const ref = useFocusTrap<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[880] flex flex-col justify-end animate-fade-in" role="presentation">
      <button
        type="button"
        aria-label="Close panel"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-canvas/75 backdrop-blur-[2px] cursor-default"
      />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-h-[86dvh] flex flex-col bg-surface border-t border-line-strong rounded-t-panel shadow-sheet animate-sheet-in pb-[env(safe-area-inset-bottom)]"
      >
        <div className="shrink-0 pt-2 pb-1 flex justify-center" aria-hidden="true">
          <div className="h-1 w-9 rounded-full bg-line-strong" />
        </div>

        <header className="shrink-0 px-4 pb-3 space-y-0.5">
          <h2 className="text-section font-semibold text-ink tracking-tight">{title}</h2>
          {description ? <p className="text-meta text-ink-2">{description}</p> : null}
          {progress !== null && (
            <div
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Loading"
              className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-3"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-standard"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>

        {footer ? (
          <footer className="shrink-0 border-t border-line bg-surface-2/40 px-4 py-3">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}
