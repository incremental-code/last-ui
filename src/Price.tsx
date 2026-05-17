import { createElement } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface PriceProps {
    cents: number;
    currency?: string;
    locale?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Price({ cents, currency = 'USD', locale = 'en-US', size = 'md' }: PriceProps) {
    const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
    return createElement('span', {
        attributes: {
            style: css({
                fontFamily: tokens.font.family,
                fontSize: tokens.font[size],
                fontWeight: 600,
                color: tokens.color.text,
            }),
        },
    }, formatted);
}
