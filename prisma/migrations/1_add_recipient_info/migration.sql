-- Remove DISPATCHER from Role enum
-- AlterEnum
ALTER TYPE "Role" RENAME VALUE 'DISPATCHER' TO 'DISPATCHER_REMOVED';

-- DropEnum
DROP TYPE "Role";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN', 'COURIER');

-- AlterTable PickupRequest - Add new fields for recipient info
ALTER TABLE "PickupRequest" ADD COLUMN "pickupState" TEXT,
ADD COLUMN "pickupPostalCode" TEXT,
ADD COLUMN "recipientName" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN "recipientEmail" TEXT,
ADD COLUMN "recipientPhone" TEXT NOT NULL DEFAULT '+1 000-000-0000',
ADD COLUMN "recipientPhoneSecondary" TEXT,
ADD COLUMN "recipientAddress" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN "recipientCity" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN "recipientState" TEXT,
ADD COLUMN "recipientPostalCode" TEXT,
ADD COLUMN "recipientCountry" TEXT NOT NULL DEFAULT 'United States',
ADD COLUMN "packageContents" TEXT,
ADD COLUMN "notes" TEXT;

-- Make defaults consistent by updating any NULLs (should not exist but just in case)
UPDATE "PickupRequest" SET "recipientName" = 'Unknown' WHERE "recipientName" IS NULL;
UPDATE "PickupRequest" SET "recipientPhone" = '+1 000-000-0000' WHERE "recipientPhone" IS NULL;
UPDATE "PickupRequest" SET "recipientAddress" = 'Unknown' WHERE "recipientAddress" IS NULL;
UPDATE "PickupRequest" SET "recipientCity" = 'Unknown' WHERE "recipientCity" IS NULL;
UPDATE "PickupRequest" SET "recipientCountry" = 'United States' WHERE "recipientCountry" IS NULL;
