import { createElement } from '@incremental-code/last-act';
import type { ReadSignal, WriteSignal } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface NumberInputProps {
    value: WriteSignal<number>;
    onChange?: (v: number) => void;
    error?: ReadSignal<string | null>;
    disabled?: boolean;
    name?: string;
    id?: string;
    placeholder?: string;
    step?: number;
    min?: number;
    max?: number;
}

export function NumberInput({
    value,
    onChange,
    error,
    disabled = false,
    name,
    id,
    placeholder,
    step,
    min,
    max,
}: NumberInputProps) {
    const currentValue = value.get();
    const hasError = !!(error && error.get());

    const attributes: Record<string, unknown> = {
        type: 'number',
        value: String(currentValue),
        style: css({
            background: disabled ? tokens.color.surface : tokens.color.bg,
            color: tokens.color.text,
            border: `1px solid ${hasError ? tokens.color.danger : tokens.color.border}`,
            borderRadius: tokens.radius.md,
            padding: `${tokens.space.sm} ${tokens.space.md}`,
            fontFamily: tokens.font.family,
            fontSize: tokens.font.md,
            lineHeight: 1.4,
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
            opacity: disabled ? '0.6' : '1',
        }),
    };
    if (name !== undefined) attributes.name = name;
    if (id !== undefined) attributes.id = id;
    if (placeholder !== undefined) attributes.placeholder = placeholder;
    if (step !== undefined) attributes.step = String(step);
    if (min !== undefined) attributes.min = String(min);
    if (max !== undefined) attributes.max = String(max);

    return createElement('input', {
        disabled,
        oninput: (e: Event) => {
            const raw = (e.target as HTMLInputElement).value;
            const parsed = raw === '' ? NaN : Number(raw);
            if (Number.isNaN(parsed)) return;
            value.set(parsed);
            onChange?.(parsed);
        },
        attributes,
    });
}
