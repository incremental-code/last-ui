import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface GridProps {
    children?: Child;
    minColumnWidth?: string;
    gap?: keyof typeof tokens.space | string;
}

export function Grid({ children, minColumnWidth = '220px', gap = 'lg' }: GridProps) {
    const gapValue = (tokens.space as Record<string, string>)[gap] ?? gap;
    return createElement('div', {
        attributes: {
            style: css({
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}, 1fr))`,
                gap: gapValue,
            }),
        },
    }, children);
}
