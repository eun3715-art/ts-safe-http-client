# ts-safe-http-client

타입 안정성과 예측 가능한 HTTP 통신을 위해 구성한 TypeScript 기반 HTTP
클라이언트 래퍼입니다.

------------------------------------------------------------------------

## 프로젝트 개요

`ts-safe-http-client`는 네트워크가 불안정할 때도 잘 동작하는 fetch 래퍼입니다. 
`safeFetch` 하나로 아래 기능을 통합 제공합니다.

- 응답 데이터 검증 (Zod 기반)
- 요청 타임아웃 제어
- 자동 재시도 및 오류 복구

------------------------------------------------------------------------

## 프로젝트 구조
```txt
src
 └─ HttpClient.ts      # 핵심 HTTP 클라이언트 로직 + 타입 정의

test
 └─ client.test.ts     # Jest 기반 테스트

.github
 └─ workflows
     └─ main.yml       # CI 자동 테스트
```

### main.yml 역할

CI(CI/CD) 환경에서 아래 작업을 자동으로 수행합니다.

- Node 버전 설정
- TypeScript 빌드 검증
- Jest 테스트 자동 실행
- 코드 변경 시 피드백 제공

즉, PR을 올리거나 main 브랜치에 push될 때 코드가 깨지지 않았는지
자동으로 검사하는 안전장치 역할을 합니다.

------------------------------------------------------------------------

## 핵심 기능

### 1. 런타임 응답 검증

Zod 스키마로 응답 데이터를 즉시 검증하여, 구조 불일치로 인한 런타임
오류를 방지합니다.

### 2. 자동 복구 및 재시도

아래 상황에서 재시도를 진행합니다.

- 서버 오류 (5xx)
- 네트워크 타임아웃 (`AbortError`)

실패하면 1초, 2초, 3초 간격으로 재시도합니다.

### 3. 타임아웃 처리

`AbortController`를 통한 요청 취소로, 지정된 시간 내 응답이 없으면
`Timeout exceeded` 에러를 던집니다.

------------------------------------------------------------------------

## 설치

```bash
npm install ts-safe-http-client zod
```

------------------------------------------------------------------------

## 사용 예시

```ts
import { safeFetch, SafeFetchOptions } from 'ts-safe-http-client';
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().positive(),
});

type Product = z.infer<typeof ProductSchema>;

async function fetchProductData(productId: number) {
  const url = `https://api.myapp.com/products/${productId}`;

  const options: SafeFetchOptions = {
    headers: { 'X-Custom-Header': 'Client-V1' },
    timeout: 1500,
  };

  try {
    const product = await safeFetch(url, ProductSchema, options, 2);
    console.log(`상품명: ${product.name}`);
    return product;
  } catch (error: any) {
    console.error('데이터 통신 실패:', error.message);
    throw error;
  }
}
```

------------------------------------------------------------------------

## API 레퍼런스

### `safeFetch<T>()`

```ts
safeFetch<T>(
  url: string,
  schema: ZodSchema<T>,
  options?: SafeFetchOptions,
  retryCount?: number
): Promise<T>
```

### Parameters

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `url` | `string` | 요청할 API 엔드포인트 |
| `schema` | `ZodSchema<T>` | 응답 데이터 검증용 스키마 |
| `options` | `SafeFetchOptions` | fetch 옵션 (timeout, headers 등) |
| `retryCount` | `number` | 재시도 횟수 (기본값: 3) |

### SafeFetchOptions

```ts
interface SafeFetchOptions extends RequestInit {
  timeout?: number;
}
```

------------------------------------------------------------------------

## 에러 처리

### 재시도 대상
- 서버 에러 (5xx)
- 네트워크 장애
- 타임아웃 (`AbortError`)

### 즉시 실패
- Zod 스키마 검증 실패
- 4xx 클라이언트 에러
- 재시도 횟수 소진

------------------------------------------------------------------------

## 테스트

Jest 테스트에서 다음을 검증합니다.

- 스키마 검증
- 5xx 응답 후 재시도 + 성공
- 타임아웃 후 재시도 + 성공
- 재시도 소진 후 명확한 에러 발생

### 테스트 실행

```bash
npm test
```

------------------------------------------------------------------------

## 개발 과정에서의 교훈

이 프로젝트는 "재시도 + 타임아웃 + fetch + AbortController" 조합을
안정적으로 테스트하는 것이 가장 큰 난관이었습니다.

### 어려웠던 점

- Jest fake timers와 AbortController의 충돌
- 로컬과 CI(GitHub Actions)환경의 타이머 동작의 차이

### 극복 방법

- fake timers 사용 최소화
- mock fetch 기반 응답 시뮬레이션
- 타임아웃 및 서버 오류를 테스트 코드에서 명확히 정의

이 과정 덕분에 실제 브라우저 환경에서도 예측 가능하며 견고한 fetch
래퍼가 완성되었습니다.

------------------------------------------------------------------------

## 라이선스

MIT License
