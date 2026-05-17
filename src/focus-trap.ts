/**
 * Tabbable selector. Excludes hidden / disabled / tabindex="-1" elements.
 * Note: this is a structural selector — we additionally filter via
 * `isVisible()` below to avoid trapping focus on display:none nodes.
 */
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface TrapFocusOptions {
    /** Element (or factory) to focus on activate. Defaults to first focusable in `container`. */
    initialFocus?: HTMLElement | (() => HTMLElement | null);
    /** Element to focus on release. Defaults to whatever was active when `trapFocus` was called. */
    restoreFocus?: HTMLElement | null;
}

/**
 * Constrain Tab / Shift+Tab to focusable descendants of `container`. Returns
 * a release function — calling it more than once is a no-op.
 *
 * Edge cases handled:
 *   - No focusable descendants: Tab is prevented entirely; focus stays on container.
 *   - Single focusable descendant: Tab and Shift+Tab both keep focus on it.
 *   - Focus currently outside container: Tab wraps in based on direction.
 *   - SSR / non-browser env: no-op release.
 */
export function trapFocus(container: HTMLElement, options: TrapFocusOptions = {}): () => void {
    if (typeof document === 'undefined' || !container) {
        return () => {};
    }

    const previouslyFocused =
        options.restoreFocus !== undefined
            ? options.restoreFocus
            : (document.activeElement as HTMLElement | null);

    // Make sure the container itself can hold focus when nothing inside is focusable.
    const hadTabIndex = container.hasAttribute('tabindex');
    if (!hadTabIndex) container.setAttribute('tabindex', '-1');

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;
        const focusables = getFocusable(container);

        if (focusables.length === 0) {
            event.preventDefault();
            container.focus();
            return;
        }

        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        const active = document.activeElement as HTMLElement | null;
        const insideContainer = !!active && container.contains(active);

        if (event.shiftKey) {
            if (!insideContainer || active === first) {
                event.preventDefault();
                last.focus();
            }
        } else {
            if (!insideContainer || active === last) {
                event.preventDefault();
                first.focus();
            }
        }
    };

    container.addEventListener('keydown', handleKeydown);

    // Initial focus.
    const initial = resolveInitial(container, options.initialFocus);
    if (initial) {
        // Defer to next tick so we don't race with the caller still mounting nodes.
        queueMicrotask(() => {
            try { initial.focus(); } catch { /* ignore */ }
        });
    }

    let released = false;
    return function release() {
        if (released) return;
        released = true;
        container.removeEventListener('keydown', handleKeydown);
        if (!hadTabIndex) container.removeAttribute('tabindex');
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            try { previouslyFocused.focus(); } catch { /* ignore */ }
        }
    };
}

function resolveInitial(
    container: HTMLElement,
    initialFocus: TrapFocusOptions['initialFocus'],
): HTMLElement | null {
    if (typeof initialFocus === 'function') return initialFocus();
    if (initialFocus) return initialFocus;
    const focusables = getFocusable(container);
    return focusables[0] ?? container;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
    const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const out: HTMLElement[] = [];
    nodes.forEach(node => {
        if (isVisible(node)) out.push(node);
    });
    return out;
}

function isVisible(el: HTMLElement): boolean {
    if (el.hidden) return false;
    // offsetParent is null for `display: none` (and `position: fixed` with no layout, rare).
    // Fall back to client rects to catch fixed positioned elements.
    if (el.offsetParent !== null) return true;
    const rects = el.getClientRects();
    return rects.length > 0;
}
