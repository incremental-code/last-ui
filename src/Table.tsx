import { createElement, computed } from '@incremental-code/last-act';
import type { Child, Component, ReadSignal, WriteSignal } from '@incremental-code/last-act';
import { tokens } from './tokens.js';
import { css } from './style.js';
import { Spinner } from './Spinner.js';

export interface SortState {
    columnId: string;
    direction: 'asc' | 'desc';
}

export interface TableColumn<Row> {
    id: string;
    header: Child;
    /** Returns the cell content for this row. */
    cell: (row: Row, index: number) => Child;
    /** Optional column-level sort. When omitted, header is not clickable. */
    sortable?: boolean;
    /** Text alignment for the cell + header. Default 'left'. */
    align?: 'left' | 'center' | 'right';
    /** Optional fixed width. */
    width?: string;
}

export interface TableProps<Row> {
    columns: TableColumn<Row>[];
    rows: ReadSignal<Row[]>;
    /** Total number of rows across all pages. */
    total: ReadSignal<number>;
    /** Current page, 1-indexed. */
    page: WriteSignal<number>;
    pageSize?: number;
    /** Current sort. If omitted, table is unsorted. */
    sort?: WriteSignal<SortState | null>;
    /** Loading state. When true, show a Spinner over the body. */
    loading?: ReadSignal<boolean>;
    /** Row key extractor — required for stable keyed reconciliation. */
    rowKey: (row: Row) => string;
    /** Optional empty-state. */
    emptyState?: Child;
    /** Click handler for a row (whole-row click). */
    onRowClick?: (row: Row) => void;
}

const CELL_PADDING = `${tokens.space.sm} ${tokens.space.md}`;

function chevron(direction: 'asc' | 'desc' | null): string {
    if (direction === 'asc') return ' ▲';
    if (direction === 'desc') return ' ▼';
    return ' ↕';
}

