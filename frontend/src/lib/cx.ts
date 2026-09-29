import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Joins class names and lets later Tailwind utilities win conflicts, so a
 * component's `className` prop can override its own defaults.
 *
 * `tailwind-merge` only knows the utilities it ships with. The design system
 * adds its own type scale in `@theme` (`--text-meta`, `--text-body`,
 * `--text-section`, `--text-stat`, `--text-display`), and without registering
 * them they look like unknown `text-*` colours — so `text-accent-ink` followed
 * by a size class resolved to a *colour* conflict and the intended text colour
 * was dropped, leaving primary buttons at roughly 2.1:1 contrast. Telling the
 * merge about the custom sizes keeps colours and sizes in separate groups.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['meta', 'body', 'section', 'stat', 'display'] }],
    },
  },
});

export function cx(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
