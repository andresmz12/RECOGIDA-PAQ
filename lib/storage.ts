import crypto from "crypto";

// Optional Cloudinary-backed image storage. When the CLOUDINARY_* env vars are
// set, inline base64 images are uploaded and replaced with a hosted URL so they
// don't bloat the Postgres row. When they are NOT set, the original value is
// returned unchanged — the app keeps working with inline data URLs as before.

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = process.env.CLOUDINARY_FOLDER || "oglobo/proofs";

export function storageConfigured(): boolean {
  return Boolean(CLOUD && KEY && SECRET);
}

/**
 * If `value` is an inline data URL and Cloudinary is configured, upload it and
 * return the hosted secure URL. Otherwise return `value` unchanged so callers
 * can store whatever they already had (graceful fallback, never throws).
 */
export async function maybeUploadImage(
  value: string | null | undefined
): Promise<string | null | undefined> {
  if (!value) return value;
  if (!value.startsWith("data:")) return value; // already a URL
  if (!storageConfigured()) return value; // keep inline data URL

  try {
    const timestamp = Math.round(Date.now() / 1000).toString();
    // Cloudinary signs the alphabetically-sorted params (excluding file/api_key).
    const toSign = `folder=${FOLDER}&timestamp=${timestamp}${SECRET}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    const form = new FormData();
    form.append("file", value);
    form.append("api_key", KEY!);
    form.append("timestamp", timestamp);
    form.append("folder", FOLDER);
    form.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
      { method: "POST", body: form }
    );

    if (!res.ok) {
      console.error("[storage] Cloudinary upload failed:", res.status);
      return value; // fallback to inline
    }

    const data = await res.json();
    return (data.secure_url as string) || value;
  } catch (err) {
    console.error("[storage] upload error:", err);
    return value;
  }
}
