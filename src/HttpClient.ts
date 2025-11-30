// =========================================================================
//1.런타임 응답 검증 (Zod 사용)
//2.자동 재시도 로직 구현
//3.타임아웃 처리 로직 구현
// =========================================================================

import { ZodType } from 'zod'

const DEFAULT_RETRY = 3
const DEFAULT_TIMEOUT = 5000

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export async function safeFetch<T>(
  url: string,
  schema: ZodType<T>,
  options: RequestInit = {},
  retry = DEFAULT_RETRY,
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })

    clearTimeout(timeoutId)

    if (!res.ok) {
      if (res.status >= 500 && retry > 0) {
        throw new Error(`Retryable HTTP error: ${res.status}`)
      }
      throw new Error(`HTTP error: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()
    return schema.parse(json)
  } catch (err) {
    clearTimeout(timeoutId)

    // AbortError는 타임아웃으로 처리
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Timeout (${DEFAULT_TIMEOUT}ms) exceeded`)
    }

    const message = err instanceof Error ? err.message : ''

    const retryable = message.includes('Retryable')

    if (retry > 0 && retryable) {
      const attempt = DEFAULT_RETRY - retry + 1
      const wait = 1000 * attempt

      console.warn(`[safeFetch] retry in ${wait}ms (${retry - 1} left)`)
      await sleep(wait)

      return safeFetch(url, schema, options, retry - 1)
    }

    throw err
  }
}
