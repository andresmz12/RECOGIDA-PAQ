-- Saved pickup addresses let a customer reuse their sender/pickup address across requests.
CREATE TABLE IF NOT EXISTS "SavedPickupAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPickupAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SavedPickupAddress_userId_idx" ON "SavedPickupAddress"("userId");

DO $$ BEGIN
    ALTER TABLE "SavedPickupAddress" ADD CONSTRAINT "SavedPickupAddress_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
