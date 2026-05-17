import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export type BadgeVariant = 'neutral' | 'accent' | 'danger';

export interface BadgeProps {
    children?: Child;
    variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, { bg: string; fg: string }> = {
    neutral: { bg: tokens.color.surface, fg: tokens.color.muted },
    accent: { bg: tokens.color.accent, fg: tokens.color.accentText },
    danger: { bg: tokens.color.danger, fg: '#ffffff' },
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
    const v = VARIANTS[variant];
    return createElement('span', {
        attributes: {
            style: css({
                display: 'inline-flex',
                alignItems: 'center',
                background: v.bg,
                color: v.fg,
                fontSize: tokens.font.sm,
                fontWeight: 500,
                padding: `2px ${tokens.space.sm}`,
                borderRadius: '999px',
                lineHeight: 1,
            }),
        },
    }, children);
}
