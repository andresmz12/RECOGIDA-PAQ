import { normalizePhone } from "@/lib/utils";

// QA/demo bypass for the Square payment gate — add or remove numbers by
// editing TEST_ACCOUNT_PHONES in the environment (comma-separated, any
// format). Railway restarts automatically on env var change; no code
// change or deploy needed to update the list.
export function isTestPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const raw = process.env.TEST_ACCOUNT_PHONES || "";
  if (!raw.trim()) return false;

  const target = normalizePhone(phone);
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .some((p) => normalizePhone(p) === target);
}
