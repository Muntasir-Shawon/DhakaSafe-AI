import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Moves focus into a container on open, keeps Tab cycling inside it, closes on
 * Escape, and returns focus to whatever was focused beforehand.
 *
 * The effect depends only on `isActive`; the escape handler is read through a
 * ref so that an inline arrow function does not re-run the trap every render and
 * yank focus away from whatever the user is currently interacting with.
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean, onEscape?: () => void) {
  const containerRef = useRef<T | null>(null);
  const escapeRef = useRef(onEscape);

  useEffect(() => {
    escapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isActive) return;
    const container = containerRef.current;
    if (!container) return;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null,
      );

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // The container itself is a fallback target when it holds nothing focusable.
    if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
    const first = getFocusable()[0];

    const focusTimer = window.setTimeout(() => {
      (first ?? container).focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        escapeRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const newFirst = focusable[0];
      const newLast = focusable[focusable.length - 1];

      if (e.shiftKey && (document.activeElement === newFirst || !container.contains(document.activeElement))) {
        e.preventDefault();
        newLast.focus();
      } else if (!e.shiftKey && document.activeElement === newLast) {
        e.preventDefault();
        newFirst.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      if (container.hasAttribute('tabindex')) container.removeAttribute('tabindex');
      previouslyFocused?.focus?.();
    };
  }, [isActive]);

  return containerRef;
}
