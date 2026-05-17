import { createElement, signal, computed } from '@incremental-code/last-act';
import type { Child, Renderable } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';
import { Show } from './Show.js';

export interface AccordionItem {
    id: string;
    header: Child;
    content: Child;
    /** Optional default-open. */
    defaultOpen?: boolean;
    disabled?: boolean;
}

export interface AccordionProps {
    items: AccordionItem[];
    /** If true, multiple items can be open at once. Default false (one-at-a-time, like an FAQ). */
    allowMultiple?: boolean;
}

export function Accordion({ items, allowMultiple = false }: AccordionProps): Renderable {
    const initial = new Set<string>();
    if (allowMultiple) {
        for (const it of items) if (it.defaultOpen) initial.add(it.id);
    } else {
        const firstOpen = items.find(it => it.defaultOpen);
        if (firstOpen) initial.add(firstOpen.id);
    }
    const openIds = signal<Set<string>>(initial);

    const toggle = (id: string) => {
        const current = openIds.get();
        const next = new Set<string>(current);
        if (next.has(id)) {
            next.delete(id);
        } else {
            if (!allowMultiple) next.clear();
            next.add(id);
        }
        openIds.set(next);
    };

    const renderItem = (item: AccordionItem) => {
        const isOpen = computed(() => openIds.get().has(item.id));

        const chevron = createElement('span', {
            attributes: {
                'aria-hidden': 'true',
                style: computed(() => css({
                    display: 'inline-block',
                    transition: 'transform 150ms ease',
                    transform: isOpen.get() ? 'rotate(90deg)' : 'rotate(0deg)',
                    color: tokens.color.muted,
                    marginRight: tokens.space.sm,
                    fontSize: tokens.font.sm,
                    width: '12px',
                    textAlign: 'center',
                })),
            },
        }, '▶');

        const header = createElement('button', {
            type: 'button',
            disabled: item.disabled,
            onclick: () => { if (!item.disabled) toggle(item.id); },
            attributes: {
                'aria-expanded': computed(() => (isOpen.get() ? 'true' : 'false')),
                'aria-controls': `accordion-panel-${item.id}`,
                id: `accordion-header-${item.id}`,
                style: css({
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    background: tokens.color.bg,
                    color: tokens.color.text,
                    border: 'none',
                    padding: `${tokens.space.sm} ${tokens.space.md}`,
                    fontFamily: tokens.font.family,
                    fontSize: tokens.font.md,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    opacity: item.disabled ? '0.5' : '1',
                    boxSizing: 'border-box',
                }),
            },
        }, chevron, createElement('span', { attributes: { style: css({ flex: '1' }) } }, item.header));

        const body = Show({
            when: isOpen,
            children: () => createElement('div', {
                attributes: {
                    role: 'region',
                    id: `accordion-panel-${item.id}`,
                    'aria-labelledby': `accordion-header-${item.id}`,
                    style: css({
                        padding: `${tokens.space.sm} ${tokens.space.md} ${tokens.space.md}`,
                        borderTop: `1px solid ${tokens.color.border}`,
                        color: tokens.color.text,
                        fontFamily: tokens.font.family,
                        fontSize: tokens.font.md,
                    }),
                },
            }, item.content),
        });

        return createElement('div', {
            attributes: {
                style: css({
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    overflow: 'hidden',
                    background: tokens.color.bg,
                }),
            },
        }, header, body);
    };

    return createElement('div', {
        attributes: {
            style: css({
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.space.sm,
                fontFamily: tokens.font.family,
            }),
        },
    }, ...items.map(renderItem));
}

