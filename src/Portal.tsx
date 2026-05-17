import { createElement, mount, onUnmount } from '@incremental-code/last-act';
import type { Child, Renderable } from '@incremental-code/last-act';

export interface PortalProps {
    children?: Child;
    /** CSS selector for the host element. Defaults to '#__portal_root'. */
    target?: string;
}

/**
 * Render `children` into a DOM node outside the current component tree
 * (typically `#__portal_root`, which last-router's shell sets up).
 *
 * Cleanup is tied to the placeholder span returned in-place: when that span
 * is removed from the DOM the portal's mounted children are detached too.
 * This is what "tie-cleanup-to-parent" means here — the parent that contains
 * `<Portal>` owns the placeholder, so its lifecycle drives the portal's.
 *
 * SSR-safe: returns `null` when there is no DOM. (You typically render the
 * portal contents on the client only, e.g. behind a Show gate.)
 */
export function Portal({ children, target = '#__portal_root' }: PortalProps): Renderable {
    if (typeof document === 'undefined') return null;

    let portalNode: Node | null = null;

    const attach = (placeholder: HTMLElement | null) => {
        if (!placeholder) return;

        const host = document.querySelector(target);
        if (!host) {
            console.warn(`Portal: target ${target} not found in document`);
            return;
        }

        if (children == null) return;

        portalNode = mount(children as Renderable);
        host.appendChild(portalNode);

        onUnmount(placeholder, () => {
            if (portalNode && portalNode.parentNode) {
                portalNode.parentNode.removeChild(portalNode);
            }
            portalNode = null;
        });
    };

    return createElement('span', {
        attributes: {
            ref: attach,
            style: 'display: none',
            'data-portal': '',
        },
    });
}
