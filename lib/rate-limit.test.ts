import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then blocks", () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    const fourth = rateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(fourth.ok).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("tracks separate keys independently", () => {
    const a = `test:a:${Math.random()}`;
    const b = `test:b:${Math.random()}`;
    rateLimit(a, { limit: 1, windowMs: 60_000 });
    const blocked = rateLimit(a, { limit: 1, windowMs: 60_000 });
    const stillOk = rateLimit(b, { limit: 1, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    expect(stillOk.ok).toBe(true);
  });

  it("resets the count once the window has elapsed", () => {
    vi.useFakeTimers();
    const key = `test:reset:${Math.random()}`;
    expect(rateLimit(key, { limit: 1, windowMs: 1000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 1, windowMs: 1000 }).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, { limit: 1, windowMs: 1000 }).ok).toBe(true);
  });
});
