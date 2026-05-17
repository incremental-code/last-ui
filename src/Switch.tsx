import { createElement } from '@incremental-code/last-act';
import type { Child, ReadSignal, WriteSignal } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';

export interface SwitchProps {
    value: WriteSignal<boolean>;
    onChange?: (v: boolean) => void;
    error?: ReadSignal<string | null>;
    disabled?: boolean;
    name?: string;
    id?: string;
    label?: Child;
}

const TRACK_WIDTH = 36;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const THUMB_OFFSET = (TRACK_HEIGHT - THUMB_SIZE) / 2;

export function Switch({
    value,
    onChange,
    error,
    disabled = false,
    name,
    id,
    label,
}: SwitchProps) {
    const on = value.get();
    const hasError = !!(error && error.get());

    const inputAttributes: Record<string, unknown> = {
        type: 'checkbox',
        role: 'switch',
        style: css({
            position: 'absolute',
            opacity: '0',
            width: '0',
            height: '0',
            margin: 0,
            pointerEvents: 'none',
        }),
    };
    if (on) inputAttributes.checked = '';
    if (name !== undefined) inputAttributes.name = name;
    if (id !== undefined) inputAttributes.id = id;

    const hiddenInput = createElement('input', {
        disabled,
        checked: on,
        onchange: (e: Event) => {
            const next = (e.target as HTMLInputElement).checked;
            value.set(next);
            onChange?.(next);
        },
        attributes: inputAttributes,
    });

    const track = createElement('span', {
        attributes: {
            'aria-hidden': 'true',
            style: css({
                position: 'relative',
                display: 'inline-block',
                width: `${TRACK_WIDTH}px`,
                height: `${TRACK_HEIGHT}px`,
                background: on ? tokens.color.accent : tokens.color.border,
                borderRadius: `${TRACK_HEIGHT / 2}px`,
                transition: 'background 0.15s ease',
                boxShadow: hasError ? `0 0 0 2px ${tokens.color.danger}` : 'none',
                flexShrink: 0,
            }),
        },
    }, createElement('span', {
        attributes: {
            style: css({
                position: 'absolute',
                top: `${THUMB_OFFSET}px`,
                left: on ? `${TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET}px` : `${THUMB_OFFSET}px`,
                width: `${THUMB_SIZE}px`,
                height: `${THUMB_SIZE}px`,
                background: tokens.color.bg,
                borderRadius: '50%',
                transition: 'left 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }),
        },
    }));

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
    }, hiddenInput, track, label ?? null);
}
