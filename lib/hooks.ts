'use client';

import { useEffect, useLayoutEffect } from 'react';

/** useLayoutEffect that degrades to useEffect on the server (no SSR warning). */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Subscribe to a media query and invoke `onChange` with the current match,
 * both immediately and on every change. Returns a cleanup function via useEffect.
 */
export function useMediaQuery(
  query: string,
  onChange: (matches: boolean) => void,
): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent | MediaQueryList) =>
      onChange(event.matches);

    handler(mql);
    // Safari < 14 only supports the deprecated addListener signature.
    if (mql.addEventListener) {
      mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
      return () =>
        mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
    }
    mql.addListener(handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeListener(handler as (e: MediaQueryListEvent) => void);
  }, [query, onChange]);
}
