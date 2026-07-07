-- International customs/insurance fields. declaredValue/insuranceValue are USD.
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "hsCode" TEXT;
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "declaredValue" DOUBLE PRECISION;
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "insuranceRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "insuranceValue" DOUBLE PRECISION;
