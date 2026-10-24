"use client";

/**
 * fetch with automatic retries for flaky mobile connections: a dropped connection ("Load failed" on Safari,
 * "Failed to fetch" on Chrome) or a 502/503/504 is retried up to 3 times with a short backoff.
 */
export async function fetchRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, init);
      if ([502, 503, 504].includes(res.status) && i < attempts - 1) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (i >= attempts - 1) throw new Error("Connection problem. Check your internet and try again.", { cause: e });
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}
