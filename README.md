# ts-safe-http-client

Zod 스키마 검증 + 자동 재시도 + 타임아웃 제어를 묶은 TypeScript fetch 래퍼.

---

## 구조

```
ts-safe-http-client/
├── src/
│   └── HttpClient.ts     # safeFetch 구현체, 타입 정의
├── test/
│   └── client.test.ts    # Jest 테스트 (8개 케이스)
└── .github/workflows/
    └── main.yml          # CI: push/PR마다 빌드 + 테스트 자동 실행
```

---

## 시작하기

### 1. 패키지 설치

```bash
npm install ts-safe-http-client zod
```

### 2. 사용 예시

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
    console.log(`재시도 ${attempt}회차 — ${delay}ms 후 재요청 (남은 횟수: ${retriesLeft})`);
  },
};

const product = await safeFetch(
  'https://api.example.com/products/1',
  ProductSchema,
  options,
);
```

---

## API

### `safeFetch<T>(url, schema, options?, maxRetry?)`

```ts
safeFetch<T>(
  url: string,
  schema: ZodType<T>,
  options?: SafeFetchOptions,
  maxRetry?: number        // 기본값: 3
): Promise<T>
```

### `SafeFetchOptions`

```ts
interface SafeFetchOptions extends RequestInit {
  timeout?: number;   // ms 단위, 기본값: 5000
  onRetry?: (attempt: number, delay: number, retriesLeft: number) => void;
}
```

---

## 에러 처리

| 상황 | 재시도 | 비고 |
|---|:---:|---|
| 5xx 서버 오류 | O | 1s → 2s → 3s 간격 |
| 타임아웃 (AbortError) | O | 1s → 2s → 3s 간격 |
| 4xx 클라이언트 오류 | X | 즉시 throw |
| Zod 검증 실패 | X | 즉시 throw |
| 네트워크 에러 | X | 즉시 throw |

---

## 테스트

```bash
npm test
```

---

## 동작 흐름

```
safeFetch(url, schema, options)
  -> AbortController     : timeout 설정
  -> fetch               : 요청 전송
  -> res.ok 체크         : 4xx 즉시 throw / 5xx RetryableError
  -> schema.parse(json)  : Zod 검증 실패 시 즉시 throw
  -> 재시도 가능 에러     : sleep 후 fetchWithRetry 재귀 호출
  -> 재시도 소진          : 최종 에러 throw
```

---

## 라이선스

[MIT](LICENSE)
