import { safeFetch } from '../src/HttpClient'
import { z } from 'zod'

describe('safeFetch', () => {
  const schema = z.object({ message: z.string() })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('정상 응답이면 스키마 검증 후 데이터를 반환한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: 'ok' }),
    })

    const result = await safeFetch('http://test.com', schema)

    expect(result.message).toBe('ok')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('5xx 응답이면 재시도 후 성공할 수 있다', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'recovered' }),
      })

    const result = await safeFetch('http://retry.com', schema, {}, 1)

    expect(result.message).toBe('recovered')
    expect(fetch).toHaveBeenCalledTimes(2)
  }, 10000)

  it('타임아웃이 발생하면 재시도 후 성공할 수 있다', async () => {
    let callCount = 0

    global.fetch = jest.fn().mockImplementation(
      (_url: string, options: { signal?: AbortSignal }) =>
        new Promise((resolve, reject) => {
          callCount++
          if (callCount === 1) {
            if (options?.signal) {
              options.signal.addEventListener('abort', () => {
                const err = new Error('The operation was aborted')
                err.name = 'AbortError'
                reject(err)
              })
            }
          } else {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ message: 'recovered' }),
            })
          }
        })
    )

    const result = await safeFetch('http://timeout.com', schema, { timeout: 50 }, 1)

    expect(result.message).toBe('recovered')
    expect(fetch).toHaveBeenCalledTimes(2)
  }, 10000)

  it('재시도 소진 후 타임아웃이면 에러를 던진다', async () => {
    global.fetch = jest.fn().mockImplementation(
      (_url: string, options: { signal?: AbortSignal }) =>
        new Promise((_, reject) => {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              const err = new Error('The operation was aborted')
              err.name = 'AbortError'
              reject(err)
            })
          }
        })
    )

    await expect(
      safeFetch('http://timeout.com', schema, { timeout: 50 }, 0)
    ).rejects.toThrow(/Timeout/i)

    expect(fetch).toHaveBeenCalledTimes(1)
  })
})