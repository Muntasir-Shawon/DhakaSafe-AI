import { useEffect, useState } from 'react';

function subscribe(query: string, onChange: (matches: boolean) => void) {
  const media = window.matchMedia(query);
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

export function useMediaQuery(query: string): boolean {
  // Initialised unconditionally: server and client agree on false, and the
  // subscription corrects it before paint.
  const [matches, setMatches] = useState(false);

  useEffect(() => subscribe(query, setMatches), [query]);

  return matches;
}
