-- Square payment link flow: a pickup is created in DRAFT (unpaid) and only
-- becomes a real PENDING request once Square confirms payment.
ALTER TYPE "PickupStatus" ADD VALUE 'DRAFT';

ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "priceCents" INTEGER;
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'UNPAID';
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "squarePaymentLinkId" TEXT;
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "squarePaymentLinkUrl" TEXT;
ALTER TABLE "PickupRequest" ADD COLUMN IF NOT EXISTS "squareOrderId" TEXT;

CREATE INDEX IF NOT EXISTS "PickupRequest_squareOrderId_idx" ON "PickupRequest"("squareOrderId");
