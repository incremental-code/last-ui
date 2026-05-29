import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';
import type { ButtonVariant } from './Button.js';

export interface ConfirmButtonProps {
    /** Label rendered inside the submit button. */
    children?: Child;
    /** Confirmation prompt shown via the browser's native confirm dialog. */
    prompt: string;
    /** Form method, defaults to 'post'. */
    method?: 'post' | 'get';
    /** Form action URL. Omit to post back to the current page. */
    action?: string;
    /** Hidden fields submitted alongside the click — e.g. `{ _action: 'delete-post' }`. */
    hiddenFields?: Record<string, string>;
    /** Button visual variant; defaults to 'danger'. */
    variant?: ButtonVariant;
    /** Disables the button. */
    disabled?: boolean;
}

const VARIANTS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: tokens.color.primary, fg: tokens.color.primaryText, border: tokens.color.primary },
    secondary: { bg: tokens.color.bg, fg: tokens.color.text, border: tokens.color.border },
    danger: { bg: tokens.color.danger, fg: tokens.color.primaryText, border: tokens.color.danger },
};

/**
 * Server-renderable destructive submit button. Wraps a single-button `<form>`
 * with an inline `onsubmit` handler that calls the browser's native
 * `window.confirm()` — no client-side JS or hydration is required, which keeps
 * it usable in SSR-only apps.
 *
 * Upgrade path: when a consumer wants a typed-name confirmation, swap the
 * inline handler for a signal-driven `Modal`. The form shape stays the same so
 * server actions don't need to change.
 */
export function ConfirmButton({
    children,
    prompt,
    method = 'post',
    action,
    hiddenFields,
    variant = 'danger',
    disabled = false,
}: ConfirmButtonProps) {
    const v = VARIANTS[variant];

    const hidden = hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) =>
            createElement('input', {
                attributes: { type: 'hidden', name: String(name), value: String(value) },
            }),
        )
        : [];

    const button = createElement('button', {
        type: 'submit',
        disabled,
        attributes: {
            style: css({
                background: v.bg,
                color: v.fg,
                border: `1px solid ${v.border}`,
                borderRadius: tokens.radius.md,
                padding: `${tokens.space.sm} ${tokens.space.md}`,
                fontFamily: tokens.font.family,
                fontSize: tokens.font.md,
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? '0.5' : '1',
            }),
        },
    }, children);

    return createElement('form', {
        attributes: {
            method,
            ...(action ? { action } : {}),
            // JSON.stringify safely double-quotes the prompt and escapes inner
            // quotes / backslashes / newlines. The serializer HTML-escapes the
            // attribute value so it survives intact in the rendered markup.
            onsubmit: `return confirm(${JSON.stringify(prompt)})`,
            style: css({ display: 'inline-block', margin: 0 }),
        },
    }, ...hidden, button);
}
