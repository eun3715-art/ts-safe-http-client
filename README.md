# TS Safe HTTP Client

`ts-safe-http-client`는 네트워크 요청 시 반복적으로 작성해야 하는 타임아웃, 재시도, 응답 스키마 검증 로직을 일관된 방식으로 제공하는 TypeScript 기반 HTTP 유틸리티입니다.  
런타임 안정성과 타입 안전성을 동시에 확보하는 것을 목표로 합니다.

---

## 📌 주요 기능

### 1. 런타임 응답 검증 (Zod)
서버 응답 스키마를 Zod로 검증하여 예기치 않은 런타임 오류를 방지합니다.

### 2. 자동 재시도 (5xx + Timeout)
- 5xx 서버 오류  
- 요청 타임아웃(AbortError)

위 상황에서 자동으로 재시도합니다.  
요청 횟수는 기본 3회이며, 요청마다 대기 시간이 증가하는 방식(exponential-ish backoff)을 사용합니다.

### 3. 요청 타임아웃
기본 타임아웃은 5초이며, 초과 시 요청은 `AbortController`로 취소됩니다.

### 4. TypeScript 기반의 타입 안전성
스키마에서 타입이 자동 추론되므로 정적 타입 안정성과 런타임 검증을 동시에 제공합니다.

---

## 📦 설치

```bash
npm install ts-safe-http-client
```
📚 사용 예제
```
import { safeFetch } from './HttpClient'
import { z } from 'zod'

const schema = z.object({
  message: z.string(),
})

async function main() {
  const result = await safeFetch(
    'https://example.com/api',
    schema,
    { timeout: 3000 }
  )

  console.log(result.message)
}
```
🧩 API

safeFetch(url, schema, options?, retry?)
url - 요청 URL
schema - Zod 스키마 객체
options - fetch 옵션 + { timeout?: number }
retry - 재시도 횟수 (기본값 3)

옵션 타입
interface SafeFetchOptions extends RequestInit {
  timeout?: number   // 기본값: 5000ms
}

🧪 테스트

다음 시나리오를 검증합니다:
	•	정상 응답 처리
	•	5xx 오류 발생 후 재시도 성공
	•	타임아웃 발생 후 재시도 성공
	•	재시도 횟수 소진 후 오류 반환
npm test

📄 License
MIT License
