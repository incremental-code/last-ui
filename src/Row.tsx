import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface RowProps {
    children?: Child;
    gap?: keyof typeof tokens.space | string;
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    wrap?: boolean;
}

export function Row({ children, gap = 'md', justify = 'start', align = 'center', wrap = false }: RowProps) {
    const gapValue = (tokens.space as Record<string, string>)[gap] ?? gap;
    return createElement('div', {
        attributes: {
            style: css({
                display: 'flex',
                flexDirection: 'row',
                gap: gapValue,
                justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : justify,
                alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align,
                flexWrap: wrap ? 'wrap' : 'nowrap',
            }),
        },
    }, children);
}
