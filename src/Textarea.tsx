import { createElement } from '@incremental-code/last-act';
import type { ReadSignal, WriteSignal } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface TextareaProps {
    value: WriteSignal<string>;
    onChange?: (v: string) => void;
    error?: ReadSignal<string | null>;
    disabled?: boolean;
    name?: string;
    id?: string;
    placeholder?: string;
    rows?: number;
}

export function Textarea({
    value,
    onChange,
    error,
    disabled = false,
    name,
    id,
    placeholder,
    rows = 4,
}: TextareaProps) {
    const currentValue = value.get();
    const hasError = !!(error && error.get());

    const attributes: Record<string, unknown> = {
        value: currentValue,
        rows,
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
            resize: 'vertical',
            opacity: disabled ? '0.6' : '1',
        }),
    };
    if (name !== undefined) attributes.name = name;
    if (id !== undefined) attributes.id = id;
    if (placeholder !== undefined) attributes.placeholder = placeholder;

    return createElement('textarea', {
        disabled,
        oninput: (e: Event) => {
            const next = (e.target as HTMLTextAreaElement).value;
            value.set(next);
            onChange?.(next);
        },
        attributes,
    }, currentValue);
}
