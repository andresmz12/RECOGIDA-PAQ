-- Saved recipients let a customer reuse recipient info across requests.
CREATE TABLE IF NOT EXISTS "SavedRecipient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "recipientPhoneSecondary" TEXT,
    "recipientEmail" TEXT,
    "recipientAddress" TEXT NOT NULL,
    "recipientCity" TEXT NOT NULL,
    "recipientState" TEXT,
    "recipientPostalCode" TEXT,
    "recipientCountry" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedRecipient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SavedRecipient_userId_idx" ON "SavedRecipient"("userId");

DO $$ BEGIN
    ALTER TABLE "SavedRecipient" ADD CONSTRAINT "SavedRecipient_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
