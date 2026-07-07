-- HS code turned out to be a confusing field for customers to fill in and
-- isn't actually used operationally — dropping it.
ALTER TABLE "PickupRequest" DROP COLUMN IF EXISTS "hsCode";
