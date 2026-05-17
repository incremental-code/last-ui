import { signal } from '@incremental-code/last-act';
import type { Child, ReadSignal } from '@incremental-code/last-act';

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastEntry {
    id: number;
    kind: ToastKind;
    message: Child;
    durationMs: number;
}

export interface ToastOptions {
    /** Override the default lifetime for this toast. */
    durationMs?: number;
}

const DEFAULTS: Record<ToastKind, number> = {
    info: 4000,
    success: 4000,
    error: 8000,
};

const queue = signal<ToastEntry[]>([]);

/** Read-only view of the current toast queue. Used by <ToastRoot>. */
export const toastQueue: ReadSignal<ToastEntry[]> = queue;

let nextId = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function push(kind: ToastKind, message: Child, opts?: ToastOptions): number {
    const id = nextId++;
    const durationMs = opts?.durationMs ?? DEFAULTS[kind];
    const entry: ToastEntry = { id, kind, message, durationMs };
    queue.set([...queue.get(), entry]);

    if (durationMs > 0 && typeof setTimeout !== 'undefined') {
        const handle = setTimeout(() => dismiss(id), durationMs);
        timers.set(id, handle);
    }
    return id;
}

function dismiss(id: number): void {
    const timer = timers.get(id);
    if (timer !== undefined) {
        clearTimeout(timer);
        timers.delete(id);
    }
    const current = queue.get();
    const next = current.filter(e => e.id !== id);
    if (next.length !== current.length) queue.set(next);
}

export const toast = {
    info: (message: Child, opts?: ToastOptions) => push('info', message, opts),
    success: (message: Child, opts?: ToastOptions) => push('success', message, opts),
    error: (message: Child, opts?: ToastOptions) => push('error', message, opts),
    dismiss,
};
