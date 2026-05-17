import {
    computePosition,
    autoUpdate,
    offset as offsetMiddleware,
    flip,
    shift,
} from '@floating-ui/dom';

export type FloatingPlacement =
    | 'top' | 'bottom' | 'left' | 'right'
    | 'top-start' | 'top-end'
    | 'bottom-start' | 'bottom-end';

export interface FloatingOptions {
    placement?: FloatingPlacement;
    /** px between anchor and floater. Defaults to 8. */
    offset?: number;
}

/**
 * Position `floater` relative to `anchor` and keep it positioned on scroll /
 * resize / layout changes. Returns a cleanup function that stops the
 * auto-updater. Sets the required CSS (position: fixed, top: 0, left: 0,
 * transform) on the floater so transform-based positioning works regardless
 * of the floater's containing block.
 */
export function attachFloating(
    anchor: HTMLElement,
    floater: HTMLElement,
    opts: FloatingOptions = {},
): () => void {
    const placement: FloatingPlacement = opts.placement ?? 'bottom';
    const gap = opts.offset ?? 8;

    floater.style.position = 'fixed';
    floater.style.top = '0';
    floater.style.left = '0';
    // Avoid flicker on first frame before computePosition resolves.
    floater.style.transform = 'translate(0, 0)';

    return autoUpdate(anchor, floater, () => {
        computePosition(anchor, floater, {
            placement,
            middleware: [offsetMiddleware(gap), flip(), shift({ padding: 8 })],
        }).then(({ x, y }) => {
            floater.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
        });
    });
}
