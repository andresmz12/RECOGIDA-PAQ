import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  isValidUSPhone,
  normalizePhone,
  generateTrackingCode,
  generateSecurityCode,
  pickupDateKey,
  formatPickupDate,
} from "./utils";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Juan@Gmail.com  ")).toBe("juan@gmail.com");
  });

  it("treats case variants as equal after normalization", () => {
    expect(normalizeEmail("User@Example.com")).toBe(normalizeEmail("user@EXAMPLE.com"));
  });
});

describe("isValidUSPhone", () => {
  it("accepts a 10-digit number in any punctuation", () => {
    expect(isValidUSPhone("(555) 123-4567")).toBe(true);
    expect(isValidUSPhone("555.123.4567")).toBe(true);
    expect(isValidUSPhone("5551234567")).toBe(true);
  });

  it("accepts an 11-digit number with a leading country code 1", () => {
    expect(isValidUSPhone("+1 (555) 123-4567")).toBe(true);
    expect(isValidUSPhone("15551234567")).toBe(true);
  });

  it("rejects wrong digit counts and non-1 country codes", () => {
    expect(isValidUSPhone("555123456")).toBe(false); // 9 digits
    expect(isValidUSPhone("25551234567")).toBe(false); // 11 digits, not starting with 1
    expect(isValidUSPhone("")).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("adds +1 to a bare 10-digit number", () => {
    expect(normalizePhone("5551234567")).toBe("+15551234567");
  });

  it("adds + to an 11-digit number already starting with 1", () => {
    expect(normalizePhone("15551234567")).toBe("+15551234567");
  });

  it("strips punctuation before normalizing", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("+15551234567");
  });
});

describe("generateTrackingCode", () => {
  it("matches the OGC-XXXXXX format", () => {
    expect(generateTrackingCode()).toMatch(/^OGC-[A-Z0-9]{6}$/);
  });

  it("is not deterministic across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateTrackingCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("generateSecurityCode", () => {
  it("is always 4 digits", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateSecurityCode()).toMatch(/^\d{4}$/);
    }
  });

  it("never repeats the same digit 3+ times", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateSecurityCode();
      const counts: Record<string, number> = {};
      for (const ch of code) counts[ch] = (counts[ch] ?? 0) + 1;
      expect(Math.max(...Object.values(counts))).toBeLessThan(3);
    }
  });
});

describe("pickupDateKey", () => {
  it("keeps the UTC calendar date regardless of local timezone", () => {
    // Stored as UTC-midnight from a plain <input type="date"> — must not
    // shift backward a day for viewers west of UTC.
    expect(pickupDateKey("2026-03-15T00:00:00.000Z")).toBe("2026-03-15");
  });
});

describe("formatPickupDate", () => {
  it("renders in UTC so the displayed day matches what was picked", () => {
    const formatted = formatPickupDate("2026-03-15T00:00:00.000Z", "en-US");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2026");
  });
});
