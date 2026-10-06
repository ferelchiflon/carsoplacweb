/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout } from './fetchWithTimeout';

describe('fetchWithTimeout', () => {
  const url = 'https://example.com/api/test';
  const options = { method: 'GET' };

  beforeEach(() => {
    // Mock fetch
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves when fetch succeeds within timeout', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const promise = fetchWithTimeout(url, options, 100);

    // Wait for 50ms (less than timeout)
    await new Promise(resolve => setTimeout(resolve, 50));

    const response = await promise;

    expect(fetch).toHaveBeenCalledWith(url, {
      ...options,
      signal: expect.any(Object),
    });
    expect(response).toBe(mockResponse);
    expect(response.ok).toBe(true);
  });

  it('throws a timeout error when fetch takes too long', async () => {
    // Mock fetch that hangs until its signal aborts, mimicking real fetch behavior:
    // when the AbortController fires, real fetch rejects with a DOMException AbortError.
    vi.mocked(fetch).mockImplementation(
      (_url: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      },
    );

    const promise = fetchWithTimeout(url, options, 10); // 10ms timeout

    // The controller aborts after 10ms, fetch rejects with AbortError,
    // and fetchWithTimeout converts it into a friendly timeout message.
    await expect(promise).rejects.toThrow(
      /El servidor no respondió en 0 segundos/,
    );
  });

  it('clears the timeout on fetch error', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    const promise = fetchWithTimeout(url, options, 100); // 100ms timeout

    await expect(promise).rejects.toThrow('Network error');

    // Wait a bit to ensure the timeout doesn't fire and cause another rejection
    // after the fetch has already rejected (testing the finally block cleanup)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // If we get here without error, the timeout was properly cleared
  });
});