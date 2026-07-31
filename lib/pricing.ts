import { getShippingConfig, AIR_PER_LB_KEY } from "@/lib/shipping-modes";

// Fallback prices used when no pricing rule is configured in DB.
export const BOX_BASE_FALLBACK: Record<string, number> = {
  "Documento": 15,
  "Caja 18x18x18": 35,
  "Caja 20x20x20": 45,
  "Caja 22x22x22": 55,
  "Caja 24x24x24": 65,
};

export interface PricingRule {
  country: string;
  shippingMode: string;
  packageType: string;
  basePrice: number;
  weightThreshold: number;
  weightRate: number;
  pricePerLb: number | null;
  minWeight: number | null;
  maxWeight: number | null;
}

// Maritime: base box price + surcharge for weight over the included threshold.
export function calcMaritimePrice(
  packageType: string,
  weight: number,
  rule?: PricingRule,
): number {
  const base = rule?.basePrice ?? BOX_BASE_FALLBACK[packageType] ?? 45;
  const threshold = rule?.weightThreshold ?? 20;
  const rate = rule?.weightRate ?? 1.0;
  const extra = Math.max(0, weight - threshold) * rate;
  return base + extra;
}

// Air, per pound: declared weight × the country's per-lb rate. No base fee.
export function calcAirPerLbPrice(weight: number, rule?: PricingRule): number {
  const rate = rule?.pricePerLb ?? 0;
  return rate * weight;
}

// Air, fixed fee by item type (HN/GT/NI): flat price per unit, weight-independent.
export function calcAirFixedItemPrice(rule?: PricingRule): number {
  return rule?.basePrice ?? 0;
}

function ruleFor(rules: PricingRule[], country: string, mode: "MARITIME" | "AIR", packageType: string) {
  return rules.find((r) => r.country === country && r.shippingMode === mode && r.packageType === packageType);
}

export interface PriceableItem {
  packageType: string;
  estimatedWeight?: number | string | null;
}

export interface PriceInput {
  shippingMode: "MARITIME" | "AIR";
  destinationCountry: string;
  // For AIR/PER_LB: total shipment weight. Ignored otherwise.
  airWeight?: number | string | null;
  // For MARITIME and AIR/FIXED_ITEM: one or more boxes/items. Falls back to
  // a single implicit item (packageType/estimatedWeight) if omitted, to
  // match requests that don't go through the multi-box UI.
  items?: PriceableItem[];
  packageType?: string;
  estimatedWeight?: number | string | null;
}

// Thrown by calculatePriceCents when no DB Pricing row exists for an AIR
// line item — unlike maritime (which has BOX_BASE_FALLBACK, a deliberate
// business default), there is no sane fallback air rate. Letting this
// silently price at $0 would skip the Square payment gate entirely for a
// destination/item combo whose pricing was simply never configured.
export class PricingRuleNotFoundError extends Error {}

// Single source of truth for pricing math — used both server-side (to
// compute the actual charge for a Square payment link) and by the /recoger
// form (to show a live estimate). Keeping this in one place means the
// quoted estimate and the amount actually charged can never drift apart.
export function calculatePriceCents(input: PriceInput, pricingRules: PricingRule[]): number {
  const { shippingMode, destinationCountry } = input;
  const airKind = getShippingConfig(destinationCountry).air;

  let total: number;

  if (shippingMode === "AIR" && airKind === "PER_LB") {
    const weight = parseFloat(String(input.airWeight ?? "")) || 0;
    const rule = ruleFor(pricingRules, destinationCountry, "AIR", AIR_PER_LB_KEY);
    if (!rule) {
      throw new PricingRuleNotFoundError(`No AIR/PER_LB pricing rule configured for ${destinationCountry}`);
    }
    total = calcAirPerLbPrice(weight, rule);
  } else {
    const isFixedItem = shippingMode === "AIR" && airKind === "FIXED_ITEM";
    const items: PriceableItem[] = input.items?.length
      ? input.items
      : [{ packageType: input.packageType ?? "", estimatedWeight: input.estimatedWeight }];

    total = items.reduce((sum, item) => {
      if (isFixedItem) {
        const rule = ruleFor(pricingRules, destinationCountry, "AIR", item.packageType);
        if (!rule) {
          throw new PricingRuleNotFoundError(
            `No AIR/FIXED_ITEM pricing rule configured for ${destinationCountry}/${item.packageType}`
          );
        }
        return sum + calcAirFixedItemPrice(rule);
      }
      // Maritime intentionally falls back to BOX_BASE_FALLBACK when
      // unconfigured — a real (if generic) price, not a $0 skip.
      const weight = parseFloat(String(item.estimatedWeight ?? "")) || 0;
      const rule = ruleFor(pricingRules, destinationCountry, "MARITIME", item.packageType);
      return sum + calcMaritimePrice(item.packageType, weight, rule);
    }, 0);
  }

  return Math.round(total * 100);
}

// Clamp defensively — a discount percent ultimately comes from the DB with
// no DB-level bound, so a bad value must never produce a negative charge.
export function applyDiscountCents(priceCents: number, discountPercent: number | null | undefined): number {
  if (!discountPercent) return priceCents;
  const pct = Math.min(100, Math.max(0, discountPercent));
  return Math.max(0, Math.round(priceCents * (1 - pct / 100)));
}
