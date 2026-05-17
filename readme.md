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
