import { ZodType } from 'zod'

const DEFAULT_RETRY = 3
const DEFAULT_TIMEOUT = 5000

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

class RetryableError extends Error {
  constructor(status: number) {
    super(`Server error: ${status}`)
    this.name = 'RetryableError'
  }
}

export interface SafeFetchOptions extends RequestInit {
  timeout?: number
  onRetry?: (attempt: number, delay: number, retriesLeft: number) => void
}

export async function safeFetch<T>(
  url: string,
  schema: ZodType<T>,
  options: SafeFetchOptions = {},
  maxRetry = DEFAULT_RETRY,
): Promise<T> {
  return fetchWithRetry(url, schema, options, maxRetry, 1)
}

async function fetchWithRetry<T>(
  url: string,
  schema: ZodType<T>,
  options: SafeFetchOptions,
  retriesLeft: number,
  attempt: number,
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, onRetry, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(url, { ...fetchOptions, signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) {
      if (res.status >= 500 && retriesLeft > 0) {
        throw new RetryableError(res.status)
      }
      throw new Error(`HTTP error: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()
    return schema.parse(json)
  } catch (err) {
    clearTimeout(timeoutId)

    const isAbort = err instanceof Error && err.name === 'AbortError'
    const isRetryable = isAbort || err instanceof RetryableError

    if (retriesLeft > 0 && isRetryable) {
      const delay = 1000 * attempt
      onRetry?.(attempt, delay, retriesLeft - 1)
      await sleep(delay)
      return fetchWithRetry(url, schema, options, retriesLeft - 1, attempt + 1)
    }

    if (isAbort) {
      throw new Error(`Timeout (${timeout}ms) exceeded`)
    }

    throw err
  }
}
