import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTrackingCode(): string {
  // Cryptographically secure randomness — the code is the only key that
  // grants access to the public tracking/waybill endpoints.
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  let code = "OGC-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

export function generateSecurityCode(): string {
  // 4-digit pickup verification code the customer hands to the courier.
  // Brute force is stopped server-side by an attempt limit, not by length.
  const bytes = new Uint32Array(1);
  globalThis.crypto.getRandomValues(bytes);
  return String(bytes[0] % 10000).padStart(4, "0");
}

// preferredDate/estimatedPickupDate are stored as UTC-midnight, date-only
// values (from a plain <input type="date">). Formatting them with the
// viewer's local timezone shifts the displayed day backward for anyone
// west of UTC (all of the Americas) — always render/group them in UTC so
// the calendar date shown matches what was actually picked.
export function formatPickupDate(
  date: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, { ...options, timeZone: "UTC" });
}

// YYYY-MM-DD grouping key for a pickup date, immune to viewer timezone.
export function pickupDateKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-CA", { timeZone: "UTC" });
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
