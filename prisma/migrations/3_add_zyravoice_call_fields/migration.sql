-- Add EN_CAMINO to PickupStatus enum
ALTER TYPE "PickupStatus" ADD VALUE 'EN_CAMINO';

-- Add ZyraVoice call tracking fields to PickupRequest
ALTER TABLE "PickupRequest" ADD COLUMN "callStatus" TEXT;
ALTER TABLE "PickupRequest" ADD COLUMN "callAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PickupRequest" ADD COLUMN "lastCallId" TEXT;
ALTER TABLE "PickupRequest" ADD COLUMN "lastCallAt" TIMESTAMP(3);
