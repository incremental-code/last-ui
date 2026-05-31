import { createElement, computed } from '@incremental-code/last-act';
import type { Child, ReadSignal } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';
import { Stack } from './Stack.js';
import { Show } from './Show.js';

export interface FieldProps {
    label?: Child;
    hint?: Child;
    error?: ReadSignal<string | null>;
    htmlFor?: string;
    required?: boolean;
    labelAttributes?: Record<string, unknown>;
    hintAttributes?: Record<string, unknown>;
    errorAttributes?: Record<string, unknown>;
    children?: Child;
}

export function Field({
    label,
    hint,
    error,
    htmlFor,
    required = false,
    labelAttributes,
    hintAttributes,
    errorAttributes,
    children,
}: FieldProps) {
    const normalizedChildren = Array.isArray(children)
        ? children
        : (children !== undefined && children !== null ? [children] : []);

    const labelEl = label !== undefined
        ? createElement('label', {
            attributes: {
                ...labelAttributes,
                ...(htmlFor !== undefined ? { for: htmlFor } : {}),
                style: css({
                    fontFamily: tokens.font.family,
                    fontSize: tokens.font.sm,
                    fontWeight: 600,
                    color: tokens.color.text,
                }),
            },
        }, label, required ? createElement('span', {
            attributes: {
                'aria-hidden': 'true',
                style: css({
                    marginLeft: '2px',
                    color: tokens.color.danger,
                }),
            },
        }, '*') : null)
        : null;

    let messageEl: Child = null;
    if (error) {
        const fallback = hint !== undefined
            ? createElement('span', {
                attributes: {
                    ...hintAttributes,
                    style: css({
                        fontFamily: tokens.font.family,
                        fontSize: tokens.font.sm,
                        color: tokens.color.muted,
                    }),
                },
            }, hint)
            : null;

        messageEl = Show({
            when: computed(() => error.get()),
            fallback,
            children: (msg: string) => createElement('span', {
                attributes: {
                    ...errorAttributes,
                    style: css({
                        fontFamily: tokens.font.family,
                        fontSize: tokens.font.sm,
                        color: tokens.color.danger,
                    }),
                },
            }, msg),
        });
    } else if (hint !== undefined) {
        messageEl = createElement('span', {
            attributes: {
                ...hintAttributes,
                style: css({
                    fontFamily: tokens.font.family,
                    fontSize: tokens.font.sm,
                    color: tokens.color.muted,
                }),
            },
        }, hint);
    }

    return Stack({ gap: 'xs', children: [labelEl, ...normalizedChildren, messageEl] });
}
