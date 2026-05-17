import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface CardProps {
    children?: Child;
    padding?: string;
}

export function Card({ children, padding = tokens.space.lg }: CardProps) {
    return createElement('div', {
        attributes: {
            style: css({
                background: tokens.color.bg,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.lg,
                padding,
                boxShadow: tokens.shadow.card,
            }),
        },
    }, children);
}
