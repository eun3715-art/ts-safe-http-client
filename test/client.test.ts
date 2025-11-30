import { safeFetch } from '../src/HttpClient';
import { z } from 'zod';

describe('safeFetch', () => {
  const schema = z.object({ message: z.string() });

  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('정상 응답이면 스키마 검증 후 데이터를 반환한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: 'ok' })
    });

    const result = await safeFetch('http://test.com', schema);

    expect(result.message).toBe('ok');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('5xx 응답이면 재시도 후 성공할 수 있다', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({})
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ message: 'recovered' })
      });

    const promise = safeFetch('http://retry.com', schema);

    // 1초 대기(첫 재시도 딜레이)
    jest.advanceTimersByTime(1000);

    const result = await promise;

    expect(result.message).toBe('recovered');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('타임아웃이 발생하면 에러를 던진다', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // 영원히 pending
    );

    const promise = safeFetch('http://timeout.com', schema);

    jest.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow(/Timeout/i);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});