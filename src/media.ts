import { signal } from '@incremental-code/last-act';
import type { ReadSignal } from '@incremental-code/last-act';

/**
 * Returns a signal that tracks whether the media query currently matches.
 * SSR-safe: returns a signal of `false` when window is undefined.
 * The listener lives until process exit (no cleanup) — fine for app-wide
 * usage like responsive breakpoints. If you need bounded lifecycle, wrap
 * with effect/onUnmount in the consumer.
 */
export function matchMedia(query: string): ReadSignal<boolean> {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return signal(false);
    }

    const mql = window.matchMedia(query);
    const state = signal<boolean>(mql.matches);
    const handler = (event: MediaQueryListEvent) => state.set(event.matches);

    // `addEventListener` is the modern API; fall back to `addListener` for older browsers.
    if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handler);
    } else if (typeof (mql as unknown as { addListener?: (cb: (e: MediaQueryListEvent) => void) => void }).addListener === 'function') {
        (mql as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }).addListener(handler);
    }

    return state;
}
