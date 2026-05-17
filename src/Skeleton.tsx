import { createElement } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';
import { ensureLastUiKeyframes } from './Spinner.js';

export interface SkeletonProps {
    width?: string;
    height?: string;
    radius?: string;
    /** When true, animate a gradient sweep across the surface. Default true. */
    shimmer?: boolean;
}

export function Skeleton({
    width = '100%',
    height = '1em',
    radius = tokens.radius.sm,
    shimmer = true,
}: SkeletonProps = {}) {
    ensureLastUiKeyframes();
    const base: Record<string, string> = {
        display: 'block',
        width,
        height,
        borderRadius: radius,
        background: tokens.color.surface,
    };
    if (shimmer) {
        base.background = `linear-gradient(90deg, ${tokens.color.surface} 0%, ${tokens.color.border} 50%, ${tokens.color.surface} 100%)`;
        base.backgroundSize = '200% 100%';
        base.animation = 'last-ui-skeleton-shimmer 1.4s ease-in-out infinite';
    }
    return createElement('div', {
        attributes: {
            'aria-hidden': 'true',
            style: css(base),
        },
    });
}
