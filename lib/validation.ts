// Shared input validation helpers (used on both client and server).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMAIL_RE.test(value.trim());
}

/** Extract just the digits from a phone string. */
export function phoneDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * US phone: 10 digits, or 11 digits starting with the country code "1".
 * (e.g. "(305) 555-0000", "+1 305 555 0000", "3055550000")
 */
export function isValidUSPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  const d = phoneDigits(value);
  return d.length === 10 || (d.length === 11 && d[0] === "1");
}

/** Loose international phone check — at least 7 digits. */
export function isValidIntlPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  return phoneDigits(value).length >= 7;
}

/** Format a valid US phone as "(305) 555-0000"; returns input unchanged otherwise. */
export function formatUSPhone(value: string): string {
  const d = phoneDigits(value);
  const ten = d.length === 11 && d[0] === "1" ? d.slice(1) : d;
  if (ten.length !== 10) return value;
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}
