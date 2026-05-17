import { createElement, mount, effect, onUnmount } from '@incremental-code/last-act';
import type { Child, ReadSignal, Renderable } from '@incremental-code/last-act';
import { attachFloating } from './floating.js';
import type { FloatingOptions } from './floating.js';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface PopoverProps {
    /** Signal that opens / closes the popover. */
    open: ReadSignal<boolean>;
    /** Called when the popover wants to close (Escape, outside click). The
     *  caller is responsible for flipping `open` to false. */
    onClose?: () => void;
    /** Anchor element signal — typically wired via `attributes={{ ref: anchorEl }}`. */
    anchor: ReadSignal<HTMLElement | null>;
    placement?: FloatingOptions['placement'];
    offset?: number;
    /** Selector for the portal host. Defaults to '#__portal_root'. */
    portalTarget?: string;
    children?: Child;
}

const HOST = '__portal_root';

/**
 * Floating popover. Renders nothing in the parent tree (returns a hidden
 * placeholder span). When `open` is true the children are mounted into the
 * portal host, positioned against `anchor`, and given outside-click /
 * Escape-to-close listeners.
 */
export function Popover(props: PopoverProps): Renderable {
    if (typeof document === 'undefined') return null;

    let placeholder: HTMLElement | null = null;
    let popperEl: HTMLElement | null = null;
    let stopAutoUpdate: (() => void) | null = null;
    let onDocMousedown: ((event: MouseEvent) => void) | null = null;
    let onKeydown: ((event: KeyboardEvent) => void) | null = null;
    let stopOpenEffect: (() => void) | null = null;

    const close = () => props.onClose?.();

    const teardown = () => {
        if (stopAutoUpdate) { stopAutoUpdate(); stopAutoUpdate = null; }
        if (onDocMousedown) { window.removeEventListener('mousedown', onDocMousedown, true); onDocMousedown = null; }
        if (onKeydown) { window.removeEventListener('keydown', onKeydown, true); onKeydown = null; }
        if (popperEl && popperEl.parentNode) popperEl.parentNode.removeChild(popperEl);
        popperEl = null;
    };

    const openPopover = () => {
        const anchorEl = props.anchor.get();
        const host = document.querySelector(props.portalTarget ?? `#${HOST}`) as HTMLElement | null;
        if (!anchorEl || !host) return;

        popperEl = document.createElement('div');
        popperEl.setAttribute('data-popover', '');
        popperEl.style.cssText = css({
            zIndex: 1000,
            background: tokens.color.bg,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            boxShadow: tokens.shadow.card,
            padding: tokens.space.sm,
            fontFamily: tokens.font.family,
            fontSize: tokens.font.md,
            color: tokens.color.text,
        });

        if (props.children != null) {
            const inner = mount(props.children as Renderable);
            popperEl.appendChild(inner);
        }

        host.appendChild(popperEl);
        stopAutoUpdate = attachFloating(anchorEl, popperEl, {
            placement: props.placement,
            offset: props.offset,
        });

        onDocMousedown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;
            if (popperEl && popperEl.contains(target)) return;
            if (anchorEl.contains(target)) return;
            close();
        };
        onKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };
        window.addEventListener('mousedown', onDocMousedown, true);
        window.addEventListener('keydown', onKeydown, true);
    };

    const attachPlaceholder = (el: HTMLElement | null) => {
        if (!el) {
            // Placeholder unmounted — also tear down any open popper + effect.
            if (stopOpenEffect) { stopOpenEffect(); stopOpenEffect = null; }
            teardown();
            return;
        }

        placeholder = el;
        stopOpenEffect = effect(() => {
            const isOpen = props.open.get();
            if (isOpen) {
                if (!popperEl) openPopover();
            } else {
                teardown();
            }
        });

        // Safety net: also fire on placeholder removal via the MutationObserver.
        onUnmount(placeholder, () => {
            if (stopOpenEffect) { stopOpenEffect(); stopOpenEffect = null; }
            teardown();
        });
    };

    return createElement('span', {
        attributes: {
            ref: attachPlaceholder,
            style: 'display: none',
            'data-popover-anchor': '',
        },
    });
}
