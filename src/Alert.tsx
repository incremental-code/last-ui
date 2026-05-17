import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export type AlertVariant = 'error' | 'success' | 'info' | 'warning';

export interface AlertProps {
    variant?: AlertVariant;
    children?: Child;
}

const VARIANTS: Record<AlertVariant, { bg: string; border: string; fg: string }> = {
    error: { bg: '#fef2f2', border: '#dc2626', fg: '#7f1d1d' },
    success: { bg: '#f0fdf4', border: '#16a34a', fg: '#14532d' },
    warning: { bg: '#fffbeb', border: '#d97706', fg: '#78350f' },
    info: { bg: tokens.color.surface, border: tokens.color.accent, fg: tokens.color.text },
};

/**
 * Inline status banner with a left-border accent. Use `variant` to convey
 * tone; defaults to `info`. The component renders a `<div role="alert">`
 * for error/warning (assertive announcement) and `role="status"` for info /
 * success (polite announcement).
 */
export function Alert({ variant = 'info', children }: AlertProps) {
    const v = VARIANTS[variant];
    const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
    const live = variant === 'error' || variant === 'warning' ? 'assertive' : 'polite';
    return createElement('div', {
        attributes: {
            role,
            'aria-live': live,
            style: css({
                background: v.bg,
                color: v.fg,
                borderLeft: `4px solid ${v.border}`,
                borderRadius: tokens.radius.md,
                padding: `${tokens.space.sm} ${tokens.space.md}`,
                fontFamily: tokens.font.family,
                fontSize: tokens.font.sm,
                lineHeight: 1.4,
            }),
        },
    }, children);
}
