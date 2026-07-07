-- Support cases: an incident staff opens against a specific shipment
-- (lost, damaged, delayed, etc), visible to the customer and tracked
-- through resolution.

DO $$ BEGIN
    CREATE TYPE "CaseType" AS ENUM ('LOST', 'DAMAGED', 'DELAYED', 'WRONG_ITEM', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Case" (
    "id" TEXT NOT NULL,
    "pickupRequestId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "type" "CaseType" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Case_pickupRequestId_idx" ON "Case"("pickupRequestId");
CREATE INDEX IF NOT EXISTS "Case_customerId_idx" ON "Case"("customerId");
CREATE INDEX IF NOT EXISTS "Case_status_idx" ON "Case"("status");

DO $$ BEGIN
    ALTER TABLE "Case" ADD CONSTRAINT "Case_pickupRequestId_fkey"
        FOREIGN KEY ("pickupRequestId") REFERENCES "PickupRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Case" ADD CONSTRAINT "Case_customerId_fkey"
        FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
