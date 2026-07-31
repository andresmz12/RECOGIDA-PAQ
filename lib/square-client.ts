const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";
const SQUARE_BASE_URL =
  SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || "";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "";
// Square requires a fixed API version header — bump deliberately, not
// silently, since response shapes can change between versions.
const SQUARE_API_VERSION = "2024-10-17";

export interface SquarePaymentLink {
  id: string;
  url: string;
  orderId: string;
}

// Quick Pay payment link: simplest Square Payment Links API shape for a
// single flat charge — no cart/line-item breakdown needed for this flow.
export async function createPaymentLink(
  amountCents: number,
  trackingCode: string,
  description: string
): Promise<SquarePaymentLink> {
  if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
    throw new Error("Square is not configured (SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID missing)");
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error(`Refusing to create a Square payment link for a non-positive amount: ${amountCents}`);
  }

  const redirectBase = process.env.NEXTAUTH_URL || "";

  const res = await fetch(`${SQUARE_BASE_URL}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Square-Version": SQUARE_API_VERSION,
    },
    body: JSON.stringify({
      // Ties this call to one specific payment link — Square dedupes
      // retried requests with the same key instead of creating duplicates.
      idempotency_key: `pickup-${trackingCode}`,
      quick_pay: {
        name: description,
        price_money: { amount: amountCents, currency: "USD" },
        location_id: SQUARE_LOCATION_ID,
      },
      checkout_options: {
        redirect_url: redirectBase ? `${redirectBase}/rastreo/${trackingCode}?paid=1` : undefined,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Square createPaymentLink failed: ${res.status} ${errBody}`);
  }

  const data = await res.json();
  const link = data.payment_link;
  if (!link?.id || !link?.url || !link?.order_id) {
    throw new Error(`Square createPaymentLink returned an unexpected shape: ${JSON.stringify(data)}`);
  }

  return { id: link.id, url: link.url, orderId: link.order_id };
}
