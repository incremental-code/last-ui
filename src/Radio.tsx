import { createElement } from '@incremental-code/last-act';
import type { Child, ReadSignal, WriteSignal } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface RadioProps {
    value: WriteSignal<string>;
    name: string;
    option: string;
    onChange?: (v: string) => void;
    error?: ReadSignal<string | null>;
    disabled?: boolean;
    id?: string;
    label?: Child;
}

export function Radio({
    value,
    name,
    option,
    onChange,
    error,
    disabled = false,
    id,
    label,
}: RadioProps) {
    const isSelected = value.get() === option;
    const hasError = !!(error && error.get());

    const inputAttributes: Record<string, unknown> = {
        type: 'radio',
        name,
        value: option,
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
    if (isSelected) inputAttributes.checked = '';
    if (id !== undefined) inputAttributes.id = id;

    const input = createElement('input', {
        disabled,
        checked: isSelected,
        onchange: (e: Event) => {
            if ((e.target as HTMLInputElement).checked) {
                value.set(option);
                onChange?.(option);
            }
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
