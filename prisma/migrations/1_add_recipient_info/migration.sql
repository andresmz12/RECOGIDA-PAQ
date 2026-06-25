-- ============================================================
-- Step 1: Remove DISPATCHER from Role enum (correct PostgreSQL method)
-- PostgreSQL does not support dropping enum values directly.
-- We must: update data → create new type → alter column → drop old type
-- ============================================================

-- Move any existing DISPATCHER users to ADMIN so no data is lost
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'DISPATCHER';

-- Create replacement enum without DISPATCHER
CREATE TYPE "Role_new" AS ENUM ('CUSTOMER', 'ADMIN', 'COURIER');

-- Migrate the column to use the new type
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role_new"
  USING "role"::text::"Role_new";

-- Drop the old type and rename the new one
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- ============================================================
-- Step 2: Add new columns to PickupRequest
-- Using IF NOT EXISTS so the migration is idempotent
-- ============================================================

ALTER TABLE "PickupRequest"
  ADD COLUMN IF NOT EXISTS "pickupState"             TEXT,
  ADD COLUMN IF NOT EXISTS "pickupPostalCode"        TEXT,
  ADD COLUMN IF NOT EXISTS "recipientName"           TEXT NOT NULL DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS "recipientEmail"          TEXT,
  ADD COLUMN IF NOT EXISTS "recipientPhone"          TEXT NOT NULL DEFAULT '+1 000-000-0000',
  ADD COLUMN IF NOT EXISTS "recipientPhoneSecondary" TEXT,
  ADD COLUMN IF NOT EXISTS "recipientAddress"        TEXT NOT NULL DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS "recipientCity"           TEXT NOT NULL DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS "recipientState"          TEXT,
  ADD COLUMN IF NOT EXISTS "recipientPostalCode"     TEXT,
  ADD COLUMN IF NOT EXISTS "recipientCountry"        TEXT NOT NULL DEFAULT 'United States',
  ADD COLUMN IF NOT EXISTS "packageContents"         TEXT,
  ADD COLUMN IF NOT EXISTS "notes"                   TEXT;
