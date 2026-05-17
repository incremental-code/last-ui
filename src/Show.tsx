import { computed } from '@incremental-code/last-act';
import type { Child, ReadSignal } from '@incremental-code/last-act';

export interface ShowProps<T> {
    /** A signal whose value drives the branch. Falsy values render `fallback`. */
    when: ReadSignal<T>;
    /** Rendered when `when` is falsy. Defaults to nothing. */
    fallback?: Child;
    /** A vnode, or a function called with the (truthy) value. */
    children?: Child | ((value: NonNullable<T>) => Child);
}

/**
 * Reactive conditional: subscribes to `when` and renders `children` when
 * truthy, otherwise `fallback`. When `children` is a function it's called
 * with the unwrapped value.
 *
 * Returns a Signal.Computed so the surrounding parent re-renders on change.
 */
export function Show<T>({ when, fallback, children }: ShowProps<T>) {
    return computed(() => {
        const value = when.get();
        if (!value) return (fallback ?? null) as Child;
        return typeof children === 'function'
            ? (children as (v: NonNullable<T>) => Child)(value as NonNullable<T>)
            : (children ?? null) as Child;
    });
}
