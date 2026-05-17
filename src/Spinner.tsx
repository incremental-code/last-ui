import { createElement } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
    size?: SpinnerSize;
    /** Border / stroke color. Defaults to `tokens.color.text`. */
    color?: string;
    /** Accessible label announced by screen readers. */
    label?: string;
}

const SIZE_PX: Record<SpinnerSize, number> = {
    sm: 14,
    md: 20,
    lg: 32,
};

const KEYFRAMES_STYLE_ID = '__last_ui_keyframes';
const KEYFRAMES_CSS = `
@keyframes last-ui-spin { to { transform: rotate(360deg); } }
@keyframes last-ui-skeleton-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
`;

/**
 * Lazily inject our shared @keyframes once per document. Idempotent: the first
 * call writes a singleton <style> tag into <head>; subsequent calls noop.
 * Safe to call from SSR (no document) — it just skips.
 */
export function ensureLastUiKeyframes(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById(KEYFRAMES_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = KEYFRAMES_STYLE_ID;
    style.textContent = KEYFRAMES_CSS;
    document.head.appendChild(style);
}

export function Spinner({ size = 'md', color = tokens.color.text, label = 'Loading' }: SpinnerProps) {
    ensureLastUiKeyframes();
    const px = SIZE_PX[size];
    const border = Math.max(2, Math.round(px / 8));
    return createElement('span', {
        attributes: {
            role: 'status',
            'aria-label': label,
            style: css({
                display: 'inline-block',
                width: `${px}px`,
                height: `${px}px`,
                border: `${border}px solid ${withAlpha(color, 0.2)}`,
                borderTopColor: color,
                borderRadius: '50%',
                animation: 'last-ui-spin 0.75s linear infinite',
                boxSizing: 'border-box',
                verticalAlign: 'middle',
            }),
        },
    });
}

/** Best-effort: if `color` already has an alpha we leave it; otherwise we add one via rgba where possible. */
function withAlpha(color: string, alpha: number): string {
    // hex #rgb / #rrggbb
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        const full = hex.length === 3
            ? hex.split('').map(c => c + c).join('')
            : hex.length === 6 ? hex : null;
        if (full) {
            const r = parseInt(full.slice(0, 2), 16);
            const g = parseInt(full.slice(2, 4), 16);
            const b = parseInt(full.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
    }
    return color;
}
