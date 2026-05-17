import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface HeadingProps {
    children?: Child;
    level?: 1 | 2 | 3;
}

const SIZE: Record<number, string> = {
    1: tokens.font.xxl,
    2: tokens.font.xl,
    3: tokens.font.lg,
};

export function Heading({ children, level = 1 }: HeadingProps) {
    const tag = `h${level}`;
    return createElement(tag, {
        attributes: {
            style: css({
                fontSize: SIZE[level],
                fontWeight: 600,
                lineHeight: 1.2,
                margin: 0,
                color: tokens.color.text,
            }),
        },
    }, children);
}
