import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface StackProps {
    children?: Child;
    gap?: keyof typeof tokens.space | string;
    align?: 'start' | 'center' | 'end' | 'stretch';
}

export function Stack({ children, gap = 'md', align = 'stretch' }: StackProps) {
    const gapValue = (tokens.space as Record<string, string>)[gap] ?? gap;
    return createElement('div', {
        attributes: {
            style: css({
                display: 'flex',
                flexDirection: 'column',
                gap: gapValue,
                alignItems: align,
            }),
        },
    }, children);
}
