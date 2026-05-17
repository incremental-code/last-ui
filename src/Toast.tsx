import { createElement, computed } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';
import { toastQueue, toast } from './toast-store.js';
import type { ToastEntry, ToastKind } from './toast-store.js';

const KIND_STYLE: Record<ToastKind, { bg: string; fg: string; border: string }> = {
    info: {
        bg: tokens.color.bg,
        fg: tokens.color.text,
        border: tokens.color.border,
    },
    success: {
        bg: tokens.color.accent,
        fg: tokens.color.accentText,
        border: tokens.color.accent,
    },
    error: {
        bg: tokens.color.danger,
        fg: '#ffffff',
        border: tokens.color.danger,
    },
};

/**
 * Renders a single toast card. Exposes its own close button. Inlined rather
 * than exported as a component so we can pass non-serializable props (the
 * raw entry object) without forcing it through `createElement`'s prop record.
 */
function renderToastItem(entry: ToastEntry) {
    const s = KIND_STYLE[entry.kind];
    return createElement('div', {
        attributes: {
            role: entry.kind === 'error' ? 'alert' : 'status',
            'aria-live': entry.kind === 'error' ? 'assertive' : 'polite',
            style: css({
                display: 'flex',
                alignItems: 'flex-start',
                gap: tokens.space.sm,
                minWidth: '240px',
                maxWidth: '360px',
                background: s.bg,
                color: s.fg,
                border: `1px solid ${s.border}`,
                borderRadius: tokens.radius.md,
                padding: `${tokens.space.sm} ${tokens.space.md}`,
                boxShadow: tokens.shadow.card,
                fontFamily: tokens.font.family,
                fontSize: tokens.font.md,
            }),
        },
    },
        createElement('div', {
            attributes: { style: css({ flex: '1 1 auto' }) },
        }, entry.message),
        createElement('button', {
            type: 'button',
            onclick: () => toast.dismiss(entry.id),
            'aria-label': 'Dismiss notification',
            attributes: {
                style: css({
                    flex: '0 0 auto',
                    background: 'transparent',
                    border: '0',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: tokens.font.md,
                    lineHeight: 1,
                    padding: '0',
                    opacity: '0.7',
                }),
            },
        }, '×'),
    );
}

export interface ToastRootProps {
    /**
     * Corner to anchor the stack to. Defaults to 'top-right'.
     */
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Mount once at the top of the app (sibling of #app content). Subscribes to
 * the module-level toast queue and renders fixed-position cards. Use
 * `toast.info/success/error` from anywhere to push entries.
 */
export function ToastRoot({ position = 'top-right' }: ToastRootProps = {}) {
    const anchor: Record<string, string> = {
        position: 'fixed',
        zIndex: '1000',
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.space.sm,
        pointerEvents: 'none',
    };
    if (position.startsWith('top')) anchor.top = tokens.space.md;
    else anchor.bottom = tokens.space.md;
    if (position.endsWith('right')) anchor.right = tokens.space.md;
    else anchor.left = tokens.space.md;

    const items = computed(() =>
        toastQueue.get().map(entry =>
            createElement('div', {
                key: entry.id,
                attributes: { style: css({ pointerEvents: 'auto' }) },
            }, renderToastItem(entry)),
        ),
    );

    return createElement('div', {
        attributes: { style: css(anchor) },
    }, items);
}
