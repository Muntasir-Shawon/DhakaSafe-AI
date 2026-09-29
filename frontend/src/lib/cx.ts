import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and lets later Tailwind utilities win conflicts, so a
 * component's `className` prop can override its own defaults.
 */
export function cx(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
