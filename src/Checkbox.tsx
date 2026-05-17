import { createElement } from '@incremental-code/last-act';
import type { Child, ReadSignal, WriteSignal } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface CheckboxProps {
    value: WriteSignal<boolean>;
    onChange?: (v: boolean) => void;
    error?: ReadSignal<string | null>;
    disabled?: boolean;
    name?: string;
    id?: string;
    label?: Child;
}

export function Checkbox({
    value,
    onChange,
    error,
    disabled = false,
    name,
    id,
    label,
}: CheckboxProps) {
    const checked = value.get();
    const hasError = !!(error && error.get());

    const inputAttributes: Record<string, unknown> = {
        type: 'checkbox',
        style: css({
            width: '16px',
            height: '16px',
            margin: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            accentColor: tokens.color.accent,
            outline: hasError ? `1px solid ${tokens.color.danger}` : 'none',
            outlineOffset: hasError ? '2px' : '0',
        }),
    };
    if (checked) inputAttributes.checked = '';
    if (name !== undefined) inputAttributes.name = name;
    if (id !== undefined) inputAttributes.id = id;

    const input = createElement('input', {
        disabled,
        checked,
        onchange: (e: Event) => {
            const next = (e.target as HTMLInputElement).checked;
            value.set(next);
            onChange?.(next);
        },
        attributes: inputAttributes,
    });

    if (label === undefined) return input;

    return createElement('label', {
        attributes: {
            style: css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: tokens.space.sm,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: tokens.font.family,
                fontSize: tokens.font.md,
                color: tokens.color.text,
                opacity: disabled ? '0.6' : '1',
            }),
        },
    }, input, label);
}
