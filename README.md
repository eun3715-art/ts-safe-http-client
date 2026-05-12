<h1 align="center">ts-safe-http-client</h1>

<p align="center">
  A type-safe, resilient HTTP client wrapper for TypeScript — built on <code>fetch</code> with Zod validation, automatic retries, and timeout control.
</p>

<p align="center">
  <a href="https://github.com/eun3715-art/ts-safe-http-client/actions"><img src="https://github.com/eun3715-art/ts-safe-http-client/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Zod-validated-ef4444?logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/license-MIT-22c55e" alt="MIT License" />
</p>

---

## Overview

`ts-safe-http-client` wraps the native `fetch` API to give you **predictable, validated HTTP responses** even on unreliable networks.

```
safeFetch(url, ZodSchema, options?, maxRetry?)
   │
   ├─ AbortController timeout
   ├─ Zod runtime validation
   └─ Auto-retry on 5xx / timeout (linear backoff)
```

---

## Features

| Feature | Details |
|---|---|
| **Runtime validation** | Zod schema parses every response — type mismatches throw immediately |
| **Auto retry** | Retries on `5xx` and `AbortError` with 1 s · 2 s · 3 s linear backoff |
| **Timeout control** | Per-request timeout via `AbortController`; throws a clear `Timeout exceeded` error |
| **Retry hook** | `onRetry` callback lets you log or observe each retry attempt |
| **Zero runtime deps** | Only peer dependency is `zod` |

---

## Installation

```bash
npm install ts-safe-http-client zod
```

---

## Usage

```ts
import { safeFetch, SafeFetchOptions } from 'ts-safe-http-client';
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().positive(),
});

const options: SafeFetchOptions = {
  timeout: 3000,
  onRetry: (attempt, delay, retriesLeft) => {
    console.log(`Retry #${attempt} in ${delay}ms — ${retriesLeft} left`);
  },
};

const product = await safeFetch(
  'https://api.example.com/products/1',
  ProductSchema,
  options,
  3, // maxRetry
);

console.log(product.name); // fully typed: { id, name, price }
```

---

## API Reference

### `safeFetch<T>(url, schema, options?, maxRetry?)`

```ts
safeFetch<T>(
  url: string,
  schema: ZodType<T>,
  options?: SafeFetchOptions,
  maxRetry?: number       // default: 3
): Promise<T>
```

#### `SafeFetchOptions`

Extends the native `RequestInit` with two additions:

```ts
interface SafeFetchOptions extends RequestInit {
  timeout?: number;  // ms, default: 5000
  onRetry?: (attempt: number, delay: number, retriesLeft: number) => void;
}
```

---

## Error Handling

```
Request
  │
  ├─ 2xx ──► Zod parse ──► success / ZodError (no retry)
  │
  ├─ 4xx ──► throw immediately (no retry)
  │
  ├─ 5xx ──► retry → … → throw on exhaustion
  │
  └─ Timeout / AbortError ──► retry → … → "Timeout (Xms) exceeded"
```

| Condition | Retried? |
|---|---|
| `5xx` server error | Yes |
| Network timeout (`AbortError`) | Yes |
| `4xx` client error | No |
| Zod validation failure | No |
| Generic network error | No |

---

## Project Structure

```
src/
 └─ HttpClient.ts        core logic — safeFetch, RetryableError, types

test/
 └─ client.test.ts       8 Jest test cases

.github/workflows/
 └─ main.yml             CI: build + test on every push & PR
```

---

## Testing

Eight test cases cover the critical paths:

| Test case | Behaviour verified |
|---|---|
| Happy path | Schema validated, data returned |
| 5xx → retry → success | Recovers on transient server error |
| Timeout → retry → success | Recovers after AbortError |
| Timeout exhausted | Throws `Timeout exceeded` |
| 4xx response | Throws immediately, no retry |
| 5xx exhausted | Throws after all retries consumed |
| Schema mismatch | Zod error thrown, no retry |
| Network error | Throws immediately, no retry |

```bash
npm test          # run once
npm run test:watch  # watch mode
```

---

## License

[MIT](LICENSE)
