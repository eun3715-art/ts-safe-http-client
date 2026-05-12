import { z } from 'zod'
import { safeFetch } from './HttpClient'

const sep = (label: string) => console.log(`\n--- ${label} ---`)

async function run() {
  // 1. 정상 응답 + 스키마 검증
  sep('1. 정상 응답')
  const PostSchema = z.object({
    userId: z.number(),
    id: z.number(),
    title: z.string(),
    body: z.string(),
  })

  const post = await safeFetch(
    'https://jsonplaceholder.typicode.com/posts/1',
    PostSchema,
  )
  console.log(`id=${post.id}, title="${post.title.slice(0, 30)}..."`)

  // 2. 스키마 불일치 (실제 응답에 없는 필드를 required로 요구)
  sep('2. 스키마 검증 실패')
  const WrongSchema = z.object({ nonexistent: z.string() })
  try {
    await safeFetch('https://jsonplaceholder.typicode.com/posts/1', WrongSchema)
  } catch (err) {
    console.log('ZodError 발생:', err instanceof Error ? err.name : err)
  }

  // 3. 5xx 재시도 (onRetry 콜백으로 실시간 확인)
  sep('3. 5xx 재시도 (retry=2)')
  try {
    await safeFetch(
      'https://httpbin.org/status/500',
      z.any(),
      {
        onRetry: (attempt, delay, left) =>
          console.log(
            `  [재시도 ${attempt}회] ${delay}ms 대기, 남은 횟수: ${left}`,
          ),
      },
      2,
    )
  } catch (err) {
    console.log('최종 에러:', err instanceof Error ? err.message : err)
  }

  // 4. 4xx는 재시도 없이 즉시 실패
  sep('4. 4xx 즉시 실패')
  try {
    await safeFetch(
      'https://jsonplaceholder.typicode.com/posts/99999',
      PostSchema,
    )
  } catch (err) {
    console.log('에러:', err instanceof Error ? err.message : err)
  }

  // 5. 타임아웃
  sep('5. 타임아웃 (300ms, 5초짜리 응답에 요청)')
  try {
    await safeFetch(
      'https://httpbin.org/delay/5',
      z.any(),
      {
        timeout: 300,
        onRetry: (attempt, delay, left) =>
          console.log(
            `  [재시도 ${attempt}회] ${delay}ms 대기, 남은 횟수: ${left}`,
          ),
      },
      1,
    )
  } catch (err) {
    console.log('에러:', err instanceof Error ? err.message : err)
  }
}

run().catch(console.error)
