import { signal, computed } from '@incremental-code/last-act';
import type { ReadSignal, WriteSignal } from '@incremental-code/last-act';

export type Validator<T> = (value: T) => string | null;

export interface FieldSpec<T> {
    initial: T;
    validate?: Validator<T>[];
}

export interface FormField<T> {
    value: WriteSignal<T>;
    error: ReadSignal<string | null>;
    touched: WriteSignal<boolean>;
    /** Mark this field as touched (typically wired to onblur). */
    blur(): void;
    /** Reset value to initial and clear touched. */
    reset(): void;
}

type FieldsOf<S extends Record<string, FieldSpec<any>>> = {
    [K in keyof S]: S[K] extends FieldSpec<infer T> ? FormField<T> : never;
};

type ValuesOf<S extends Record<string, FieldSpec<any>>> = {
    [K in keyof S]: S[K] extends FieldSpec<infer T> ? T : never;
};

export interface Form<S extends Record<string, FieldSpec<any>>> {
    fields: FieldsOf<S>;
    submitting: ReadSignal<boolean>;
    submitError: WriteSignal<string | null>;
    /** Validates all fields, marks them touched, calls fn(values) when valid. */
    submit(fn: (values: ValuesOf<S>) => void | Promise<void>): Promise<void>;
    /** Reset all fields and clear submitError. */
    reset(): void;
}

export function useForm<S extends Record<string, FieldSpec<any>>>(spec: S): Form<S> {
    const fields = {} as FieldsOf<S>;
    const submitting = signal(false);
    const submitError = signal<string | null>(null);

    for (const key of Object.keys(spec) as (keyof S)[]) {
        const fieldSpec = spec[key];
        const value = signal(fieldSpec.initial);
        const touched = signal(false);
        const validators = fieldSpec.validate ?? [];

        const error = computed<string | null>(() => {
            if (!touched.get()) return null;
            const v = value.get();
            for (const validate of validators) {
                const result = validate(v);
                if (result) return result;
            }
            return null;
        });

        (fields as any)[key] = {
            value,
            error,
            touched,
            blur() { touched.set(true); },
            reset() {
                value.set(fieldSpec.initial);
                touched.set(false);
            },
        } satisfies FormField<typeof fieldSpec.initial>;
    }

    function collectValues(): ValuesOf<S> {
        const out = {} as ValuesOf<S>;
        for (const key of Object.keys(spec) as (keyof S)[]) {
            (out as any)[key] = fields[key].value.get();
        }
        return out;
    }

    function isValid(): boolean {
        for (const key of Object.keys(spec) as (keyof S)[]) {
            const f = fields[key];
            const validators = spec[key].validate ?? [];
            const v = f.value.get();
            for (const validate of validators) {
                if (validate(v)) return false;
            }
        }
        return true;
    }

    async function submit(fn: (values: ValuesOf<S>) => void | Promise<void>): Promise<void> {
        for (const key of Object.keys(spec) as (keyof S)[]) {
            fields[key].touched.set(true);
        }
        submitError.set(null);
        if (!isValid()) return;

        submitting.set(true);
        try {
            await fn(collectValues());
        } catch (err) {
            submitError.set(err instanceof Error ? err.message : String(err));
        } finally {
            submitting.set(false);
        }
    }

    function reset() {
        for (const key of Object.keys(spec) as (keyof S)[]) {
            fields[key].reset();
        }
        submitError.set(null);
    }

    return { fields, submitting, submitError, submit, reset };
}

// --- Built-in validators ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function required(message = 'Required'): Validator<unknown> {
    return (v) => {
        if (v === null || v === undefined) return message;
        if (typeof v === 'string' && v.trim() === '') return message;
        if (typeof v === 'boolean' && v === false) return message;
        if (Array.isArray(v) && v.length === 0) return message;
        return null;
    };
}

export function minLength(n: number, message?: string): Validator<string> {
    const msg = message ?? `Must be at least ${n} characters`;
    return (v) => (typeof v === 'string' && v.length >= n ? null : msg);
}

export function maxLength(n: number, message?: string): Validator<string> {
    const msg = message ?? `Must be at most ${n} characters`;
    return (v) => (typeof v === 'string' && v.length <= n ? null : msg);
}

export function email(message = 'Enter a valid email'): Validator<string> {
    return (v) => {
        if (typeof v !== 'string' || v === '') return null;
        return EMAIL_RE.test(v) ? null : message;
    };
}

export function match(regex: RegExp, message: string): Validator<string> {
    return (v) => (typeof v === 'string' && regex.test(v) ? null : message);
}

export function custom<T>(predicate: (v: T) => boolean, message: string): Validator<T> {
    return (v) => (predicate(v) ? null : message);
}
