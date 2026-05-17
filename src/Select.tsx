import {
    createElement,
    signal,
    computed,
    effect,
} from '@incremental-code/last-act';
import type {
    Child,
    Component,
    Renderable,
    WriteSignal,
} from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';
import { Popover } from './Popover.js';
import { Input } from './Input.js';
import { Spinner } from './Spinner.js';

export interface SelectOption<V = string> {
    value: V;
    label: Child;
    disabled?: boolean;
}

export interface SelectProps<V = string> {
    value: WriteSignal<V | null>;
    /** Static options. Mutually exclusive with loadOptions. */
    options?: SelectOption<V>[];
    /** Async options. Called on first open and on every search input change (debounced). */
    loadOptions?: (query: string) => Promise<SelectOption<V>[]>;
    /** Debounce window for loadOptions, ms. Default 200. */
    debounceMs?: number;
    placeholder?: string;
    disabled?: boolean;
    /** Render a custom option row (default: label as-is). */
    renderOption?: (opt: SelectOption<V>) => Child;
    /** Render the currently-selected value in the trigger. Default: the option's label or its value. */
    renderValue?: (value: V) => Child;
    /** Searchable trigger when true (default true for async, false for static). */
    searchable?: boolean;
}

const CHEVRON = '▾'; // ▾

