import { createElement, signal, onUnmount } from '@incremental-code/last-act';
import type { Child, Component, Renderable } from '@incremental-code/last-act';
import { Popover } from './Popover.js';
import type { FloatingOptions } from './floating.js';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface TooltipProps {
    /** The element(s) to wrap as the tooltip's anchor. */
    children?: Child;
    /** Tooltip body. */
    content: Child;
    placement?: FloatingOptions['placement'];
    /** ms before opening on hover. Default 200. */
    delay?: number;
}

/**
 * Hover/focus tooltip. Wraps `children` in an inline span anchor and uses
 * Popover internally to render `content`.
 */
export function Tooltip({ children, content, placement = 'top', delay = 200 }: TooltipProps): Renderable {
    const open = signal(false);
    const anchor = signal<HTMLElement | null>(null);
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
        if (timer != null) {
            clearTimeout(timer);
            timer = null;
        }
    };

    const openLater = () => {
        clearTimer();
        timer = setTimeout(() => {
            timer = null;
            open.set(true);
        }, delay);
    };

    const closeNow = () => {
        clearTimer();
        open.set(false);
    };

    const wrapped = createElement('span', {
        attributes: {
            ref: (el: HTMLElement | null) => {
                anchor.set(el);
                if (el) {
                    onUnmount(el, () => {
                        clearTimer();
                        open.set(false);
                    });
                }
            },
            style: css({ display: 'inline-block' }),
        },
        onmouseenter: openLater,
        onmouseleave: closeNow,
        onfocusin: openLater,
        onfocusout: closeNow,
    }, children);

    const styledContent = createElement('span', {
        attributes: {
            style: css({
                background: tokens.color.text,
                color: tokens.color.primaryText,
                padding: `${tokens.space.xs} ${tokens.space.sm}`,
                borderRadius: tokens.radius.sm,
                fontSize: tokens.font.sm,
                fontFamily: tokens.font.family,
                pointerEvents: 'none',
                maxWidth: '240px',
                display: 'inline-block',
            }),
        },
    }, content);

    const popover = createElement(Popover as unknown as Component, {
        open,
        anchor,
        placement,
        onClose: () => open.set(false),
    }, styledContent);

    return createElement('span', {
        attributes: { style: css({ display: 'inline-block' }) },
    }, wrapped, popover);
}
