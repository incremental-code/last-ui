import { createElement, computed } from '@incremental-code/last-act';
import type { Child, Renderable, WriteSignal } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';
import { Show } from './Show.js';

export interface TabItem {
    id: string;
    label: Child;
    content: Child;
    disabled?: boolean;
}

export interface TabsProps {
    items: TabItem[];
    /** Controlled selected id. */
    value: WriteSignal<string>;
    /** Visual variant: 'underline' (default) | 'pill' */
    variant?: 'underline' | 'pill';
}

export function Tabs({ items, value, variant = 'underline' }: TabsProps): Renderable {
    const enabledIndices = items
        .map((it, i) => ({ it, i }))
        .filter(x => !x.it.disabled)
        .map(x => x.i);

    const focusTab = (id: string) => {
        // Defer focus to next tick so the DOM is updated.
        if (typeof document === 'undefined') return;
        setTimeout(() => {
            const el = document.getElementById(`tab-${id}`);
            if (el) (el as HTMLElement).focus();
        }, 0);
    };

    const moveBy = (delta: number) => {
        if (enabledIndices.length === 0) return;
        const currentId = value.get();
        const currentEnabledPos = enabledIndices.findIndex(i => items[i].id === currentId);
        const startPos = currentEnabledPos >= 0 ? currentEnabledPos : 0;
        const nextPos = (startPos + delta + enabledIndices.length) % enabledIndices.length;
        const nextItem = items[enabledIndices[nextPos]];
        value.set(nextItem.id);
        focusTab(nextItem.id);
    };

    const moveTo = (pos: 'first' | 'last') => {
        if (enabledIndices.length === 0) return;
        const idx = pos === 'first' ? enabledIndices[0] : enabledIndices[enabledIndices.length - 1];
        const next = items[idx];
        value.set(next.id);
        focusTab(next.id);
    };

    const onStripKeydown = (event: KeyboardEvent) => {
        // Only handle if focus is on a tab inside the strip.
        const target = event.target as HTMLElement | null;
        if (!target || target.getAttribute('role') !== 'tab') return;
        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                moveBy(1);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                moveBy(-1);
                break;
            case 'Home':
                event.preventDefault();
                moveTo('first');
                break;
            case 'End':
                event.preventDefault();
                moveTo('last');
                break;
        }
    };

    const renderTab = (item: TabItem) => {
        const isActive = computed(() => value.get() === item.id);

        const style = computed(() => {
            const active = isActive.get();
            const base: Record<string, string | number | undefined> = {
                background: 'transparent',
                color: item.disabled ? tokens.color.muted : tokens.color.text,
                border: 'none',
                padding: `${tokens.space.sm} ${tokens.space.md}`,
                fontFamily: tokens.font.family,
                fontSize: tokens.font.md,
                fontWeight: active ? 600 : 500,
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? '0.5' : '1',
                outline: 'none',
            };
            if (variant === 'underline') {
                base.borderBottom = `2px solid ${active ? tokens.color.accent : 'transparent'}`;
                base.marginBottom = '-1px';
                base.color = active ? tokens.color.accent : base.color;
            } else {
                // pill
                base.borderRadius = tokens.radius.md;
                base.background = active ? tokens.color.primary : 'transparent';
                base.color = active ? tokens.color.primaryText : (item.disabled ? tokens.color.muted : tokens.color.text);
            }
            return css(base);
        });

        return createElement('button', {
            type: 'button',
            disabled: item.disabled,
            role: 'tab',
            onclick: () => { if (!item.disabled) value.set(item.id); },
            attributes: {
                id: `tab-${item.id}`,
                'aria-selected': computed(() => (isActive.get() ? 'true' : 'false')),
                'aria-controls': `tabpanel-${item.id}`,
                tabindex: computed(() => (isActive.get() ? '0' : '-1')),
                style,
            },
        }, item.label);
    };

    const stripStyle = variant === 'underline'
        ? css({
            display: 'flex',
            gap: tokens.space.xs,
            borderBottom: `1px solid ${tokens.color.border}`,
            alignItems: 'flex-end',
        })
        : css({
            display: 'inline-flex',
            gap: tokens.space.xs,
            padding: tokens.space.xs,
            background: tokens.color.surface,
            borderRadius: tokens.radius.md,
        });

    const strip = createElement('div', {
        role: 'tablist',
        onkeydown: onStripKeydown,
        attributes: { style: stripStyle },
    }, ...items.map(renderTab));

    const panel = computed<Renderable>(() => {
        const activeId = value.get();
        const active = items.find(it => it.id === activeId);
        if (!active) return null;
        return createElement('div', {
            role: 'tabpanel',
            attributes: {
                id: `tabpanel-${active.id}`,
                'aria-labelledby': `tab-${active.id}`,
                tabindex: '0',
                style: css({
                    padding: `${tokens.space.md} 0`,
                    fontFamily: tokens.font.family,
                    fontSize: tokens.font.md,
                    color: tokens.color.text,
                    outline: 'none',
                }),
            },
        }, active.content);
    });

    // We render the panel via Show for consistency, gated on a truthy computed.
    const hasActive = computed(() => !!items.find(it => it.id === value.get()));
    const panelShown = Show({ when: hasActive, children: () => panel });

    return createElement('div', {
        attributes: {
            style: css({
                display: 'flex',
                flexDirection: 'column',
                fontFamily: tokens.font.family,
            }),
        },
    }, strip, panelShown);
}