export function Table<Row>(props: TableProps<Row>) {
    const {
        columns,
        rows,
        total,
        page,
        pageSize = 20,
        sort,
        loading,
        rowKey,
        emptyState,
        onRowClick,
    } = props;

    // ---- Header ----
    const headerCells = columns.map(col => {
        const align = col.align ?? 'left';
        const isSortable = !!col.sortable && !!sort;
        const headerStyle: Record<string, string> = {
            textAlign: align,
            padding: CELL_PADDING,
            fontWeight: '600',
            fontSize: tokens.font.sm,
            color: tokens.color.muted,
            borderBottom: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            cursor: isSortable ? 'pointer' : 'default',
        };
        if (col.width) headerStyle.width = col.width;

        // Reactive label that includes the sort chevron when applicable
        const label = isSortable
            ? computed(() => {
                const current = sort!.get();
                const dir = current && current.columnId === col.id ? current.direction : null;
                return [col.header as Child, chevron(dir)];
            })
            : col.header;

        const onclick = isSortable
            ? () => {
                const current = sort!.get();
                if (!current || current.columnId !== col.id) {
                    sort!.set({ columnId: col.id, direction: 'asc' });
                } else if (current.direction === 'asc') {
                    sort!.set({ columnId: col.id, direction: 'desc' });
                } else {
                    sort!.set(null);
                }
            }
            : undefined;

        return createElement('th', {
            attributes: {
                scope: 'col',
                style: css(headerStyle),
                ...(isSortable ? { 'aria-sort': 'none', role: 'columnheader' } : {}),
            },
            onclick,
        }, label as Child);
    });

    // ---- Body rows ----
    const body = computed(() => {
        const list = rows.get();
        if (list.length === 0) {
            const isLoading = loading ? loading.get() : false;
            if (isLoading) return [] as Child[];
            const fallback = emptyState ?? 'No results';
            return [
                createElement('tr', { key: '__empty' },
                    createElement('td', {
                        attributes: {
                            colspan: String(columns.length),
                            style: css({
                                padding: tokens.space.xl,
                                textAlign: 'center',
                                color: tokens.color.muted,
                                fontFamily: tokens.font.family,
                                fontSize: tokens.font.md,
                            }),
                        },
                    }, fallback as Child),
                ),
            ];
        }
        return list.map((row, index) => {
            const key = rowKey(row);
            const cells = columns.map(col => {
                const align = col.align ?? 'left';
                return createElement('td', {
                    attributes: {
                        style: css({
                            padding: CELL_PADDING,
                            textAlign: align,
                            borderBottom: `1px solid ${tokens.color.border}`,
                            fontFamily: tokens.font.family,
                            fontSize: tokens.font.md,
                            color: tokens.color.text,
                            verticalAlign: 'middle',
                        }),
                    },
                }, col.cell(row, index));
            });
            return createElement('tr', {
                key,
                onclick: onRowClick ? () => onRowClick(row) : undefined,
                attributes: {
                    style: css({
                        cursor: onRowClick ? 'pointer' : 'default',
                    }),
                },
            }, cells);
        });
    });

    // ---- Loading overlay opacity for tbody ----
    const tbodyStyle = computed(() => css({
        opacity: loading && loading.get() ? '0.5' : '1',
        transition: 'opacity 120ms ease',
    }));

    // ---- Paginator ----
    const totalPages = computed(() => Math.max(1, Math.ceil(total.get() / pageSize)));

    const goPrev = () => {
        const p = page.get();
        if (p > 1) page.set(p - 1);
    };
    const goNext = () => {
        const p = page.get();
        const max = totalPages.get();
        if (p < max) page.set(p + 1);
    };

    const prevDisabled = computed(() => page.get() <= 1);
    const nextDisabled = computed(() => page.get() >= totalPages.get());

    const footerLabel = computed(() => {
        const p = page.get();
        const max = totalPages.get();
        const t = total.get();
        return `Page ${p} of ${max} · ${t} total`;
    });

    const pagerButton = (label: string, onclick: () => void, disabled: ReadSignal<boolean>) => {
        const styleSignal = computed(() => css({
            background: tokens.color.bg,
            color: tokens.color.text,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            padding: `${tokens.space.xs} ${tokens.space.md}`,
            fontFamily: tokens.font.family,
            fontSize: tokens.font.sm,
            cursor: disabled.get() ? 'not-allowed' : 'pointer',
            opacity: disabled.get() ? '0.5' : '1',
        }));
        const disabledSignal = computed(() => disabled.get());
        return createElement('button', {
            type: 'button',
            onclick: () => { if (!disabled.get()) onclick(); },
            disabled: disabledSignal,
            attributes: {
                style: styleSignal,
            },
        }, label);
    };

    const footer = createElement('div', {
        attributes: {
            style: css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: tokens.space.md,
                padding: `${tokens.space.sm} ${tokens.space.md}`,
                borderTop: `1px solid ${tokens.color.border}`,
                background: tokens.color.surface,
                fontFamily: tokens.font.family,
                fontSize: tokens.font.sm,
                color: tokens.color.muted,
            }),
        },
    },
        createElement('span', null, footerLabel),
        createElement('div', {
            attributes: {
                style: css({ display: 'flex', gap: tokens.space.sm }),
            },
        },
            pagerButton('Prev', goPrev, prevDisabled),
            pagerButton('Next', goNext, nextDisabled),
        ),
    );

    // ---- Loading overlay (spinner) ----
    const overlay = computed(() => {
        if (!loading || !loading.get()) return null;
        return createElement('div', {
            key: '__loading_overlay',
            attributes: {
                style: css({
                    position: 'absolute',
                    inset: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }),
            },
        }, createElement(Spinner as unknown as Component, { size: 'md' }));
    });

    // ---- Assemble ----
    const table = createElement('table', {
        attributes: {
            style: css({
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: tokens.font.family,
            }),
        },
    },
        createElement('thead', null,
            createElement('tr', null, headerCells),
        ),
        createElement('tbody', {
            attributes: { style: tbodyStyle },
        }, body),
    );

    return createElement('div', {
        attributes: {
            style: css({
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                overflow: 'hidden',
                background: tokens.color.bg,
            }),
        },
    },
        createElement('div', {
            attributes: {
                style: css({
                    position: 'relative',
                    width: '100%',
                    overflowX: 'auto',
                }),
            },
        }, table, overlay),
        footer,
    );
}
