import { createElement, signal, computed, onUnmount } from '@incremental-code/last-act';
import type { Child, Component, Renderable } from '@incremental-code/last-act';
import { Popover } from './Popover.js';
import type { FloatingPlacement } from './floating.js';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface MenuItem {
    id: string;
    label: Child;
    onSelect?: () => void;
    disabled?: boolean;
    /** Optional icon / leading element */
    leading?: Child;
}

export interface MenuDropdownProps {
    /** Element that opens the menu (button, avatar, etc.) — wrapped in a span. */
    trigger: Child;
    items: MenuItem[];
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

/**
 * Click-to-open dropdown menu with full keyboard support.
 *
 * The trigger is passed as opaque `Child`, so we wrap it in an inline-block
 * span and capture *that span* as the Popover anchor. This avoids forcing
 * callers to thread a ref through whatever element they hand us.
 */
export function MenuDropdown(props: MenuDropdownProps): Renderable {
    const open = signal(false);
    const anchor = signal<HTMLElement | null>(null);
    const triggerEl = signal<HTMLElement | null>(null);
    const focusedIndex = signal<number>(-1);

    const items = props.items;
    const placement: FloatingPlacement = props.placement ?? 'bottom-start';

    const firstEnabledIndex = (): number => {
        for (let i = 0; i < items.length; i++) {
            if (!items[i]!.disabled) return i;
        }
        return -1;
    };

    const nextEnabledIndex = (from: number, dir: 1 | -1): number => {
        if (items.length === 0) return -1;
        let i = from;
        for (let step = 0; step < items.length; step++) {
            i = (i + dir + items.length) % items.length;
            if (!items[i]!.disabled) return i;
        }
        return from;
    };

    const closeMenu = (restoreFocus: boolean) => {
        open.set(false);
        focusedIndex.set(-1);
        if (restoreFocus) {
            const el = triggerEl.get();
            if (el) {
                try { el.focus(); } catch { /* ignore */ }
            }
        }
    };

    const openMenu = () => {
        focusedIndex.set(firstEnabledIndex());
        open.set(true);
    };

    const onTriggerClick = (event: MouseEvent) => {
        event.preventDefault();
        if (open.get()) {
            closeMenu(false);
        } else {
            openMenu();
        }
    };

    const onTriggerKeydown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMenu();
        }
    };

    const wrappedTrigger = createElement('span', {
        attributes: {
            ref: (el: HTMLElement | null) => {
                anchor.set(el);
                triggerEl.set(el);
                if (el) {
                    onUnmount(el, () => {
                        open.set(false);
                    });
                }
            },
            tabindex: '0',
            role: 'button',
            'aria-haspopup': 'menu',
            style: css({ display: 'inline-block', cursor: 'pointer' }),
        },
        onclick: onTriggerClick,
        onkeydown: onTriggerKeydown,
    }, props.trigger);

    const onItemKeydown = (event: KeyboardEvent) => {
        const key = event.key;
        if (key === 'ArrowDown') {
            event.preventDefault();
            const cur = focusedIndex.get();
            const next = nextEnabledIndex(cur < 0 ? -1 : cur, 1);
            focusedIndex.set(next);
            return;
        }
        if (key === 'ArrowUp') {
            event.preventDefault();
            const cur = focusedIndex.get();
            const next = nextEnabledIndex(cur < 0 ? items.length : cur, -1);
            focusedIndex.set(next);
            return;
        }
        if (key === 'Home') {
            event.preventDefault();
            focusedIndex.set(firstEnabledIndex());
            return;
        }
        if (key === 'End') {
            event.preventDefault();
            // Walk backward from the start to find last enabled.
            for (let i = items.length - 1; i >= 0; i--) {
                if (!items[i]!.disabled) { focusedIndex.set(i); break; }
            }
            return;
        }
        if (key === 'Enter' || key === ' ') {
            event.preventDefault();
            const cur = focusedIndex.get();
            const item = cur >= 0 ? items[cur] : null;
            if (item && !item.disabled) {
                item.onSelect?.();
                closeMenu(true);
            }
            return;
        }
        if (key === 'Escape') {
            event.preventDefault();
            closeMenu(true);
            return;
        }
        if (key === 'Tab') {
            // Per the spec, Tab closes the menu and lets normal tab order continue.
            closeMenu(false);
            return;
        }
    };

    const itemList = computed(() => {
        if (!open.get()) return null;
        const activeIndex = focusedIndex.get();

        return createElement('div', {
            attributes: {
                role: 'menu',
                style: css({
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '180px',
                }),
            },
            onkeydown: onItemKeydown,
        }, ...items.map((item, index) => {
            const isActive = index === activeIndex;
            const disabled = !!item.disabled;
            return createElement('div', {
                key: item.id,
                attributes: {
                    role: 'menuitem',
                    tabindex: isActive ? '0' : '-1',
                    'aria-disabled': disabled ? 'true' : 'false',
                    ref: (el: HTMLElement | null) => {
                        if (el && isActive) {
                            // Move DOM focus to match the roving tabindex.
                            queueMicrotask(() => {
                                try { el.focus(); } catch { /* ignore */ }
                            });
                        }
                    },
                    style: css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.space.sm,
                        padding: `${tokens.space.sm} ${tokens.space.md}`,
                        borderRadius: tokens.radius.sm,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        color: disabled ? tokens.color.muted : tokens.color.text,
                        background: isActive && !disabled ? tokens.color.surface : 'transparent',
                        fontSize: tokens.font.md,
                        userSelect: 'none',
                        outline: 'none',
                    }),
                },
                onmouseenter: () => {
                    if (!disabled) focusedIndex.set(index);
                },
                onclick: (event: MouseEvent) => {
                    event.preventDefault();
                    if (disabled) return;
                    item.onSelect?.();
                    closeMenu(true);
                },
            },
                item.leading != null
                    ? createElement('span', {
                        attributes: { style: css({ display: 'inline-flex', alignItems: 'center' }) },
                    }, item.leading)
                    : null,
                createElement('span', { attributes: { style: css({ flex: '1 1 auto' }) } }, item.label),
            );
        }));
    });

    const popover = createElement(Popover as unknown as Component, {
        open,
        anchor,
        placement,
        onClose: () => closeMenu(false),
    }, itemList);

    return createElement('span', {
        attributes: { style: css({ display: 'inline-block' }) },
    }, wrappedTrigger, popover);
}
