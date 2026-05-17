import { createElement, computed, onUnmount } from '@incremental-code/last-act';
import type { Child, Component, ReadSignal, Renderable } from '@incremental-code/last-act';
import { Portal } from './Portal.js';
import { trapFocus } from './focus-trap.js';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface ModalProps {
    open: ReadSignal<boolean>;
    onClose?: () => void;
    title?: Child;
    children?: Child;
    footer?: Child;
    width?: string;
    /** Close on overlay click (default true). */
    dismissOnOverlayClick?: boolean;
    /** Close on Escape (default true). */
    dismissOnEscape?: boolean;
}

/**
 * Centered, focus-trapped modal dialog. Rendered via Portal into
 * `#__portal_root`. The overlay is a sibling backdrop that intercepts clicks
 * outside the card.
 *
 * Known limitation: this component does not lock `body` scroll. If you need
 * that, toggle `document.body.style.overflow = 'hidden'` in an `effect()` that
 * subscribes to `open` at the consumer level.
 */
export function Modal(props: ModalProps): Renderable {
    if (typeof document === 'undefined') return null;

    const width = props.width ?? '480px';
    const dismissOnOverlay = props.dismissOnOverlayClick !== false;
    const dismissOnEscape = props.dismissOnEscape !== false;

    return computed(() => {
        if (!props.open.get()) return null;

        // Capture the element that was focused at open-time so we can restore
        // it on close. Computed re-runs only on open transitions, so this is
        // the right moment to snapshot.
        const previouslyFocused = document.activeElement as HTMLElement | null;

        let releaseTrap: (() => void) | null = null;
        let onKeydown: ((event: KeyboardEvent) => void) | null = null;
        let cardEl: HTMLElement | null = null;
        let overlayEl: HTMLElement | null = null;
        let cleanedUp = false;

        const close = () => props.onClose?.();

        const cleanup = () => {
            if (cleanedUp) return;
            cleanedUp = true;
            if (onKeydown) {
                window.removeEventListener('keydown', onKeydown, true);
                onKeydown = null;
            }
            if (releaseTrap) {
                // trapFocus restores focus to whatever was active at trap time.
                releaseTrap();
                releaseTrap = null;
            }
        };

        const overlayStyle = css({
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: tokens.space.md,
            zIndex: 1000,
        });

        const cardStyle = css({
            background: tokens.color.bg,
            color: tokens.color.text,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.lg,
            boxShadow: tokens.shadow.card,
            width: '100%',
            maxWidth: width,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: tokens.font.family,
            fontSize: tokens.font.md,
            overflow: 'hidden',
        });

        const headerStyle = css({
            padding: `${tokens.space.md} ${tokens.space.lg}`,
            borderBottom: `1px solid ${tokens.color.border}`,
            fontSize: tokens.font.lg,
            fontWeight: 600,
        });

        const bodyStyle = css({
            padding: tokens.space.lg,
            overflow: 'auto',
            flex: '1 1 auto',
        });

        const footerStyle = css({
            padding: `${tokens.space.md} ${tokens.space.lg}`,
            borderTop: `1px solid ${tokens.color.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: tokens.space.sm,
        });

        const header = props.title != null
            ? createElement('div', { attributes: { style: headerStyle } }, props.title)
            : null;

        const body = createElement('div', { attributes: { style: bodyStyle } }, props.children ?? null);

        const footer = props.footer != null
            ? createElement('div', { attributes: { style: footerStyle } }, props.footer)
            : null;

        const card = createElement('div', {
            attributes: {
                role: 'dialog',
                'aria-modal': 'true',
                tabindex: '-1',
                style: cardStyle,
                ref: (el: HTMLElement | null) => {
                    if (!el) return;
                    cardEl = el;
                    releaseTrap = trapFocus(cardEl, {
                        restoreFocus: previouslyFocused,
                    });
                    onUnmount(cardEl, cleanup);
                },
            },
        }, header, body, footer);

        const overlay = createElement('div', {
            attributes: {
                style: overlayStyle,
                ref: (el: HTMLElement | null) => {
                    if (!el) return;
                    overlayEl = el;
                },
            },
            onmousedown: (event: MouseEvent) => {
                if (!dismissOnOverlay) return;
                if (event.target === overlayEl) close();
            },
        }, card);

        if (dismissOnEscape) {
            onKeydown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    event.stopPropagation();
                    close();
                }
            };
            window.addEventListener('keydown', onKeydown, true);
        }

        return createElement(Portal as unknown as Component, {}, overlay) as Child;
    });
}
