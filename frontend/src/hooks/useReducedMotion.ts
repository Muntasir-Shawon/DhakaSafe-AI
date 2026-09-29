import { useEffect, useState } from 'react';

function subscribe(onChange: (reduced: boolean) => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = () => onChange(media.matches);
  handler();
  if (media.addEventListener) {
    media.addEventListener('change', handler);
  } else {
    media.addListener(handler);
  }
  return () => {
    if (media.removeEventListener) {
      media.removeEventListener('change', handler);
    } else {
      media.removeListener(handler);
    }
  };
}

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => subscribe(setPrefersReduced), []);

  return prefersReduced;
}
