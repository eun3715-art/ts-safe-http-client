<h1 align="center">ts-safe-http-client</h1>

<p align="center">
  타입 안전성과 네트워크 안정성을 함께 챙기는 TypeScript fetch 래퍼
</p>

<p align="center">
  <a href="https://github.com/eun3715-art/ts-safe-http-client/actions"><img src="https://github.com/eun3715-art/ts-safe-http-client/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Zod-validated-ef4444" alt="Zod" />
  <img src="https://img.shields.io/badge/license-MIT-22c55e" alt="MIT License" />
</p>

---

## 왜 만들었나

API 응답은 믿을 수 없다. 스펙이 바뀌거나, 서버가 잠깐 죽거나, 네트워크가 느려지거나. 그때마다 매번 try-catch에 retry 로직을 직접 짜는 건 반복 작업이다.

`safeFetch` 하나로 아래 세 가지를 묶었다.

- **Zod 응답 검증** — 타입이 맞지 않으면 런타임에서 즉시 잡아낸다
- **자동 재시도** — 5xx나 타임아웃이면 알아서 재시도한다
- **타임아웃 제어** — `AbortController`로 요청 시간을 직접 관리한다

---

## 설치

```bash
npm install ts-safe-http-client zod
```

---

## 사용법

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

console.log(product.name); // 타입 완전히 추론됨
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

네이티브 `RequestInit`을 그대로 확장한다. 추가 옵션은 두 가지다.

```ts
interface SafeFetchOptions extends RequestInit {
  timeout?: number;   // ms 단위, 기본값: 5000
  onRetry?: (attempt: number, delay: number, retriesLeft: number) => void;
}
```

---

## 에러 처리 규칙

재시도 여부가 헷갈릴 수 있어서 명확하게 정리했다.

| 상황 | 재시도 | 비고 |
|---|:---:|---|
| 5xx 서버 오류 | O | 1s → 2s → 3s 간격 |
| 타임아웃 (AbortError) | O | 1s → 2s → 3s 간격 |
| 4xx 클라이언트 오류 | X | 즉시 throw |
| Zod 검증 실패 | X | 즉시 throw |
| 네트워크 에러 | X | 즉시 throw |

---

## 테스트

정상 케이스부터 예외 케이스까지 8가지 시나리오를 검증한다.

```bash
npm test
```

```
✓ 정상 응답이면 스키마 검증 후 데이터를 반환한다
✓ 5xx 응답이면 재시도 후 성공할 수 있다
✓ 타임아웃이 발생하면 재시도 후 성공할 수 있다
✓ 재시도 소진 후 타임아웃이면 에러를 던진다
✓ 4xx 응답이면 재시도 없이 즉시 에러를 던진다
✓ 5xx 응답에서 재시도를 모두 소진하면 에러를 던진다
✓ 스키마 검증 실패 시 에러를 던진다
✓ 네트워크 에러는 재시도 없이 즉시 던진다
```

---

## 구조

```
src/
 └─ HttpClient.ts     safeFetch 구현체, 타입 정의

test/
 └─ client.test.ts    Jest 테스트

.github/workflows/
 └─ main.yml          push/PR마다 빌드 + 테스트 자동 실행
```

---

## 개발하면서 어려웠던 점

`AbortController` + fake timers + Jest 조합이 생각보다 까다로웠다. 로컬에서는 잘 되다가 CI에서 타이머 동작이 달라 테스트가 깨지는 상황이 반복됐다.

결국 fake timers 사용을 최소화하고, mock fetch에서 abort 이벤트를 직접 시뮬레이션하는 방식으로 해결했다. 덕분에 실제 환경과 테스트 환경 사이의 간극이 훨씬 줄었다.

---

## 라이선스

[MIT](LICENSE)