export function Select<V = string>(props: SelectProps<V>): Renderable {
    const isAsync = !!props.loadOptions;
    const searchable = props.searchable ?? isAsync;
    const debounceMs = props.debounceMs ?? 200;
    const placeholder = props.placeholder ?? 'Select…';

    const open = signal(false);
    const anchor = signal<HTMLElement | null>(null);
    const query = signal('');
    const loading = signal(false);
    const asyncOptions = signal<SelectOption<V>[]>([]);
    const hasLoadedOnce = signal(false);
    const highlightIndex = signal(0);

    // The effective list of options visible in the menu right now.
    const visibleOptions = computed<SelectOption<V>[]>(() => {
        if (isAsync) return asyncOptions.get();
        const all = props.options ?? [];
        if (!searchable) return all;
        const q = query.get().trim().toLowerCase();
        if (!q) return all;
        return all.filter(o => optionLabelText(o).toLowerCase().includes(q));
    });

    // Debounced async load.
    let loadTimer: ReturnType<typeof setTimeout> | null = null;
    let loadSeq = 0;
    const triggerAsyncLoad = (q: string) => {
        if (!props.loadOptions) return;
        if (loadTimer != null) clearTimeout(loadTimer);
        loadTimer = setTimeout(() => {
            loadTimer = null;
            const seq = ++loadSeq;
            loading.set(true);
            props.loadOptions!(q).then(
                results => {
                    if (seq !== loadSeq) return;
                    asyncOptions.set(results);
                    hasLoadedOnce.set(true);
                    loading.set(false);
                    highlightIndex.set(0);
                },
                () => {
                    if (seq !== loadSeq) return;
                    asyncOptions.set([]);
                    hasLoadedOnce.set(true);
                    loading.set(false);
                },
            );
        }, debounceMs);
    };

    // When opening (async): if we haven't loaded yet, kick off an initial load.
    effect(() => {
        const isOpen = open.get();
        if (!isOpen) return;
        if (isAsync && !hasLoadedOnce.get() && !loading.get()) {
            triggerAsyncLoad(query.get());
        }
    });

    // When the search query changes (async only) re-trigger the debounced load.
    effect(() => {
        if (!isAsync) return;
        // subscribe
        const q = query.get();
        if (!open.get()) return;
        // Don't re-trigger purely from the initial-open effect — that path also
        // calls triggerAsyncLoad. Here we explicitly want it on user typing.
        // hasLoadedOnce flip is fine; debouncer collapses duplicates.
        triggerAsyncLoad(q);
    });

    // Reset highlight when visible options change.
    effect(() => {
        const opts = visibleOptions.get();
        const i = highlightIndex.get();
        if (i >= opts.length) highlightIndex.set(0);
    });

    const closeAndFocus = () => {
        open.set(false);
        const el = anchor.get();
        if (el) (el as HTMLElement).focus();
    };

    const selectOption = (opt: SelectOption<V>) => {
        if (opt.disabled) return;
        props.value.set(opt.value);
        closeAndFocus();
    };

    const moveHighlight = (delta: number) => {
        const opts = visibleOptions.get();
        if (opts.length === 0) return;
        let i = highlightIndex.get();
        for (let attempts = 0; attempts < opts.length; attempts++) {
            i = (i + delta + opts.length) % opts.length;
            if (!opts[i].disabled) {
                highlightIndex.set(i);
                return;
            }
        }
    };

    const onMenuKeydown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveHighlight(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveHighlight(-1);
        } else if (event.key === 'Enter') {
            const opts = visibleOptions.get();
            const opt = opts[highlightIndex.get()];
            if (opt) {
                event.preventDefault();
                selectOption(opt);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            closeAndFocus();
        }
    };

    const onTriggerKeydown = (event: KeyboardEvent) => {
        if (props.disabled) return;
        if (!open.get()) {
            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open.set(true);
            }
            return;
        }
        // When open, forward to the menu handler so the trigger still drives
        // keyboard nav even though focus stays on it (search input within the
        // popover handles its own typing, but ArrowDown/Up/Enter/Escape land
        // on the trigger when there's no search input or when the user hasn't
        // focused it).
        onMenuKeydown(event);
    };

    const onTriggerClick = () => {
        if (props.disabled) return;
        open.set(!open.get());
    };

    // ----- Render trigger -----

    const triggerLabel = computed<Child>(() => {
        const v = props.value.get();
        if (v == null) {
            return createElement('span', {
                attributes: { style: css({ color: tokens.color.muted }) },
            }, placeholder);
        }
        if (props.renderValue) return props.renderValue(v);
        // Try to find matching option label.
        const pool = isAsync ? asyncOptions.get() : (props.options ?? []);
        const match = pool.find(o => o.value === v);
        return match ? match.label : String(v);
    });

    const trigger = createElement('button', {
        type: 'button',
        disabled: props.disabled,
        onclick: onTriggerClick,
        onkeydown: onTriggerKeydown,
        attributes: {
            ref: anchor,
            'aria-haspopup': 'listbox',
            'aria-expanded': computed(() => (open.get() ? 'true' : 'false')),
            style: css({
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: tokens.space.sm,
                width: '100%',
                background: props.disabled ? tokens.color.surface : tokens.color.bg,
                color: tokens.color.text,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                padding: `${tokens.space.sm} ${tokens.space.md}`,
                fontFamily: tokens.font.family,
                fontSize: tokens.font.md,
                cursor: props.disabled ? 'not-allowed' : 'pointer',
                opacity: props.disabled ? '0.6' : '1',
                textAlign: 'left',
                boxSizing: 'border-box',
            }),
        },
    },
        createElement('span', {
            attributes: { style: css({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }) },
        }, triggerLabel),
        createElement('span', {
            attributes: { 'aria-hidden': 'true', style: css({ color: tokens.color.muted }) },
        }, CHEVRON),
    );

    // ----- Render menu -----

    const renderRow = (opt: SelectOption<V>, idx: number) => {
        const isHighlighted = computed(() => highlightIndex.get() === idx);
        const isSelected = computed(() => props.value.get() === opt.value);
        const bg = computed(() => isHighlighted.get() ? tokens.color.surface : tokens.color.bg);
        const fontWeight = computed(() => isSelected.get() ? 600 : 400);

        return createElement('div', {
            role: 'option',
            attributes: {
                'aria-selected': computed(() => (isSelected.get() ? 'true' : 'false')),
                'aria-disabled': opt.disabled ? 'true' : 'false',
                style: computed(() => css({
                    padding: `${tokens.space.sm} ${tokens.space.md}`,
                    borderRadius: tokens.radius.sm,
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    color: opt.disabled ? tokens.color.muted : tokens.color.text,
                    background: bg.get(),
                    fontWeight: fontWeight.get(),
                    fontFamily: tokens.font.family,
                    fontSize: tokens.font.md,
                })),
            },
            onmouseenter: () => { if (!opt.disabled) highlightIndex.set(idx); },
            onmousedown: (e: MouseEvent) => {
                // Prevent the popover's mousedown outside-click handler from
                // running before our click — and prevent search input blur.
                e.preventDefault();
            },
            onclick: () => selectOption(opt),
        }, props.renderOption ? props.renderOption(opt) : opt.label);
    };

    const list = computed<Renderable>(() => {
        const opts = visibleOptions.get();
        if (opts.length === 0) {
            const msg = isAsync ? 'No matches' : 'No options';
            return createElement('div', {
                attributes: {
                    style: css({
                        padding: `${tokens.space.sm} ${tokens.space.md}`,
                        color: tokens.color.muted,
                        fontFamily: tokens.font.family,
                        fontSize: tokens.font.sm,
                    }),
                },
            }, msg);
        }
        return createElement('div', {
            role: 'listbox',
            attributes: {
                style: css({
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    maxHeight: '240px',
                    overflowY: 'auto',
                }),
            },
        }, ...opts.map((o, i) => renderRow(o, i)));
    });

    const searchInputValue = query;
    const searchEl = searchable
        ? createElement('div', {
            attributes: {
                ref: (el: HTMLElement | null) => {
                    if (!el) return;
                    // After the popover opens we want the search input to grab
                    // focus so typing flows there and ArrowDown/Up still work
                    // (we re-dispatch from input keydown via bubble-up to the
                    // menu's keydown handler).
                    queueMicrotask(() => {
                        const input = el.querySelector('input') as HTMLInputElement | null;
                        if (input) input.focus();
                    });
                },
                style: css({
                    padding: tokens.space.xs,
                    borderBottom: `1px solid ${tokens.color.border}`,
                    marginBottom: tokens.space.xs,
                }),
            },
        }, createElement(Input as unknown as Component, {
            value: searchInputValue,
            type: 'search',
            placeholder: 'Search…',
        }))
        : null;

    const loadingRow = isAsync
        ? computed<Renderable>(() => loading.get()
            ? createElement('div', {
                attributes: {
                    style: css({
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.space.sm,
                        padding: `${tokens.space.sm} ${tokens.space.md}`,
                        color: tokens.color.muted,
                        fontFamily: tokens.font.family,
                        fontSize: tokens.font.sm,
                    }),
                },
            }, createElement(Spinner as unknown as Component, { size: 'sm' }), 'Loading…')
            : null)
        : null;

    const menu = createElement('div', {
        onkeydown: onMenuKeydown,
        attributes: {
            style: css({
                minWidth: '180px',
                outline: 'none',
            }),
            tabindex: '-1',
        },
    },
        searchEl,
        loadingRow,
        // Hide the list under loading state for async first load.
        isAsync
            ? computed<Renderable>(() => loading.get() && asyncOptions.get().length === 0 ? null : list.get())
            : list,
    );

    const popover = createElement(Popover as unknown as Component, {
        open,
        anchor,
        onClose: () => open.set(false),
        placement: 'bottom-start',
    }, menu);

    return createElement('span', {
        attributes: { style: css({ display: 'inline-block', width: '100%' }) },
    }, trigger, popover);
}

function optionLabelText<V>(opt: SelectOption<V>): string {
    const l = opt.label;
    if (typeof l === 'string') return l;
    if (typeof l === 'number') return String(l);
    return String(opt.value);
}
