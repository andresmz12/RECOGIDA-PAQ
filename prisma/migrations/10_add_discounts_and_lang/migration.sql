-- Discount codes managed by admins and applied on the pickup form
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- Applied discount + customer language captured with each pickup request
ALTER TABLE "PickupRequest"
    ADD COLUMN "discountCode" TEXT,
    ADD COLUMN "discountPercent" DOUBLE PRECISION,
    ADD COLUMN "lang" TEXT;

-- Seed the launch promo advertised in the welcome email
INSERT INTO "DiscountCode" ("id", "code", "percent", "active", "createdAt", "updatedAt")
VALUES ('seed_oglobo2026', 'Oglobo2026', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
