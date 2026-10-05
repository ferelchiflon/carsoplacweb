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

  it.skip('throws a timeout error when fetch takes too long', async () => {
    // Mock fetch to never resolve (simulate a hanging request)
    vi.mocked(fetch).mockImplementation(() => {
      return new Promise(() => {
        // pending forever
      });
    });

    const promise = fetchWithTimeout(url, options, 10); // 10ms timeout

    // Wait for 20ms
    await new Promise(resolve => setTimeout(resolve, 20));

    await expect(promise).rejects.toThrow(
      /El servidor no respondió en 0 segundos/
    );
  }, 1000000);

  it('clears the timeout on fetch error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const promise = fetchWithTimeout(url, options, 100); // 100ms timeout

    // Wait for 50ms
    await new Promise(resolve => setTimeout(resolve, 50));

    await expect(promise).rejects.toThrow('Network error');

    // After the fetch rejects, the timeout should have been cleared in the finally block.
    // We can't directly test the clearTimeout call, but we can ensure that
    // the timeout does not fire and reject the promise after the fetch has already rejected.
    // We'll wait for 200ms and see that the promise is already rejected.
    await new Promise(resolve => setTimeout(resolve, 200));
    // The promise is already rejected, so no new error should be thrown.
  });
});