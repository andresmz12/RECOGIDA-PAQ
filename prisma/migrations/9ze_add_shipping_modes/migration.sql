-- Split pricing by shipping modality (maritime by box size vs air per-lb
-- or air fixed-fee-per-item), and record which modality each request used.

ALTER TABLE "Pricing" ADD COLUMN IF NOT EXISTS "shippingMode" TEXT NOT NULL DEFAULT 'MARITIME';
ALTER TABLE "Pricing" ADD COLUMN IF NOT EXISTS "pricePerLb" DOUBLE PRECISION;
ALTER TABLE "Pricing" ADD COLUMN IF NOT EXISTS "minWeight" DOUBLE PRECISION;
ALTER TABLE "Pricing" ADD COLUMN IF NOT EXISTS "maxWeight" DOUBLE PRECISION;

-- Replace the old (country, packageType) unique constraint with one that
-- also includes shippingMode, so a country can have both a maritime and an
-- air price row for the same packageType key.
DROP INDEX IF EXISTS "Pricing_country_packageType_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Pricing_country_shippingMode_packageType_key"
  ON "Pricing"("country", "shippingMode", "packageType");

ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "shippingMode" TEXT NOT NULL DEFAULT 'MARITIME';
