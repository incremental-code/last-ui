import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface TextProps {
    children?: Child;
    muted?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function Text({ children, muted = false, size = 'md' }: TextProps) {
    return createElement('p', {
        attributes: {
            style: css({
                fontSize: tokens.font[size],
                color: muted ? tokens.color.muted : tokens.color.text,
                margin: 0,
                lineHeight: 1.5,
            }),
        },
    }, children);
}
