import { createElement, computed } from '@incremental-code/last-act';
import type { Child, Component, Renderable } from '@incremental-code/last-act';
import { MenuDropdown } from './MenuDropdown.js';
import type { MenuItem } from './MenuDropdown.js';
import { matchMedia } from './media.js';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface MenuBarItem {
    id: string;
    label: Child;
    href?: string;
    onClick?: () => void;
    active?: boolean;
}

export interface MenuBarProps {
    items: MenuBarItem[];
    /** Optional brand/leading element (logo, name). */
    leading?: Child;
    /** Optional trailing element (account menu, CTA). */
    trailing?: Child;
    /** Breakpoint below which the bar collapses to a hamburger MenuDropdown. */
    collapseBelow?: keyof typeof tokens.breakpoint;
}

/**
 * Responsive top navigation. Above the configured breakpoint we render a
 * horizontal row of links; below it we collapse to a hamburger that opens a
 * MenuDropdown.
 */
export function MenuBar(props: MenuBarProps): Renderable {
    const collapseAt = props.collapseBelow ?? 'md';
    const bpValue = tokens.breakpoint[collapseAt];
    // matches => below the breakpoint => collapse to hamburger.
    const isNarrow = matchMedia(`(max-width: ${bpValue})`);

    const renderInlineItem = (item: MenuBarItem): Renderable => {
        const baseStyle = css({
            color: item.active ? tokens.color.accent : tokens.color.text,
            fontWeight: item.active ? 600 : 500,
            fontSize: tokens.font.md,
            fontFamily: tokens.font.family,
            textDecoration: 'none',
            padding: `${tokens.space.xs} ${tokens.space.sm}`,
            borderRadius: tokens.radius.sm,
            cursor: 'pointer',
            background: 'transparent',
            border: '0',
        });

        if (item.href) {
            return createElement('a', {
                key: item.id,
                attributes: { href: item.href, style: baseStyle },
                onclick: item.onClick
                    ? (() => { item.onClick!(); })
                    : undefined,
            }, item.label);
        }
        return createElement('button', {
            key: item.id,
            type: 'button',
            attributes: { style: baseStyle },
            onclick: item.onClick,
        }, item.label);
    };

    const renderExpanded = (): Renderable => {
        return createElement('div', {
            attributes: {
                style: css({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: tokens.space.md,
                    padding: `${tokens.space.sm} ${tokens.space.md}`,
                    fontFamily: tokens.font.family,
                }),
            },
        },
            createElement('div', {
                attributes: { style: css({ display: 'flex', alignItems: 'center', gap: tokens.space.md }) },
            }, props.leading ?? null),
            createElement('nav', {
                attributes: {
                    style: css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.space.sm,
                        flex: '1 1 auto',
                        justifyContent: 'center',
                    }),
                },
            }, ...props.items.map(renderInlineItem)),
            createElement('div', {
                attributes: { style: css({ display: 'flex', alignItems: 'center', gap: tokens.space.md }) },
            }, props.trailing ?? null),
        );
    };

    const renderCollapsed = (): Renderable => {
        const menuItems: MenuItem[] = props.items.map(it => ({
            id: it.id,
            label: it.label,
            disabled: false,
            onSelect: () => {
                // Honour onClick first; fall back to href navigation so the
                // hamburger menu still works when items are link-only. Real
                // links rendered as <a> would be intercepted by last-router,
                // but a menu item is rendered as a <div>, so we navigate
                // manually here.
                if (it.onClick) {
                    it.onClick();
                    return;
                }
                if (it.href && typeof window !== 'undefined') {
                    window.location.href = it.href;
                }
            },
        }));

        const hamburger = createElement('span', {
            attributes: {
                'aria-label': 'Open menu',
                style: css({
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    background: tokens.color.bg,
                    color: tokens.color.text,
                    fontSize: tokens.font.lg,
                    lineHeight: 1,
                }),
            },
        }, '☰'); // ☰

        const dropdown = createElement(MenuDropdown as unknown as Component, {
            trigger: hamburger,
            items: menuItems,
            placement: 'bottom-end',
        });

        return createElement('div', {
            attributes: {
                style: css({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: tokens.space.md,
                    padding: `${tokens.space.sm} ${tokens.space.md}`,
                    fontFamily: tokens.font.family,
                }),
            },
        },
            createElement('div', {
                attributes: { style: css({ display: 'flex', alignItems: 'center', gap: tokens.space.sm }) },
            }, props.leading ?? null),
            createElement('div', {
                attributes: { style: css({ display: 'flex', alignItems: 'center', gap: tokens.space.sm }) },
            }, dropdown, props.trailing ?? null),
        );
    };

    return computed(() => (isNarrow.get() ? renderCollapsed() : renderExpanded()));
}
