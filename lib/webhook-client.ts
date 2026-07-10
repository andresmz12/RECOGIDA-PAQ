import crypto from "crypto";

const TIMEOUT_MS = 5_000;

function signPayload(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export async function sendWebhook(
  url: string,
  payload: unknown,
  secret: string
): Promise<{ ok: boolean; status: number }> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RecogidaPaq-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return { ok: res.ok, status: res.status };
}
