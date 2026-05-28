import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface NavLinkProps {
    href: string;
    children?: Child;
    active?: boolean;
}

export function NavLink({ href, children, active = false }: NavLinkProps) {
    return createElement('a', {
        attributes: {
            href,
            ...(active ? { 'aria-current': 'page' } : {}),
            style: css({
                color: active ? tokens.color.accent : tokens.color.text,
                fontWeight: active ? 600 : 500,
                fontSize: tokens.font.md,
                textDecoration: 'none',
                padding: `${tokens.space.xs} ${tokens.space.sm}`,
                borderRadius: tokens.radius.sm,
            }),
        },
    }, children);
}
