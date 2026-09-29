import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cx } from '../../lib/cx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * A real dialog: `role="dialog"`, `aria-modal`, a labelled title, focus moved
 * in on open, focus trapped while open, Escape to dismiss, and focus returned
 * to the trigger on close.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  className,
}: ModalProps) {
  const ref = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center p-4 animate-fade-in"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-canvas/85 backdrop-blur-sm cursor-default"
      />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative w-full max-w-lg bg-surface border border-line-strong rounded-panel shadow-lift max-h-[90dvh] flex flex-col animate-rise',
          className,
        )}
      >
        <header className="flex items-start gap-3 p-5 pb-4 border-b border-line">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-2 border border-line text-accent">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-section font-semibold text-ink tracking-tight">{title}</h2>
            {description ? <p className="text-meta text-ink-2">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 -mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-control text-ink-3 transition-colors hover:text-ink hover:bg-surface-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div ref={bodyRef} className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {footer ? (
          <footer className="flex items-center justify-end gap-2 p-4 border-t border-line bg-surface-2/40">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
