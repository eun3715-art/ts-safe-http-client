# ts-safe-http-client
1. 🌟 상단 및 소개
안전성과 신뢰성을 최우선으로 고려한 TypeScript Fetch 래퍼

💡 프로젝트 개요
ts-safe-http-client는 브라우저의 기본 fetch API를 감싸서, 불안정한 네트워크 환경과 예측 불가능한 서버 응답으로부터 애플리케이션을 보호하기 위해 개발되었습니다. 복잡한 비동기 로직 대신, 하나의 간결한 함수(safeFetch)를 통해 데이터 검증, 자동 복구, 타임아웃 처리를 한 번에 해결합니다.

2. ✨ 핵심 기능 (Why Use?)
✨ 핵심 기능
내가 이 클라이언트에 집중해서 구현한 세 가지 주요 특징입니다.

1. 🛡️ 런타임 응답 검증 (Zod-powered)
문제 해결: fetch 통신 성공 후에도 서버가 잘못된 형태의 JSON을 보낼 경우, 클라이언트에서 타입 에러(예: undefined에 접근)가 발생합니다.

해결책: Zod 스키마를 통해 응답 데이터를 런타임에 즉시 검증합니다. 데이터 불일치 발생 시, 안전하게 파싱 오류를 던져 애플리케이션의 다운타임을 방지합니다.

2. 🔁 자동 복구 및 재시도 (Retry Mechanism)
문제 해결: 일시적인 네트워크 불안정이나 서버 부하로 인한 오류(5xx 상태 코드, 타임아웃)는 한 번의 재시도로 해결될 수 있습니다.

해결책: 타임아웃 오류와 5xx 서버 에러를 모두 재시도 가능한 오류로 분류합니다. retry 횟수(기본 3회)가 남아 있다면, 점진적으로 대기 시간을 늘리며 자동으로 요청을 다시 시도합니다.

3. ⏱️ 명확한 타임아웃 처리
문제 해결: 네트워크 지연으로 요청이 무한정 대기하는 것을 방지해야 합니다.

해결책: options로 지정된 시간(timeout)을 초과하면 **AbortController**를 통해 요청을 강제로 중단합니다. 이는 Timeout exceeded 오류로 변환되어 즉시 처리됩니다.

3. 🛠️ 설치 및 사용법
🛠️ 시작하기
1. 설치
ts-safe-http-client는 타입 검증을 위해 zod에 의존합니다.

Bash

npm install ts-safe-http-client zod
# or
yarn add ts-safe-http-client zod
2. 사용 예시
safeFetch는 url, schema, options, retry 네 가지 인자를 받습니다.

TypeScript

import { safeFetch, SafeFetchOptions } from 'ts-safe-http-client';
import { z } from 'zod';

// 1. 응답 스키마 정의
const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().positive(),
});

type Product = z.infer<typeof ProductSchema>;

async function fetchProductData(productId: number) {
  const url = `https://api.myapp.com/products/${productId}`;
  
  const options: SafeFetchOptions = {
    // [RequestInit] 헤더, 캐시 등 fetch 옵션
    headers: { 'X-Custom-Header': 'Client-V1' },
    // [SafeFetchOptions] 커스텀 타임아웃 설정 (500ms)
    timeout: 500, 
  };
  
  try {
    // ⭐️ 2회 재시도 (총 3회 시도 가능)
    const product = await safeFetch(url, ProductSchema, options, 2); 
    
    console.log(`상품명: ${product.name}`);
    return product;
    
  } catch (error) {
    // 타임아웃, 5xx 에러, Zod 에러 등 모든 최종 오류를 여기서 처리
    console.error('데이터 통신 실패:', error.message);
    throw error;
  }
}
4. 🧪 테스트
🧪 테스트
Jest 환경에서 safeFetch의 핵심 로직을 검증합니다. 특히 복잡한 타임아웃 및 재시도 로직이 예상대로 작동하는지 세밀하게 테스트했습니다.

Bash

npm test
