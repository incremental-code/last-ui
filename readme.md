# Last UI

A small TypeScript component library for the [last-act](../last-act) / [last-router](../last-router) stack.

## Components

- `Container` — max-width centered wrapper
- `Stack` — vertical flex layout
- `Row` — horizontal flex layout
- `Grid` — auto-fit responsive grid
- `Heading` — h1/h2/h3
- `Text` — paragraph (with `muted`, `size`)
- `Button` — `primary` / `secondary` / `danger` variants
- `Card` — bordered surface with shadow
- `Badge` — small inline label
- `Price` — currency-formatted span
- `NavLink` — styled `<a>` for last-router navigation
- `ToastRoot` + `toast` — fixed-position toast stack and imperative toast API

## Styling

Components style themselves via the `attributes: { style: '...' }` path so SSR HTML carries the inline styles. Tokens live in `@incremental-code/last-ui/tokens`.

## Build

```
npm install
npm run build
```

Outputs `dist/*.js` and `dist/*.d.ts`.

## Usage

```tsx
import { createElement } from '@incremental-code/last-act';
import { Container, Heading, Stack, Card, Price, Button } from '@incremental-code/last-ui';

export default function Page() {
    return <Container>
        <Stack gap="lg">
            <Heading>Storefront</Heading>
            <Card>
                <Price cents={2999} />
                <Button onClick={() => alert('cart')}>Add to cart</Button>
            </Card>
        </Stack>
    </Container>;
}
```

## Server-rendered forms

`Field`, `Input`, and `Textarea` work in SSR-first routes as styled wrappers around native HTML forms. Use native browser validation plus server-returned `fieldErrors` for those pages.

`useForm` is for interactive client-side surfaces where signals stay live after render. In a server-only route, function event handlers like `oninput={(e) => ...}` are not serialized into the HTML, so `useForm` will not run there. For SSR-first forms, prefer native `required` / `minlength` / `pattern` attributes and feed server validation back into `Field.error`.

`Select` and `Table` are also client-reactive primitives today; for plain POSTed SSR forms, keep using native `<select>` until there is a documented hydration boundary for richer widgets.

```tsx
import { createElement, signal } from '@incremental-code/last-act';
import { Field, Input, Textarea } from '@incremental-code/last-ui';

export default function PostEditor({ values, fieldErrors = {} }: {
    values: { title?: string; body?: string };
    fieldErrors?: { title?: string; body?: string };
}) {
    const title = signal(values.title ?? '');
    const body = signal(values.body ?? '');
    const titleError = signal(fieldErrors.title ?? null);
    const bodyError = signal(fieldErrors.body ?? null);

    return <form method="post">
        <Field
            label="Title"
            htmlFor="post-title"
            required
            hint="Shown in admin lists and public previews."
            hintAttributes={{ id: 'post-title-help' }}
            error={titleError}
            errorAttributes={{ id: 'post-title-error', role: 'alert' }}
        >
            <Input
                id="post-title"
                name="title"
                value={title}
                error={titleError}
                attributes={{
                    required: true,
                    ...(titleError.get() ? { 'aria-invalid': 'true', 'aria-describedby': 'post-title-error' } : {}),
                    ...(!titleError.get() ? { 'aria-describedby': 'post-title-help' } : {}),
                }}
            />
        </Field>

        <Field
            label="Body"
            htmlFor="post-body"
            required
            error={bodyError}
            errorAttributes={{ id: 'post-body-error', role: 'alert' }}
        >
            <Textarea
                id="post-body"
                name="body"
                value={body}
                error={bodyError}
                rows={12}
                attributes={{
                    required: true,
                    ...(bodyError.get() ? { 'aria-invalid': 'true', 'aria-describedby': 'post-body-error' } : {}),
                }}
            />
        </Field>
    </form>;
}
```

## Toasts

Mount `ToastRoot` once near the top of your app, then call `toast.info(...)`, `toast.success(...)`, or `toast.error(...)` from event handlers.

```tsx
import { createElement } from '@incremental-code/last-act';
import { Button, Container, Stack, ToastRoot, toast } from '@incremental-code/last-ui';

export default function Page() {
    return <>
        <ToastRoot position="top-right" />
        <Container>
            <Stack gap="md">
                <Button onClick={() => toast.success('Saved!')}>
                    Save
                </Button>
            </Stack>
        </Container>
    </>;
}
```
