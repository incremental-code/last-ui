import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface ContainerProps {
    children?: Child;
    maxWidth?: string;
    padding?: string;
}

export function Container({ children, maxWidth = '960px', padding = tokens.space.lg }: ContainerProps) {
    return createElement('div', {
        attributes: {
            style: css({
                maxWidth,
                margin: '0 auto',
                padding,
                fontFamily: tokens.font.family,
                color: tokens.color.text,
            }),
        },
    }, children);
}
