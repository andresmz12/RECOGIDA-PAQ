// Shipping modality rules per destination country, based on O'Globo Cargo's
// 2026 sales kit (Modalidades de Envío por País). This is the single source
// of truth for both the admin pricing panel and the public pickup form.

export type ShippingMode = "MARITIME" | "AIR";
export type AirPricingKind = "PER_LB" | "FIXED_ITEM" | null;

export interface CountryShippingConfig {
  maritime: boolean;
  air: AirPricingKind;
  /** Only meaningful when air === "PER_LB" */
  airWeightMin?: number;
  airWeightMax?: number;
}

export const COUNTRY_SHIPPING_CONFIG: Record<string, CountryShippingConfig> = {
  HN: { maritime: true, air: "FIXED_ITEM" },
  GT: { maritime: true, air: "FIXED_ITEM" },
  NI: { maritime: true, air: "FIXED_ITEM" },
  SV: { maritime: true, air: null },
  DO: { maritime: true, air: null },
  PA: { maritime: true, air: "PER_LB", airWeightMin: 15, airWeightMax: 40 },
  CR: { maritime: true, air: "PER_LB", airWeightMin: 10 },
  VE: { maritime: true, air: null },
  MX: { maritime: true, air: null },
  CO: { maritime: false, air: "PER_LB", airWeightMin: 10, airWeightMax: 110 },
  EC: { maritime: false, air: "PER_LB", airWeightMin: 8, airWeightMax: 8 },
};

export function getShippingConfig(countryCode: string): CountryShippingConfig {
  return COUNTRY_SHIPPING_CONFIG[countryCode] ?? { maritime: true, air: null };
}

// Fixed-fee air item categories for Honduras/Guatemala/Nicaragua — priced
// per unit regardless of weight, per O'Globo Cargo's published rate card.
export const AIR_ITEM_TYPES = [
  "Paquete Normal",
  "Tableta",
  "Celular",
  "Laptop",
  "Sobre",
] as const;

export type AirItemType = (typeof AIR_ITEM_TYPES)[number];

// Sentinel packageType used for the single per-pound air rate row (there's
// no per-size breakdown for air-per-lb — one rate covers the whole country).
export const AIR_PER_LB_KEY = "AIR_PER_LB";
