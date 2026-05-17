import { createElement } from '@incremental-code/last-act';
import type { Child } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
    children?: Child;
    onClick?: (event: MouseEvent) => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

const VARIANTS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: tokens.color.primary, fg: tokens.color.primaryText, border: tokens.color.primary },
    secondary: { bg: tokens.color.bg, fg: tokens.color.text, border: tokens.color.border },
    danger: { bg: tokens.color.bg, fg: tokens.color.danger, border: tokens.color.border },
};

export function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button' }: ButtonProps) {
    const v = VARIANTS[variant];
    return createElement('button', {
        onclick: onClick,
        type,
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
}
